# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It is a dense pointer into [`specs/`](specs/README.md), the actual source of truth — see `specs/README.md` for the full map. If this file and `specs/` ever disagree, trust the code and fix whichever doc is stale (`specs/README.md`'s own rule).

## What this is

Personal bilingual (ru/en) blog for Anton Vorontsov, built as a Hugo static site. Deployed to GitHub Pages at `vorontsov.dev`. No JS framework, no CSS framework, no npm/node, no Hugo Pipes — plain HTML/CSS/JS and Go templates only. Keep it that way; do not introduce a build pipeline, bundler, or third-party CSS/JS library without being asked. See [`specs/architecture/tech-stack.md`](specs/architecture/tech-stack.md) and ADR-5 in [`specs/decisions/architecture-decisions.md`](specs/decisions/architecture-decisions.md).

`legacy-site/` is the pre-Hugo version of the site (hand-written HTML/CSS/JS), kept only for reference/rollback. It is not built, not deployed, and nothing in `layouts/`/`static/` should link to it.

## Commands

- `hugo server` — dev preview at http://localhost:1313 (also runnable via the `.claude/launch.json` config named `hugo-server`, e.g. through the Preview tool).
- `hugo` — one-off build, outputs to `public/` (gitignored). No `baseURL` is configured locally (see "Domain handling" below), so links stay relative and `public/*.html` can be opened directly via `file://`.
- Adding a new post: see `specs/guides/add-new-post.md` — it covers both the normal bilingual case and RU-only/EN-only posts.
- Validating a post before publishing: delegate to the `blog-post-validator` subagent (via the Agent tool) — it has scoped access to the `validate-blog-post` skill (`.claude/skills/validate-blog-post/SKILL.md`). Don't invoke that skill directly from the main conversation.
- Adding an existing post to a series: delegate to the `series-editor` subagent (via the Agent tool) — it has scoped access to the `add-post-to-series` skill (`.claude/skills/add-post-to-series/SKILL.md`). Don't invoke that skill directly from the main conversation.
- No lint/test commands — this is a content site, not an application. "Tests" are `hugo server` + visual check of both languages (see [`specs/guides/checklists.md`](specs/guides/checklists.md)).
- CI builds with `hugo --gc --minify --baseURL "<pages-url>/"` on push to `master` (`.github/workflows/hugo.yml`), and does a deploy-less `hugo --gc --minify` build-check on every PR into `master` (`.github/workflows/hugo-pr-check.yml`) so `errorf` failures are caught before merge, not only at deploy. Both install Hugo Extended via a pinned version (`HUGO_VERSION` env var, keep the two files in sync), not `hugo-bin`/npm. See [`specs/architecture/build-and-deploy.md`](specs/architecture/build-and-deploy.md).

## Domain handling — the only place `vorontsov.dev` may appear is `static/CNAME`

`hugo.toml` has no `baseURL` — the production domain is owned entirely by GitHub Pages/Actions, not by the repo's Hugo config. **Never** reintroduce `baseURL` in `hugo.toml` and **never** hardcode the domain in a template or a hand-written static redirect — a local `public/index.html` opened via `file://` used to redirect to the live prod site before this was fixed. CI supplies the real URL via `actions/configure-pages` + `--baseURL`. Full rationale: ADR-4 in [`specs/decisions/architecture-decisions.md`](specs/decisions/architecture-decisions.md), [`specs/architecture/build-and-deploy.md`](specs/architecture/build-and-deploy.md).

## Bilingual content model (read this before touching any content or template)

Hugo's built-in multilingual mode. **Russian is the default, unprefixed language** (`/`, `/about.html`); **English is prefixed** (`/en/`, `/en/about.html`). One content file per language per page, paired by base filename (`<slug>.ru.md` / `<slug>.en.md`), no `translationKey`. UI strings go through `i18n/ru.toml` / `i18n/en.toml`, never hardcoded in templates. Full model, front-matter schema, and the reasoning behind unprefixed-ru: [`specs/conventions/bilingual-model.md`](specs/conventions/bilingual-model.md), [`specs/data-model/frontmatter-reference.md`](specs/data-model/frontmatter-reference.md), ADR-1/ADR-2 in [`specs/decisions/architecture-decisions.md`](specs/decisions/architecture-decisions.md).

