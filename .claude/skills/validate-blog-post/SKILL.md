---
name: validate-blog-post
description: Runs the pre-publish check on a blog post in this Hugo bilingual (ru/en) blog — bilingual pairing, heading anchors, grammar/punctuation, and Markdown/code formatting — and can also scaffold a brand-new post directly from pasted text (asking about translation, tags, and date first). This skill is scoped to the blog-post-validator subagent; delegate blog-post validation and post-creation-from-text requests to that subagent via the Agent tool rather than invoking this skill directly from the main conversation.
---

# Validate Blog Post

Two entry points, chosen in Step 0:

- **Mode A — validate an existing post.** A post (or its ru/en pair) already
  living in `content/posts/`, found via an argument or `git status`/`git diff`.
  Runs the four checks below against it.
- **Mode B — create a new post from pasted text.** The user pastes raw post
  content in the prompt itself and asks to validate it or "turn it into a
  post" — there's no existing file yet. Asks three questions (translation,
  tags, date), scaffolds the page bundle, then runs the same checks against
  what it just created.

Four checks, each with its own report-vs-apply rule:

| # | Check | Action |
|---|---|---|
| 1 | Bilingual pairing | Confirm with user, then translate if missing |
| 2 | Heading anchors | Mode A: report + suggest a fix, never edit. Mode B: write directly while scaffolding — there's no prior authored anchor to preserve |
| 3 | Grammar/punctuation | Report as a table — never edit |
| 4 | Markdown/code formatting | Auto-apply directly (mechanical only) |

**Hard boundary: never change what a post says.** Translation must be
meaning-preserving (language only). Checks 2–3 are proposals in Mode A, never
edits. Check 4 touches whitespace and code style only — never wording. Never
run `npm`/`node`/an installed formatter binary (this repo has no build
tooling by design, per CLAUDE.md) — format code by hand. In Mode B, tags/
title/description are generated *from* the pasted content, not invented — if
the content doesn't support a claim, don't add it.

See CLAUDE.md's "Bilingual content model" section for the authoritative
front-matter schema and heading-anchor rule; this skill mirrors those
rules but CLAUDE.md is the source of truth if they ever diverge.

## Step 0 — determine mode

- The user names a slug/path, or `git status --porcelain` / `git diff
  --name-only` on `content/posts/` (excluding `_index.*.md`) shows a new or
  modified post file → **Mode A**. Go to "Mode A — find the target post."
- The user's message instead contains the actual post body pasted inline —
  not a reference to something already in the repo — and asks to validate
  or convert it into a post → **Mode B**. Go to "Mode B — new post from
  pasted text." Do not go looking for a matching file in `content/posts/`.
- Unclear which → ask the user directly.

## Mode A — find the target post

Optional argument: a slug (e.g. `retry-budgets`) or a path to either
language file. If omitted, run `git status --porcelain` and
`git diff --name-only` on `content/posts/`, excluding `_index.*.md`,
and derive candidate slugs from any new/modified files.
- One candidate → use it.
- None → ask the user for a slug/path.
- Several → ask the user which one.

