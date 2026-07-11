# Данные: организация контента

Вся содержательная информация лежит в `content/`. Hugo превращает каждый файл в
страницу по правилам, описанным в [`url-scheme.md`](url-scheme.md).

## Полная карта `content/`

```
content/
├── _index.ru.md            # главная (ru) — только frontmatter, тело в layouts/index.html
├── _index.en.md            # главная (en)
├── about.ru.md             # «Обо мне» (ru) — СТРУКТУРИРОВАННЫЕ данные во frontmatter
├── about.en.md             # «Обо мне» (en)
├── posts/
│   ├── _index.ru.md        # разводящая страница архива постов (ru), url: /posts.html
│   ├── _index.en.md        # то же (en), url: /en/posts.html
│   ├── <slug>.ru.md        # пост (ru) → /posts/<slug>.html
│   └── <slug>.en.md        # пост (en) → /en/posts/<slug>.html
└── series/
    ├── _index.ru.md        # СЛУЖЕБНЫЙ: гасит авто-страницу /series.html (build.render=false)
    ├── _index.en.md        # то же (en)
    ├── <name>.ru.md        # разводящая страница серии (ru), url: /series/<name>.html
    └── <name>.en.md        # то же (en), url: /en/series/<name>.html
```

## Принцип: один файл = один язык

Каждая страница существует как **отдельный файл на каждый язык** с общим базовым
именем:
- `content/posts/cqrs-na-praktike.ru.md`
- `content/posts/cqrs-na-praktike.en.md`

Hugo сам сопоставляет их как переводы по совпадающему базовому имени
`cqrs-na-praktike` — **`translationKey` не нужен**. Подробнее — в
[`conventions/bilingual-model.md`](../conventions/bilingual-model.md).

Пост может иметь **только один язык** (создать только `.ru.md` или только `.en.md`) —
тогда на другом языке страницы просто не будет, а переключатель языка ведёт на
главную того языка. См. [`guides/add-new-post.md`](../guides/add-new-post.md).

## Категории страниц по содержимому frontmatter

Контент в этом проекте бывает трёх принципиально разных «форм»:

### 1. Пост — frontmatter-мета + Markdown-тело
`content/posts/<slug>.{ru,en}.md`. Frontmatter — только метаданные (`title`, `date`,
`description`, `tags`, опционально `series`), а само содержимое — Markdown после
`---`. Тело начинается с интро-абзаца в `<p>...</p>` и дальше идут секции
`## Заголовок {#anchor}`.

Полная схема — [`frontmatter-reference.md`](frontmatter-reference.md#пост).
Как устроен рендеринг — [`components/posts.md`](../components/posts.md).

### 2. «Обо мне» — структурированные данные во frontmatter, тела почти нет
`content/about.{ru,en}.md`. Здесь frontmatter — это **данные, а не мета**: YAML-списки
`experience`, `speaking`, `skills`, `social`. Markdown-тело пустое. Шаблон
`layouts/about.html` рендерит эти списки через `range`. См.
[`components/homepage-and-about.md`](../components/homepage-and-about.md).

### 3. Разводящая страница раздела — рукописная страница-«хаб»
`content/posts/_index.*.md`, `content/series/<name>.*.md`. У неё есть свой заголовок,
описание, иногда тело-абзац, и она перечисляет другие страницы. Отличается от постов
тем, что это `Kind: section`, и требует явных `url:` и `outputs: [html]` (см.
[`url-scheme.md`](url-scheme.md#почему-нужны-явные-url-и-outputs)).

## «Корневые» страницы: `_index.md`, `about.md`, `posts/_index.md`

Только у этих трёх есть поле `og_description` (и `og_type`). У обычного поста его нет.
`description`/`og_description` этих страниц — **одноязычные, как всё остальное
frontmatter**: `.en.md`-файлы несут английский текст, `.ru.md` — русский. (Долгое
время они были только на русском — исторический хвост старой `|||`-схемы, где эти
мета-теги не переводились; сейчас исправлено.)

## Служебные файлы `series/_index.*.md`

```yaml
---
build:
  list: false
  render: false
---
```

Гасят авто-генерируемую Hugo страницу «список раздела» `/series.html` — сознательно,
зеркально отсутствию страницы «все теги». **Не удаляйте эти файлы и ключ `build:`** —
иначе появится ненужная страница со списком серий. См.
[`components/series.md`](../components/series.md).

## Статические ассеты контента

- Аватар: `static/assets/images/avatar.jpeg`.
- Картинки постов: `static/assets/images/posts/` (сейчас только `.gitkeep` —
  изображения в постах пока в роадмапе, не реализованы).
- Фавикон: `static/assets/favicon.png`.

## Связанные специфы
- [`frontmatter-reference.md`](frontmatter-reference.md) — все поля по типам.
- [`url-scheme.md`](url-scheme.md) — как из файла получается URL.
- [`conventions/naming.md`](../conventions/naming.md) — правила имён файлов и слагов.
