---
name: validate-blog-post
description: Runs the pre-publish check on a blog post in this Hugo bilingual (ru/en) blog — bilingual pairing, heading anchors, grammar/punctuation, and Markdown/code formatting. This skill is scoped to the blog-post-validator subagent; delegate blog-post validation requests to that subagent via the Agent tool rather than invoking this skill directly from the main conversation.
---

# Validate Blog Post

Four checks against one post (or its ru/en pair) in `content/posts/`. Each
check has its own report-vs-apply rule:

| # | Check | Action |
|---|---|---|
| 1 | Bilingual pairing | Confirm with user, then translate if missing |
| 2 | Heading anchors | Report + suggest a fix — never edit |
| 3 | Grammar/punctuation | Report as a table — never edit |
| 4 | Markdown/code formatting | Auto-apply directly (mechanical only) |

**Hard boundary: never change what a post says.** Translation must be
meaning-preserving (language only). Steps 2–3 are proposals, not edits.
Step 4 touches whitespace and code style only — never wording. Never run
`npm`/`node`/an installed formatter binary (this repo has no build
tooling by design, per CLAUDE.md) — format code by hand.

See CLAUDE.md's "Bilingual content model" section for the authoritative
front-matter schema and heading-anchor rule; this skill mirrors those
rules but CLAUDE.md is the source of truth if they ever diverge.

## Step 0 — find the target post

Optional argument: a slug (e.g. `retry-budgets`) or a path to either
language file. If omitted, run `git status --porcelain` and
`git diff --name-only` on `content/posts/`, excluding `_index.*.md`,
and derive candidate slugs from any new/modified files.
- One candidate → use it.
- None → ask the user for a slug/path.
- Several → ask the user which one.

Then check which of `content/posts/<slug>.ru.md` / `.en.md` exist.

## 1. Bilingual pairing

- Both files exist: proceed to steps 2–4 for each. Also compare `date:`
  across both — flag a mismatch in the summary (report only).
- Only one exists: ask the user for confirmation before translating
  ("`<slug>.ru.md` is missing — translate the English post into Russian
  and create it?"). If yes, translate faithfully — same structure,
  headings, and front-matter shape, only the language changes — and save
  as the missing file. If no, note it stayed single-language and skip
  steps 2–3 for the missing language.
- Neither exists: report that the slug/path doesn't resolve to a post
  and stop.

## 2. Heading anchors — report only

Every `##`/`###` heading needs an explicit anchor `{#slug}` matching
`^[a-z0-9]+(-[a-z0-9]+)*$`, unique within the file (Hugo's build fails
otherwise — see CLAUDE.md). For each missing, malformed, or duplicate
anchor, propose a specific replacement slug derived from the heading text.
Example: heading "Тайм-ауты и ретраи" with no anchor → suggest
`{#retries-and-timeouts}`. Do not edit the file.

## 3. Grammar & punctuation — report only

Read each file's body in its own language (Russian norms for `.ru.md`,
English norms for `.en.md`). Flag only genuine grammar/punctuation/
spelling/agreement errors — not style or rewording. Report as a table:

| Location | Original | Suggested fix |
|---|---|---|

State "no issues found" explicitly if the table is empty. Never edit
the file.

## 4. Markdown & code formatting — auto-apply

The only step that edits files, and only mechanically:

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

Report one summary per post, covering all four checks even when a check
found nothing (state "no issues" explicitly — that's the signal the
check ran). Include: pairing status, heading-anchor findings with
suggested fixes, the grammar table, and what formatting was auto-applied.
End with a one-line reminder that anchor/grammar fixes are proposals to
apply manually, then re-run the skill to confirm a clean pass.
