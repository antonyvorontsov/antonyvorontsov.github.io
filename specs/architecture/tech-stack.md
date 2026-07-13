# Архитектура: технологический стек и ограничения

## Стек

| Слой              | Технология                        | Примечание                                    |
|-------------------|-----------------------------------|-----------------------------------------------|
| Генератор сайта   | **Hugo Extended**                 | версия закреплена в CI: `HUGO_VERSION = 0.164.0` |
| Шаблоны           | Go templates (`.html`)            | `layouts/`                                     |
| Разметка контента | Markdown (Goldmark)               | `content/*.md`                                 |
| Стили             | Один рукописный CSS-файл           | `static/css/styles.css` (~974 строки)          |
| Скрипты           | Ванильный JS, module-pattern       | `static/js/` — без сборки, подключаются `<script defer>` |
| Шрифты            | Google Fonts (`Inter`, `Outfit`)  | подключаются `<link>` в `head.html`            |
| Хостинг           | GitHub Pages                       | деплой через GitHub Actions                    |
| Домен             | `vorontsov.dev`                    | только в `static/CNAME`                        |

### Версия Hugo

Авторитетный источник версии — переменная `HUGO_VERSION` в
[`.github/workflows/hugo.yml`](../../.github/workflows/hugo.yml) (сейчас `0.164.0`,
Hugo **Extended**, ставится через `wget` + `dpkg`) — это версия, которая реально
собирает продакшн. `.github/workflows/hugo-pr-check.yml` (PR-gate, без деплоя)
держит собственную копию той же переменной и её нужно обновлять **синхронно** —
иначе build-check на PR будет проверять сборку не той версией Hugo, что реально
задеплоится. Локально можно использовать любую свежую Hugo Extended, но при
использовании фич Hugo сверяйтесь с версией из `hugo.yml`.

Особенности, завязанные на версию Hugo:
- `.Fragments.Headings` (для ToC-сайдбара) — относительно новое API.
- Дефект с `defaultContentLanguageInSubdir=true` + `uglyURLs=true` (см.
  [`decisions/architecture-decisions.md`](../decisions/architecture-decisions.md))
  — исторический, PR-фикс `gohugoio/hugo` #6138 не был смёржен.

## Что НЕЛЬЗЯ добавлять без явной просьбы

Это жёсткое архитектурное ограничение проекта (из `CLAUDE.md`). Прежде чем тянуть
любую зависимость — остановитесь.

- ❌ **JS-фреймворк** (React, Vue, Svelte, Alpine и т.п.)
- ❌ **CSS-фреймворк** (Tailwind, Bootstrap и т.п.)
- ❌ **npm / node / package.json** — их в проекте нет вообще
- ❌ **Hugo Pipes / асеет-пайплайн** (`resources.Get`, `| minify`, `| fingerprint`
  и пр.) — минификация делается флагом `hugo --minify` на CI, не в шаблонах
