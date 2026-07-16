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
│   └── <NN>-<slug>/        # ОДНА папка на пост — Hugo page bundle, см. ниже
│       ├── index.ru.md     # пост (ru) → /posts/<slug>.html (slug из frontmatter, НЕ из <NN>-<slug>)
│       ├── index.en.md     # пост (en) → /en/posts/<slug>.html
│       └── images/         # опционально: cover + инлайн-картинки ЭТОГО поста
└── series/
    ├── _index.ru.md        # СЛУЖЕБНЫЙ: гасит авто-страницу /series.html (build.render=false)
    ├── _index.en.md        # то же (en)
    ├── <name>.ru.md        # разводящая страница серии (ru), url: /series/<name>.html
    └── <name>.en.md        # то же (en), url: /en/series/<name>.html
```

Серии **не** используют page bundles — они остаются плоскими одиночными файлами, как
и раньше. Только `posts/` было переструктурировано.

## Посты: page bundle на пост, номер-префикс для сортировки

Каждый пост — отдельная директория `content/posts/<NN>-<slug>/`, а не пара плоских
файлов. Причины (три проблемы, которые решает эта структура):
1. **Хронологический порядок в файловой системе.** Плоский `content/posts/*.md`
   сортируется лексикографически по слагу — посты о разных темах "перемешаны", дата
   публикации никак не видна на уровне файлов. `<NN>` — двузначный, zero-padded,
   по возрастанию даты публикации (`01` = самый старый пост) — **только** для
   сортировки в файловой системе, в URL никогда не попадает (см. ниже).
2. **Одна папка на пост вместо двух файлов в общей куче.** `content/posts/` больше
   не "раздувается" параллельными `.ru.md`/`.en.md` — у каждого поста своя папка.
3. **Локальность картинок.** `images/` внутри папки поста — картинки лежат рядом с
   текстом, а не в отдельном дереве `static/assets/images/posts/<slug>/` (см. ниже).

### Директория = Hugo page bundle (leaf bundle)

`content/posts/<NN>-<slug>/` — это [Hugo leaf bundle]: директория с контент-файлом
`index.<lang>.md` внутри. **Имя файла обязано быть ровно `index.<lang>.md`** — это
жёсткое требование Hugo для page bundles, не стиль. `content.<lang>.md` или любое
другое имя **не** будет распознано как контент бандла.

### `<NN>` — префикс для сортировки, НЕ часть URL

Директория `02-sharding-without-downtime` даёт URL `/posts/sharding-without-downtime.html`,
**без** `02-`, потому что каждый пост обязан задавать explicit `slug:` во frontmatter
(см. [`frontmatter-reference.md`](frontmatter-reference.md#пост)) — Hugo резолвит URL
по `slug`, а не по имени директории, если `slug` задан. `<NN>` существует только для
того, чтобы `ls content/posts/` показывал посты в хронологическом порядке — Hugo его
никак не использует и не видит смысла в нём (это просто часть имени директории).
Формат — двузначный (`01`…`99`); при достижении 100 постов увеличьте ширину везде
разом (не смешивайте 2- и 3-значные префиксы в одном дереве).

### `images/` — картинки этого поста, и только этого поста

Опциональная поддиректория `content/posts/<NN>-<slug>/images/` — обложка (`cover.jpg`)
и/или инлайн-картинки тела, только для этого конкретного поста (в отличие от старой
схемы, где все посты делили одно дерево `static/assets/images/posts/`). Это Hugo
"page resources" — Hugo публикует их рядом с отрендеренной страницей
(`public/posts/<slug>/images/...`), автоматически, без Hugo Pipes/ресайза (ADR-5 не
нарушается — картинки не обрабатываются, только копируются как есть). Подробности
подключения — [`frontmatter-reference.md`](frontmatter-reference.md#пост) (`cover`) и
[`components/posts.md`](../components/posts.md#обложка-cover-и-инлайн-картинки).

## Принцип: один файл = один язык

Каждый пост существует как **отдельный файл на каждый язык внутри своей папки**, с
одинаковым именем `index.<lang>.md`:
- `content/posts/03-cqrs-in-practice/index.ru.md`
- `content/posts/03-cqrs-in-practice/index.en.md`

Hugo сам сопоставляет их как переводы, потому что оба файла лежат в одной директории
(page bundle) — **`translationKey` не нужен**. Подробнее — в
[`conventions/bilingual-model.md`](../conventions/bilingual-model.md).

Пост может иметь **только один язык** (создать только `index.ru.md` или только
`index.en.md` в папке) — тогда на другом языке страницы просто не будет, а
переключатель языка ведёт на главную того языка. См.
[`guides/add-new-post.md`](../guides/add-new-post.md).

## Категории страниц по содержимому frontmatter

Контент в этом проекте бывает трёх принципиально разных «форм»:

### 1. Пост — frontmatter-мета + Markdown-тело
`content/posts/<NN>-<slug>/index.{ru,en}.md`. Frontmatter — только метаданные
(`title`, `date`, `description`, `tags`, `slug`, опционально `series`/`cover`/
`aliases`), а само содержимое — Markdown после `---`. Тело начинается с
интро-абзаца в `<p>...</p>` и дальше идут секции `## Заголовок {#anchor}`.

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
- Фавикон: `static/assets/favicon.png`.

Картинок постов в `static/` больше **нет** — они переехали в `images/` внутри
директории каждого поста (page bundle resources), см. «Посты: page bundle на
пост» выше. `static/` теперь используется только для сайт-wide ассетов
(аватар, фавикон), не для контента конкретных страниц.

## Связанные спецификации
- [`frontmatter-reference.md`](frontmatter-reference.md) — все поля по типам.
- [`url-scheme.md`](url-scheme.md) — как из файла получается URL.
- [`conventions/naming.md`](../conventions/naming.md) — правила имён файлов и слагов.