**Hard invariant, not just a convention:** every post heading needs an explicit ASCII `{#slug}` anchor (`## Context {#context}`) — Goldmark's auto-generated id from Cyrillic breaks the JS scrollspy. Enforced by `errorf` in `layouts/_default/_markup/render-heading.html` (format) and `layouts/posts/single.html` (uniqueness, via the shared `partials/assert-unique.html`). ADR-6/ADR-8 in [`specs/decisions/architecture-decisions.md`](specs/decisions/architecture-decisions.md).

Any feature touching content or templates must work on **both** languages — walk the checklist in [`specs/guides/add-new-feature.md`](specs/guides/add-new-feature.md) before considering it done.

## URL scheme and rendering quirks

`uglyURLs = true` (flat `.html`, both languages) + `relativeURLs = true` (dot-relative links, so `public/` opens via `file://` with no server — **don't remove this**). Section/archive-style pages (posts list, series pages) need an explicit `url:` + `outputs: [html]`, or Hugo lets the section's RSS feed silently claim the URL. Full scheme: [`specs/data-model/url-scheme.md`](specs/data-model/url-scheme.md), ADR-3 in [`specs/decisions/architecture-decisions.md`](specs/decisions/architecture-decisions.md).

**Do not set `defaultContentLanguageInSubdir = true`** (i.e. don't try to prefix Russian as `/ru/...`) without re-reading ADR-1 first — that configuration hit a confirmed Hugo defect where the auto-generated root redirect silently clobbers the real default-language home page (no upstream fix; `gohugoio/hugo` #6138 was never merged).

## Template structure

Shared building blocks — reuse before writing new markup/CSS: `partials/archive-item.html` (list row; closed param contract `page`/`linkText`/`hideDate`, documented in the partial itself and [`specs/patterns/shared-partial-pattern.md`](specs/patterns/shared-partial-pattern.md)), `.tag-pill`, `.profile-header`/`.profile-name`, `partials/post-date.html`/`partials/archive-date.html`, `.btn-control`, `partials/cover-image.html` (renders an `<img>` from a `{src, alt}` frontmatter object — used for the post cover; that's the only place a post image renders outside the post body itself, homepage cards are text-only). Tags are a Hugo taxonomy (auto term pages); series are a hand-written content section (`content/series/`) with manual ordering — different mechanisms, see ADR-7 and [`specs/patterns/taxonomy-pattern.md`](specs/patterns/taxonomy-pattern.md) / [`specs/patterns/content-section-pattern.md`](specs/patterns/content-section-pattern.md). Full per-component breakdown (posts/tags/series/search/nav/homepage): [`specs/components/`](specs/components/README.md).

Every page uses the same `.container` (`max-width: 900px`, set once in `baseof.html`) — homepage, archive, tags, series, about, and post pages are all the same width. There is no separate wide/narrow container class.

Build-time content invariants (missing series number, duplicate anchor, etc.) are checked in-template via `errorf`/`warnf`, not external tests — ADR-8 in [`specs/decisions/architecture-decisions.md`](specs/decisions/architecture-decisions.md). New invariants of the "key must be unique" shape should reuse `partials/assert-unique.html` rather than copy the `if in $seen / errorf / append` loop; new invariants of the "object has required subfields" shape (e.g. `cover` → `{src, alt}`) should reuse `partials/assert-image-field.html`.

**`errorf` logs but does not halt the current template's execution** — it only guarantees the build's final exit code is non-zero. Any render code that runs after an `errorf` check must independently guard against the invalid data it just flagged (see `partials/cover-image.html`, which re-checks shape before emitting `<img>` rather than trusting the earlier `errorf` call) — otherwise malformed frontmatter degrades from a clean build failure into a raw Go template panic (`can't evaluate field ... in type ...`) that can crash pages/templates that never ran the validation themselves. Caught in code review for `cover`; keep it in mind for any new `errorf`-guarded field.

## Deployment

`.github/workflows/hugo.yml` deploys on push to `master` (the working branch is `blog` — merge before expecting a deploy) or manual `workflow_dispatch`; `.github/workflows/hugo-pr-check.yml` build-checks (no deploy) on PRs into `master`. No `gh-pages` branch — official `upload-pages-artifact`/`deploy-pages` flow. Hugo install is intentionally uncached plain `wget`+`dpkg` in both workflows; don't add caching back without a reason. Details: [`specs/architecture/build-and-deploy.md`](specs/architecture/build-and-deploy.md).

## Adding a new feature

Start at [`specs/guides/add-new-feature.md`](specs/guides/add-new-feature.md) — it walks pattern selection (taxonomy vs. content-section vs. shared-partial vs. i18n-string), the bilingual checklist, URL rules, and the requirement to update the relevant spec **in the same change**.