- ❌ **Сторонние CSS/JS-библиотеки** (jQuery, lodash, highlight.js, lunr.js…) —
  **единственное текущее исключение: Giscus** (комментарии на постах/сериях),
  см. ADR-9 в [`decisions/architecture-decisions.md`](../decisions/architecture-decisions.md#adr-giscus-exception)
  и [`components/comments.md`](../components/comments.md).
- ❌ **Бандлер / транспайлер** (webpack, esbuild, Babel, Vite…)

### Почему так

Сайт — это несколько статических страниц. Любой конвейер добавляет: точки отказа,
CI-время, обновления зависимостей, уязвимости, когнитивную нагрузку — ради нулевой
пользы на таком объёме. Плоский набор файлов, который открывается через `file://`, —
это фича, а не ограничение (см. `relativeURLs` в
[`data-model/url-scheme.md`](../data-model/url-scheme.md)).

### Как делать вместо этого

| Соблазн                          | Правильный путь в этом проекте                        |
|----------------------------------|-------------------------------------------------------|
| Подключить библиотеку для поиска | Клиентский фильтр по JSON-индексу — [`components/search.md`](../components/search.md) |
| Использовать CSS-фреймворк       | Design tokens (CSS-переменные) в `:root` + рукописный CSS |
| Сборка/минификация JS            | Ванильные модули + `hugo --minify` на CI              |
| Иконки из icon-библиотеки        | Инлайновые `<svg>` прямо в шаблонах/partials          |
| Подсветка кода через highlight.js | Встроенный в Hugo Chroma (server-side, без JS)       |

## Структура фронтенд-ассетов

### CSS — `static/css/styles.css`

Единый файл. Организован так:
- `:root { … }` — **design tokens** (светлая тема): цвета, шрифты, тени, транзишены.
- `[data-theme="dark"] { … }` — переопределение токенов для тёмной темы.
- Дальше — компонентные стили, сгруппированные по секциям, включая раздел
  Chroma (подсветка кода — сгенерированные `vs`/`vulcan` правила, см.
  ниже) и `.code-block-wrapper`/`.copy-btn`.
- `@media`-брейкпоинты: основной мобильный порог — **`767px`** (`max-width: 767px`).

Тема переключается атрибутом `data-theme` на `<html>`, который ставит JS
(`navigation.js`). Все цвета — через переменные, поэтому смена темы = смена значений
переменных, без дублирования правил. Та же схема (`:root` / `[data-theme="dark"]`)
переиспользована для темы подсветки кода: правила из `hugo gen chromastyles
--style=vs` — дефолт, правила из `--style=vulcan` — обёрнуты
`[data-theme="dark"]`. Chroma поддерживает десятки встроенных именованных
стилей (в т.ч. узнаваемые по названиям VS Code/редакторских тем — `dracula`,
`nord`, `onedark`, `gruvbox`, `solarized-dark`/`-light`, `monokai`, `xcode`,
`vs`, `vulcan`…), но не принимает произвольный кастомный файл темы — заменить
можно только на другое имя из этого списка, тем же способом. Подробности и
обоснование — в
[`components/posts.md`](../components/posts.md#подсветка-кода-code-blocks).

### JS — `static/js/`

Ванильный, паттерн «пространство имён + IIFE-модуль»:
- `modules/utils.js` — `window.Blog.utils` (например, год в футере).
- `modules/navigation.js` — `window.Blog.navigation` (тема, бургер-меню, скроллспай ToC).
- `modules/search.js` — `window.Blog.search` (клиентский поиск).
- `modules/copy-button.js` — `window.Blog.copyButton` (copy-to-clipboard в code blocks).
- `modules/code-expand.js` — `window.Blog.codeExpand` (кнопка Expand code blocks →
  модалка по центру экрана, одна модалка на страницу).
- `modules/giscus.js` — `window.Blog.giscus` (комментарии Giscus — сборка и вставка
  третьесторонего `<script>`, синхронизация темы). См.
  [`components/comments.md`](../components/comments.md).
- `main.js` — точка входа, вызывает `init`-функции модулей.

Порядок подключения задан в `baseof.html` (`utils` → `navigation` → `search` →
`copy-button` → `code-expand` → `giscus` → `main`), все с `defer`. Общий
неймспейс — `window.Blog`.

`copy-button`, `code-expand` и `giscus` — модули, подключаемые **не** на
каждой странице: их `<script>`-теги обёрнуты в `{{ if .Scratch.Get
"isPostSingle" }}` (код-блоки есть только на страницах постов) или
`{{ if .Scratch.Get "isCommentable" }}` (Giscus — посты и серии, и только когда
сайт реально сконфигурирован и `enableComments` не `false`; см.
[`components/comments.md`](../components/comments.md)), поэтому на остальных
страницах/сборках `window.Blog.copyButton`/`codeExpand`/`giscus` вообще не
существуют. `main.js` вызывает их через `if (copyButton) copyButton.init();` —
падать на `undefined.init()` на страницах/сборках без этих модулей нельзя.

## Связанные специфы
- [`build-and-deploy.md`](build-and-deploy.md) — как это собирается и деплоится.
- [`overview.md`](overview.md) — общая картина.
