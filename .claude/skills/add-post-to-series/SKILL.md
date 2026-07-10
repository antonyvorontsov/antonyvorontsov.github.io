---
name: add-post-to-series
description: Adds an existing post in this Hugo bilingual (ru/en) blog to a post series — creating the series' description pages if needed, assigning it a number, and updating the post's front matter. This skill is scoped to the series-editor subagent; delegate series-editing requests to that subagent via the Agent tool rather than invoking this skill directly from the main conversation.
---

# Add Post to Series

Attaches one post (or its ru/en pair) under `content/posts/` to a series,
creating the series' `content/series/` pages on demand.

See CLAUDE.md's "Series" bullet (under "Template structure") for the
authoritative schema and URL scheme this skill follows; CLAUDE.md is the
source of truth if they ever diverge.

## Step 0 — find the target post

Optional argument: a slug (e.g. `retry-budgets`) or a path to either
language file. If omitted, run `git status --porcelain` and
`git diff --name-only` on `content/posts/`, excluding `_index.*.md`,
and derive candidate slugs from any new/modified files.
- One candidate → confirm it with the user before proceeding.
- None → ask the user for a slug/path.
- Several → ask the user which one.

Check which of `content/posts/<slug>.ru.md` / `.en.md` exist, and whether
either already has a `series:` field (if so, confirm with the user that
they want to reassign it rather than silently overwriting).

## 1. Choose the series

Read `content/series/*.md` to list existing series (id = filename base,
title = front matter `title`). Ask the user:
- An existing series id, or
- A new series.

If new, ask for:
- A unique id: English, hyphenated, no spaces (e.g. `distributed-systems`).
  Reject if `content/series/<id>.*.md` already exists.
- The series title in Russian and in English.
- An optional description (plain text/paragraphs) — may be left blank for
  now and filled in later.

## 2. Choose the number

List existing posts in that series on the language(s) being edited. YAML
allows `name:` to be written double-quoted, single-quoted, or unquoted, so
grep for the id loosely rather than assuming double quotes —
(`grep -lE "name: *[\"']?<id>[\"']?\s*$" content/posts/*.<lang>.md`, then
read each matched file's `series.number`, and also read the same file's
`series.number` *type* as written — an unquoted `2` and a quoted `"2"` both
display as "2" but are different YAML types, and the build-time duplicate
check in `layouts/series/single.html` only catches a collision if both
posts use the same type; if you spot a mismatch while assigning a number,
normalize both to unquoted integers). Propose `max(number) + 1` (or `1` for
a brand-new series). Let the user override. Before writing anything, verify
no other post in the series already uses the chosen number on the same
language — if it does, stop and ask the user to resolve the collision (this
mirrors the build-time `errorf` in `layouts/series/single.html`, but
catches it before a build is even attempted).

## 3. Create the series pages (new series only)

If `content/series/<id>.ru.md` doesn't exist, create it:
```yaml
---
title: "<Russian title>"
description: "<same text as the body paragraph below>"
url: /series/<id>.html
outputs: [html]
---

<description, or a short placeholder like "Серия постов о <теме>." if none was given>
```
And `content/series/<id>.en.md`:
```yaml
---
title: "<English title>"
description: "<same text as the body paragraph below>"
url: /en/series/<id>.html
outputs: [html]
---

<description, or a short placeholder like "A series about <topic>." if none was given>
```
The front-matter `description:` mirrors the body paragraph (same convention
regular posts use) — it's what populates the series page's meta description
*and* the text shown under the title in search results
(`layouts/index.searchindex.json` reads `Params.description`; without it,
the series entry in search shows a title with no context). Only create the
language file(s) matching the post language(s) being edited if the series
is meant to stay single-language; otherwise create both.

## 4. Update the post's front matter

Add or replace the `series` block, placed immediately after `tags:`:
```yaml
series:
  name: "<id>"
  number: <n>
```
Apply to whichever of `.ru.md`/`.en.md` the user is attaching (usually
both, using the same id and number — a series entry should mean the same
position on both languages).

## 5. Confirm before saving

Show the user a summary before writing any file: series id + title,
assigned number, the full current post list of that series (old + new,
in order), and the series page URL(s) as they'll resolve
(`/series/<id>.html`, `/en/series/<id>.html`). Give the user a chance to
cancel or adjust before applying the edits.

## Output

After applying: confirm what was written (series page(s) created or
reused, post(s) updated), the final ordered post list for the series, and
the series page link(s).
