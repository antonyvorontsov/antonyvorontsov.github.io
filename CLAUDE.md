# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal bilingual (ru/en) blog for Anton Vorontsov, built as a Hugo static site. Deployed to GitHub Pages at `vorontsov.dev`. No JS framework, no CSS framework, no npm/node, no Hugo Pipes — plain HTML/CSS/JS and Go templates only. Keep it that way; do not introduce a build pipeline, bundler, or third-party CSS/JS library without being asked.

`legacy-site/` is the pre-Hugo version of the site (hand-written HTML/CSS/JS), kept only for reference/rollback. It is not built, not deployed, and nothing in `layouts/`/`static/` should link to it.

## Commands

- `hugo server` — dev preview at http://localhost:1313 (also runnable via the `.claude/launch.json` config named `hugo-server`, e.g. through the Preview tool).
- `hugo` — one-off build, outputs to `public/` (gitignored).
- `hugo new posts/<slug>.md` — scaffold a new post from `archetypes/posts.md`.
- No lint/test commands — this is a content site, not an application.
- CI builds with `hugo --gc --minify --baseURL "<pages-url>/"` (see `.github/workflows/hugo.yml`); it installs Hugo Extended via a pinned version (`HUGO_VERSION` env var), not `hugo-bin`/npm.

## Bilingual content model (read this before touching any content or template)

The site shows both languages on one page and toggles between them client-side, instantly, with no reload and no separate `/en/` URLs — it does **not** use Hugo's built-in multilingual/i18n system. The mechanism:

- Nearly every piece of UI text is duplicated as a pair: `<span class="lang-ru">...</span><span class="lang-en">...</span>`. CSS (`static/css/styles.css`) hides whichever doesn't match `<html lang="ru">` / `<html lang="en">`.
- `static/js/modules/navigation.js` flips `document.documentElement.lang` and persists the choice in `localStorage`; `data-title-ru`/`data-title-en` attributes on `<html>` (set in `layouts/_default/baseof.html`) drive the `document.title` swap.
- **Post headings use a custom convention**: `## Русский текст|||English text {#slug}`. The `|||` is split by the render hook `layouts/_default/_markup/render-heading.html`, which emits both language spans into one `<h2>`/`<h3>`. If `|||` is missing, it falls back to showing the Russian text as both languages (no crash, but silently wrong) — there's no build-time check for this, only for duplicate anchors.
- **The explicit `{#slug}` is not decorative — it's required.** Without it, Goldmark auto-generates an id from the raw (Cyrillic) heading text, which then gets percent-encoded in `href` attributes but not in `id` attributes, breaking the JS scrollspy in `navigation.js` (it looks up headings by exact id string match). Always give new headings an explicit ASCII `{#slug}`.
- Two headings sharing the same explicit `{#slug}` in one post **will fail the build** (`errorf` in the render hook, tracked via `.Scratch`) rather than silently pointing the TOC at the wrong section — keep slugs unique per post.
- The TOC sidebar (`layouts/posts/single.html`) is built from Hugo's `.Fragments.Headings`, not `.TableOfContents` — Hugo's `.TableOfContents` does not run through render hooks, so it would show the raw `Русский|||English` text unprocessed. Any change to how headings are parsed needs to stay compatible with `.Fragments`-based traversal (h2 → nested h3 via `.Headings`).
- Front matter fields that appear in chrome/cards/meta (not body content) follow a `foo`/`foo_en` pairing: `title`/`title_en`, `description`/`description_en`. Always reference the `_en` variant with `| default <ru-version>` in templates — several spots were missing this and silently rendered blank English text when a field was absent.
- `og_description` (root pages only: `content/_index.md`, `content/about.md`, `content/posts/_index.md`) is intentionally distinct, shorter copy from `description` — don't collapse them back into one field.

## URL scheme and rendering quirks

- `uglyURLs = true` in `hugo.toml` reproduces the pre-migration flat URL scheme: `/`, `/about.html`, `/posts.html`, `/posts/<slug>.html` — no `/about/` or `/posts/index.html` directories.
- The one place `uglyURLs` doesn't do this automatically is the posts section list: `content/posts/_index.md` has to explicitly set `url: /posts.html` and `outputs: [html]`. Without `outputs: [html]`, Hugo lets the section's RSS feed silently claim that URL instead of the HTML page. If you ever add another section with an archive-style list page, you'll need the same two front-matter keys.
- `relativeURLs = true` is also load-bearing: it makes every internal link and asset path (`relURL`, `.RelPermalink`) dot-relative (`../css/styles.css`) instead of root-relative (`/css/styles.css`), so the generated `public/` folder can be opened directly via `file://` with no server, in addition to working when actually deployed. Don't remove this — it was added specifically because root-relative paths silently break when someone double-clicks a file in `public/`.
- `.Permalink` (used for `og:url`, canonical links) stays absolute regardless of `relativeURLs` — that's intentional, don't "fix" it to be relative.
- `[markup.goldmark.parser.attribute] title = true` in `hugo.toml` is what enables the `{#slug}` syntax on headings; `[markup.goldmark.renderer] unsafe = true` is what allows the raw `<span class="lang-ru">` HTML inside post intro paragraphs.

## Template structure

- `layouts/_default/baseof.html` computes `$isPostSingle` (`and .IsPage (eq .Section "posts")`) once via `.Scratch` and reuses it (via `.Scratch.Get`) in `layouts/partials/head.html` — a post-single page gets a title suffix, `container-wide`, and no OG meta tags; other page kinds don't. If you add another page kind that needs different `<head>`/container behavior, extend this pattern rather than adding another ad hoc boolean.
- `layouts/partials/profile-header.html` (shared by `layouts/index.html` and `layouts/about.html`) derives whether to show the avatar/social-links block from `.Params.social` being present — not from an explicit flag passed in. If a future page needs the avatar without social links (or vice versa), this coupling will need revisiting.
- `content/about.md` is structured data, not prose: `experience`, `speaking`, `skills`, `social` are YAML lists in front matter, rendered by `layouts/about.html` (routed via `layout: "about"` in the front matter) using `range`. `layouts/partials/timeline-item.html` renders one `experience`/`speaking` entry, parameterized by `showCompany`.
- Russian date formatting (genitive month names, e.g. "1 июня 2026") has no Go/Hugo built-in — `layouts/partials/date-ru.html` hardcodes the month list. English dates use plain `.Date.Format`.
- Taxonomy `tags` is declared in `hugo.toml` for future use; there's no `layouts/taxonomy/`/`layouts/term/` template yet and posts just carry `tags: []`. Don't wire up tag pages unless asked.

## Deployment

- `.github/workflows/hugo.yml` deploys on push to `master` (the working branch is `blog` — merge before expecting a deploy) or manual `workflow_dispatch`, via the official `actions/upload-pages-artifact` + `actions/deploy-pages` flow (no `gh-pages` branch).
- Deploys are expected to be infrequent — the Hugo install step is intentionally a plain `wget`+`dpkg`, not cached; don't add caching back without a reason.
- Custom domain is `vorontsov.dev` via `static/CNAME`; `baseURL` in `hugo.toml` is set to `https://vorontsov.dev` for local builds, and overridden in CI to whatever `actions/configure-pages` reports for the live Pages URL.
