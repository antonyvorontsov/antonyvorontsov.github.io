# Архитектура: обзор системы

## Что это

Персональный **двуязычный (ru/en) блог** Антона Воронцова — статический сайт на
[Hugo](https://gohugo.io/). Разворачивается на GitHub Pages по адресу
`vorontsov.dev`. Контент — статьи о разработке распределённых систем, архитектуре,
инженерном лидерстве.

Ключевой принцип: **никаких сборочных конвейеров**. Нет JS-фреймворка, нет
CSS-фреймворка, нет npm/node, нет Hugo Pipes. Только чистый HTML/CSS/JS и
Go-шаблоны. Подробнее об ограничениях — [`tech-stack.md`](tech-stack.md).

## Из чего состоит

```
antonyvorontsov.github.io/
├── hugo.toml                 # главный конфиг: языки, taxonomy, output-форматы, markup
├── config/_default/          # меню навигации (по одному файлу на язык)
│   ├── menus.ru.toml
│   └── menus.en.toml
├── content/                  # КОНТЕНТ (Markdown + frontmatter)
│   ├── _index.{ru,en}.md     # главная
│   ├── about.{ru,en}.md      # «Обо мне» (структурированные данные во frontmatter)
│   ├── posts/                # посты + разводящая страница архива
│   └── series/               # серии постов (рукописные разводящие страницы)
├── layouts/                  # ШАБЛОНЫ (Go templates)
│   ├── _default/             # baseof.html + render-hook для заголовков
│   ├── partials/             # переиспользуемые куски разметки
│   ├── posts/                # list.html (архив), single.html (пост)
│   ├── series/single.html    # страница серии
│   ├── tags/term.html        # страница тега
│   ├── index.html            # главная
│   ├── about.html            # «Обо мне»
│   └── index.searchindex.json # генератор поискового индекса
├── i18n/                     # UI-СТРОКИ (ru.toml / en.toml)
├── static/                   # СТАТИКА (css, js, картинки, CNAME) — копируется как есть
│   ├── css/styles.css        # единственный CSS-файл (design tokens + все стили)
│   ├── js/                   # ванильный JS без сборки
│   └── CNAME                 # единственное место, где встречается vorontsov.dev
├── archetypes/posts.md       # шаблон нового поста (для `hugo new`)
└── .github/workflows/
    ├── hugo.yml               # CI: сборка + деплой на GitHub Pages (push в master)
    └── hugo-pr-check.yml      # CI: build-gate без деплоя (pull_request в master)
```

`legacy-site/` — доисторическая версия сайта (рукописный HTML/CSS/JS), хранится
только для отката. Не собирается, не деплоится, ничего из `layouts/`/`static/`
на неё не ссылается.

## Как движутся данные (data flow)

```
                        сборка (hugo)
  ┌──────────────┐    ┌────────────────────────────────────┐    ┌──────────────┐
  │  content/    │    │  1. Hugo читает hugo.toml           │    │  public/     │
  │  *.ru.md     │───▶│  2. группирует контент по языкам    │───▶│  index.html  │
  │  *.en.md     │    │     (ru — корень, en — /en/)        │    │  en/...      │
  │ + frontmatter│    │  3. сопоставляет переводы по         │    │  posts/*.html│
  └──────────────┘    │     базовому имени файла            │    │  en/posts/...│
                      │  4. генерит taxonomy-страницы (tags)│    │  tags/*.html │
  ┌──────────────┐    │  5. применяет layouts + partials    │    │  series/...  │
  │  layouts/    │───▶│  6. подставляет i18n-строки         │    │  search-     │
  │  i18n/       │    │  7. копирует static/ как есть        │    │   index.json │
  └──────────────┘    └────────────────────────────────────┘    └──────────────┘
                                                                        │
  ┌──────────────┐                                                      ▼
  │  static/     │──────────────────────────────────────────▶  GitHub Pages
  │  css/js/img  │              (копируется без обработки)        (vorontsov.dev)
  └──────────────┘
```

Ключевые моменты потока:
1. **Один файл = одна страница на одном языке.** `posts/foo.ru.md` → `/posts/foo.html`,
   `posts/foo.en.md` → `/en/posts/foo.html`. Hugo автоматически сопоставляет их как
   переводы по совпадающему базовому имени `foo` — см.
   [`conventions/bilingual-model.md`](../conventions/bilingual-model.md).
2. **Русский — язык по умолчанию, без префикса**; английский — с префиксом `/en/`.
   См. [`data-model/url-scheme.md`](../data-model/url-scheme.md).
3. **Клиентского состояния почти нет.** Переключение языка — это переход по реальной
   ссылке на переведённую страницу, а не JS-тоггл. JS отвечает только за тему,
   бургер-меню, скроллспай ToC и поиск.
4. **Поиск — клиентский.** На сборке генерится `search-index.json` (по одному на
   язык), JS его подгружает и фильтрует. См. [`components/search.md`](../components/search.md).

## Три «рода» страниц (Hugo Kinds)

Hugo различает страницы по `Kind`. В этом проекте важны:

| Kind       | Что это                          | Пример URL             | Шаблон                       |
|------------|----------------------------------|------------------------|------------------------------|
| `home`     | главная                          | `/`, `/en/`            | `layouts/index.html`         |
| `page`     | обычная страница/пост            | `/about.html`, `/posts/foo.html` | `layouts/about.html`, `layouts/posts/single.html` |
| `section`  | разводящая страница раздела       | `/posts.html`, `/series/foo.html` | `layouts/posts/list.html`, `layouts/series/single.html` |
| `term`     | страница одного тега (auto-gen)  | `/tags/cqrs.html`      | `layouts/tags/term.html`     |
| `taxonomy` | «все теги» — **отключён**         | —                      | (нет; `disableKinds`)        |

`baseof.html` вычисляет флаг `$isPostSingle = (and .IsPage (eq .Section "posts"))`
и по нему меняет `<head>` и ширину контейнера. Это единственная специальная развилка
по роду страницы в базовом шаблоне.

## Ключевые ограничения (constraints)

Полный разбор — в соответствующих спецификациях, здесь сводка:

- **Никакого build-конвейера** (нет npm/bundler/Hugo Pipes). См. [`tech-stack.md`](tech-stack.md).
- **Домен `vorontsov.dev` — только в `static/CNAME`.** `baseURL` в `hugo.toml`
  не задан намеренно. См. [`build-and-deploy.md`](build-and-deploy.md).
- **Русский — язык по умолчанию, без префикса.** Менять `defaultContentLanguageInSubdir`
  на `true` нельзя — упирается в дефект Hugo. См.
  [`decisions/architecture-decisions.md`](../decisions/architecture-decisions.md).
- **Якоря заголовков — обязательный явный ASCII `{#slug}`.** Иначе ломается
  скроллспай ToC на кириллице. См. [`components/posts.md`](../components/posts.md).
- **`relativeURLs = true`** — все внутренние ссылки dot-relative, чтобы `public/`
  открывался напрямую через `file://`. См. [`data-model/url-scheme.md`](../data-model/url-scheme.md).

## Куда идти дальше

- Понять двуязычность → [`conventions/bilingual-model.md`](../conventions/bilingual-model.md)
- Понять URL → [`data-model/url-scheme.md`](../data-model/url-scheme.md)
- Понять конкретную фичу → [`components/README.md`](../components/README.md)
- Сделать новую фичу → [`guides/add-new-feature.md`](../guides/add-new-feature.md)
