# Adding a new post

The blog uses Hugo's native multilingual mode. Russian is the default, unprefixed language (`/posts/<slug>.html`); English lives under `/en/` (`/en/posts/<slug>.html`). Each language is a **separate content file** sharing the same base filename — `content/posts/<slug>.ru.md` and `content/posts/<slug>.en.md`. Hugo pairs them automatically by that shared filename; there's nothing else to wire up.

A post can exist in **both** languages (the normal case) or in **just one** (see below). There is no marker syntax, no `|||` splitting, no dual-language spans — every content file is plain, single-language Markdown.

## Adding a bilingual post (both languages)

1. Pick a slug (ASCII, kebab-case, matches the URL and filename) — e.g. `my-new-post`.
2. Scaffold both files from the archetype:
   ```
   hugo new posts/my-new-post.ru.md
   hugo new posts/my-new-post.en.md
   ```
3. Fill in front matter on **each** file separately (see "Front matter reference" below). `date` should normally match on both files (same publish date), everything else is independent per language.
4. Write the body on each file in that file's own language — see "Body conventions" below.
5. Preview locally with `hugo server` and check the post at both `http://localhost:1313/posts/my-new-post.html` and `http://localhost:1313/en/posts/my-new-post.html`. Confirm the language switcher on the post correctly links between the two.

## Adding a single-language post (RU-only or EN-only)

Same as above, but create **only one** of the two files — e.g. just `content/posts/my-new-post.ru.md`, and skip the `.en.md` file entirely (or vice versa for an English-only post).

Nothing else needs to change:
- The post simply won't exist on the other language's site — it's absent from that language's post list, archive, RSS, and sitemap. This is standard Hugo multilingual behavior, not a special case to configure.
- The language switcher (`#lang-btn` in the header) checks `.IsTranslated` — since there's no translation, it automatically falls back to linking to the other language's home page instead of a 404. No template changes needed.
- If you later write the missing translation, just add the second file with the same slug — Hugo pairs it up automatically and the switcher starts linking directly to it.

## Front matter reference

```yaml
---
title: "Post title in this file's language"
date: 2026-01-15
description: "One or two sentences — used in card/list views and the meta description tag."
tags: []
---
```

- `title`, `description` — plain text, this language only (no `_en` suffix — that convention belongs to the old marker scheme and no longer applies).
- `date` — same value on both language files for a bilingual post.
- `tags` — currently unused sitewide (no tag pages are wired up yet); leave as `[]` unless asked to change that.
- Do **not** add a `url:` override — the flat `.html` URL is produced automatically from the filename (`uglyURLs = true` + the language prefix rules in `hugo.toml`). The only content files that still need an explicit `url:` are the two `posts/_index.*.md` list pages, which are already set up and shouldn't need touching for a normal new post.

## Body conventions

- The first line of the body is a short intro paragraph wrapped in `<p>...</p>` (matches the site's existing posts) — plain text in that file's language, no language spans.
- Section headings use plain Markdown with an **explicit ASCII anchor**: `## Section Title {#section-title}` (`###` for subsections). The `{#slug}` is required, not decorative — without it Hugo auto-generates an id from the heading text, which breaks for Cyrillic headings (percent-encoding mismatch between the generated `href` and `id`) and breaks the in-page TOC scrollspy in `static/js/modules/navigation.js`.
- Anchors must be unique **within a single post** — two headings sharing the same `{#slug}` in one file fails the build (`layouts/_default/_markup/render-heading.html` errors on it intentionally). Anchors don't need to match between the `.ru.md`/`.en.md` pair, but keeping them the same is good practice (makes it easier to keep the TOC structurally aligned across languages).
- The right-hand table of contents on a post page is generated automatically from `##`/`###` headings — no manual TOC markup needed.

## Checking your work

- `hugo server` — dev preview at `http://localhost:1313`.
- `hugo --gc --minify` — one-off production-style build to `public/` (gitignored); open `public/posts/<slug>.html` directly via `file://` to sanity-check the post outside of any server.
- No baseURL is configured for local builds on purpose (see `CLAUDE.md`), so local links stay relative and never point at the live production domain.