Then check which of `content/posts/*-<slug>/index.ru.md` / `index.en.md` exist
(each post is a page bundle — a numbered directory containing `index.<lang>.md`
files, not a flat `<slug>.<lang>.md` pair; the numeric prefix is sort-order only
and isn't part of the slug). Proceed to "Checks 1–4" below.

## Mode B — new post from pasted text

Gather the three answers below in order, then scaffold, then run checks 3–4
against the result (skip checks 1–2 — the translation decision here already
covers what check 1 would otherwise ask, and anchors get written directly
in B4 rather than proposed).

### B1. Detect language and ask about translation

Read the pasted text and determine whether it's predominantly Russian or
English (majority-script heuristic; ask the user directly only if genuinely
mixed/ambiguous).

- Written in Russian → ask: translate into English too, to publish
  bilingually? (Recommended: yes.)
- Written in English → ask: translate into Russian too, to publish
  bilingually? (Recommended: yes.)

If the user declines, the post stays single-language (see "Одноязычный
пост" in `specs/guides/add-new-post.md`) — only the original-language file
gets created. If they accept, translate faithfully in B4 (same structure,
headings, frontmatter shape — only the language changes, per the hard
boundary above).

### B2. Tags

Skip this question if the user's own prompt already named the tags to use.
Otherwise ask:
- Derive tags from the content automatically (recommended) — kebab-case,
  English, following existing conventions
  (`specs/conventions/naming.md#теги`); prefer reusing an existing tag over
  minting a near-duplicate (check `content/posts/*/index.*.md` or the
  `/tags/` archive before inventing a new one).
- User supplies the tag list themselves.
- No tags (`tags: []`).

### B3. Date

Skip this question if the user's own prompt already gave a date. Otherwise
ask:
- Today's date (recommended), or
- A different date (ask which).

### B4. Scaffold the post

With language/tags/date decided:

1. Derive a slug: a real English kebab-case phrase capturing the topic —
   **never transliteration**, even when the source text is Russian and
   stays Russian-only
   (`specs/conventions/naming.md#слаг--всегда-настоящий-английский-не-транслит`).
   Check it doesn't collide with an existing `content/posts/*-<slug>/`.
2. Pick the directory number: `ls content/posts/`, take `max + 1`,
   zero-padded (`07`, not `7`). If the chosen date sorts *before* an
   existing post's date, flag the mismatch to the user (the numeric prefix
   is meant to reflect chronological order — see ADR-10) and ask whether to
   renumber to keep it in order or just append; don't silently pick one.
3. Create `content/posts/<NN>-<slug>/` and write `index.<lang>.md` for the
   original language (and, if translating, `index.<other-lang>.md`) with:
   - `title`, `description` (1–2 sentences, generated from the content),
     `date`, `tags`, `slug` — per
     `specs/data-model/frontmatter-reference.md#пост`.
   - Body: wrap the intro in `<p>...</p>`, keep the rest of the pasted
     structure, and add an explicit ASCII `{#anchor}` to every `##`/`###`
     heading (generated from the heading text, unique within the file) —
     this is the one place this skill *writes* anchors instead of just
     proposing them, since there's no previously-authored anchor to
     preserve.
   - If translating, translate faithfully into the second file — same
     structure/headings/frontmatter shape, matching anchors where
     sensible, only the language differs.
4. Run checks 3–4 (grammar, formatting) against the newly written file(s)
   as a self-check, same rules as Mode A.

## Checks 1–4

### 1. Bilingual pairing (Mode A)

- Both files exist: proceed to checks 2–4 for each. Also compare `date:`
  across both — flag a mismatch in the summary (report only).
- Only one exists: ask the user for confirmation before translating
  ("`index.ru.md` is missing — translate the English post into Russian
  and create it?"). If yes, translate faithfully — same structure,
  headings, and front-matter shape, only the language changes — and save
  as the missing file. If no, note it stayed single-language and skip
  checks 2–3 for the missing language.
- Neither exists: report that the slug/path doesn't resolve to a post
  and stop.

### 2. Heading anchors

Every `##`/`###` heading needs an explicit anchor `{#slug}` matching
`^[a-z0-9]+(-[a-z0-9]+)*$`, unique within the file (Hugo's build fails
otherwise — see CLAUDE.md). For each missing, malformed, or duplicate
anchor, propose a specific replacement slug derived from the heading text.
Example: heading "Тайм-ауты и ретраи" with no anchor → suggest
`{#retries-and-timeouts}`. Do not edit the file — Mode A only; in Mode B
anchors are written directly in B4, so this check doesn't apply there.

### 3. Grammar & punctuation

Read each file's body in its own language (Russian norms for `.ru.md`,
English norms for `.en.md`). Flag only genuine grammar/punctuation/
spelling/agreement errors — not style or rewording. Report as a table:

| Location | Original | Suggested fix |
|---|---|---|

State "no issues found" explicitly if the table is empty. Never edit
the file.

### 4. Markdown & code formatting

The only check that edits files outright, and only mechanically:

- Collapse multiple blank lines to one; ensure exactly one blank line
  between block-level elements (paragraphs, headings, lists, code
  fences); strip stray leading indentation from paragraphs/list items.
  Leave front matter and wording untouched.
- Reformat code inside fenced blocks to that language's standard
  convention, applied by hand (no external formatter): e.g. C# → Allman
  braces + 4-space indent; JSON/YAML → 2-space indent; shell → 2-space
  indent; otherwise use the language's idiomatic style. Never change
  logic, identifiers, literals, or comment wording — whitespace and
  brace placement only.

## Output

**Mode A:** report one summary per post, covering all four checks even
when a check found nothing (state "no issues" explicitly — that's the
signal the check ran). Include: pairing status, heading-anchor findings
with suggested fixes, the grammar table, and what formatting was
auto-applied. End with a one-line reminder that anchor/grammar fixes are
proposals to apply manually, then re-run the skill to confirm a clean
pass.

**Mode B:** report what was created — directory and file(s) written,
whether it's bilingual or single-language, the chosen slug/number/date/tags
(and how each was decided: auto vs. user-supplied), the generated
title/description, then the grammar table and formatting changes from the
B4 self-check. End with the same reminder: re-run the skill (Mode A, now
that the file exists) after applying any grammar fixes, to confirm a clean
pass.
