# Соглашения: именование

Единые правила для имён файлов, слагов, якорей, тегов и id серий. Нарушение
некоторых из них — не стилистика, а **build-ошибка** (отмечено ⛔).

## Имена файлов контента

Формат: `<base>.<lang>.md`, где `<lang>` — `ru` или `en`.

```
content/posts/cqrs-na-praktike.ru.md
content/posts/cqrs-na-praktike.en.md
                └── base ──┘ └lang┘
```

- `<base>` — **ASCII, kebab-case** (строчные буквы, цифры, дефисы). Это и есть слаг в
  URL: `cqrs-na-praktike` → `/posts/cqrs-na-praktike.html`.
- Базовое имя **должно совпадать** у ru/en-пары — по нему Hugo сопоставляет переводы
  (см. [`bilingual-model.md`](bilingual-model.md)). Разные базовые имена = Hugo
  считает их несвязанными страницами.
- Транслитерация: слаг латиницей даже для русских постов (`shardirovanie-bez-daountaima`,
  а не `шардирование-без-даунтайма`).

## Слаг поста

- Один и тот же слаг для обеих языковых версий (это следствие правила про базовое имя).
- Не меняйте слаг опубликованного поста — сломаете внешние ссылки.

## Якоря заголовков ⛔

Формат: `## Текст заголовка {#ascii-slug}` (для подзаголовков — `###`).

```markdown
## Разделение чтения и записи {#splitting-reads-and-writes}
### Проекции для чтения {#read-projections}
```

Правила:
- Якорь **обязателен и явный** — без него build падает (`render-heading.html`).
- Формат якоря: `^[a-z0-9]+(-[a-z0-9]+)*$` (строчный ASCII kebab-case). Иначе —
  ⛔ `errorf` в `layouts/_default/_markup/render-heading.html`.
- Якоря **уникальны в пределах одного файла**. Дубликат — ⛔ `errorf` при построении
  ToC в `layouts/posts/single.html`.
- Якоря **не обязаны** совпадать между ru/en-версиями, но держать их одинаковыми —
  хорошая практика (структурно выравнивает ToC).

**Почему явный ASCII-якорь:** авто-генерируемый Goldmark id из кириллического текста
percent-энкодится и не совпадает между `href` и `id`, ломая скроллспай ToC в
`navigation.js`. Детали механики — [`components/posts.md`](../components/posts.md).

## Теги

- Значения `tags` — **английские kebab-case слаги**, не переводятся:
  `[cqrs, distributed-systems, patterns]`.
- **Одинаковый** список тегов в ru- и en-файле поста.
- Тег порождает страницу `/tags/<tag>.html` (ru) и `/en/tags/<tag>.html` (en).
- Заголовок тега на странице формируется как `#<tag>` (см.
  [`components/tags.md`](../components/tags.md)).

## Id серий ⛔

- Id серии = **базовое имя файла** страницы серии: `content/series/distributed-systems.ru.md`
  → id `distributed-systems`. Отдельного поля `id` нет.
- Формат — ASCII kebab-case (как слаг файла).
- В посте `series.name` **должен точно совпадать** с этим id. Несовпадение → build
  проходит, но `warnf` + ссылка-заглушка на сам пост (см.
  [`components/series.md`](../components/series.md)).
- `series.number` — целое, 1-based, **уникальное в пределах серии**. Дубликат — ⛔
  `errorf` в `layouts/series/single.html`.

## Даты

- Формат — `YYYY-MM-DD` (напр. `2025-08-02`).
- **Одинаковая дата** на обоих языковых файлах поста.
- Отображение: русский — генитивные месяцы («2 августа 2025») через
  `partials/date-ru.html`; английский — `.Date.Format "January 2, 2006"`.

## Ключи i18n-строк

- camelCase, семантические: `latestPostsTitle`, `searchPlaceholder`, `postSeriesMeta`.
- **Каждый ключ обязан быть в обоих файлах** `i18n/ru.toml` и `i18n/en.toml`. См.
  [`bilingual-model.md`](bilingual-model.md) и
  [`patterns/i18n-string-pattern.md`](../patterns/i18n-string-pattern.md).

## CSS-классы (сложившиеся конвенции)

- kebab-case: `.post-series-meta`, `.toc-sidebar`, `.archive-item`.
- Переиспользуемые «пилюли»: `.tag-pill` — базовый класс, поверх него модификатор
  (`.post-tag`, `.skill-tag`).
- Контролы шапки: `.btn-control`, `.btn-control-icon`.

## Сводка build-падений от нарушений именования

| Нарушение                              | Где ловится                          | Тип     |
|----------------------------------------|--------------------------------------|---------|
| Заголовок без `{#slug}` / не-ASCII якорь | `render-heading.html`               | ⛔ errorf |
| Дубликат якоря в файле                 | `posts/single.html` (сборка ToC)     | ⛔ errorf |
| `series` без `name`/`number`           | `posts/single.html`                  | ⛔ errorf |
| Дубликат `series.number` в серии       | `series/single.html`                 | ⛔ errorf |
| `series.name` без страницы серии       | `posts/single.html`                  | ⚠️ warnf |

## Связанные специфы
- [`bilingual-model.md`](bilingual-model.md) — двуязычные конвенции.
- [`data-model/frontmatter-reference.md`](../data-model/frontmatter-reference.md) —
  где эти значения используются.
