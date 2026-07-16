# Соглашения: именование

Единые правила для имён файлов, слагов, якорей, тегов и id серий. Нарушение
некоторых из них — не стилистика, а **build-ошибка** (отмечено ⛔).

## Имена файлов контента

**Посты** живут в page bundles — одна директория на пост, контент-файл внутри
обязан называться ровно `index.<lang>.md` (жёсткое требование Hugo для page
bundles, см. [`data-model/content-organization.md`](../data-model/content-organization.md)):

```
content/posts/03-cqrs-in-practice/index.ru.md
content/posts/03-cqrs-in-practice/index.en.md
              └────── <NN>-<slug> ──────┘ └lang┘
```

- Имя директории — `<NN>-<slug>`: `<NN>` — двузначный номер для хронологической
  сортировки в файловой системе (не в URL, см. ниже); `<slug>` — ASCII kebab-case,
  **настоящий английский**, не транслит (см. «Слаг — всегда настоящий английский»
  ниже).
- Оба языковых файла (`index.ru.md`/`index.en.md`) лежат **в одной директории** —
  по этому признаку Hugo сопоставляет переводы (см.
  [`bilingual-model.md`](bilingual-model.md)), базовое имя файла (`index`)
  специально не участвует в сопоставлении. Один пост = одна директория с обоими
  файлами, никогда не два разных `<NN>-<slug>` для одного языкового поста.
- **Другие типы страниц** (`about.*.md`, `content/series/<name>.*.md`,
  `_index.*.md`) остаются плоскими файлами `<base>.<lang>.md` — page bundles
  используются только для постов.

## Слаг поста

- **Слаг определяется explicit-полем `slug:` во frontmatter, а не именем
  директории.** `slug: "cqrs-in-practice"` в директории `03-cqrs-in-practice/`
  даёт URL `/posts/cqrs-in-practice.html` — без номера. Без `slug:` Hugo взял бы
  имя директории целиком, включая `<NN>-`, как слаг — **всегда** задавайте `slug:`
  явно на каждом посте.
- Один и тот же слаг для обеих языковых версий поста.
- Не меняйте слаг опубликованного поста без крайней необходимости — сломаете
  внешние ссылки. Если всё же меняете — добавьте `aliases:` со старым URL (см.
  [`frontmatter-reference.md`](../data-model/frontmatter-reference.md#пост) и
  [`url-scheme.md`](../data-model/url-scheme.md#алиасы-старых-url-aliases)).

## Слаг — всегда настоящий английский, не транслит

**Слаг поста — реальное английское слово/фраза, а не русский текст латинскими
буквами** (`sharding-without-downtime`, а не `shardirovanie-bez-daountaima`) —
**даже для постов, у которых есть только русская версия или у которых русская
версия основная**. Это не стилистика, а читаемость URL для аудитории:
русскоязычный читатель разберёт английский URL без проблем (английский — рабочий
язык индустрии), а англоговорящий читатель транслит **не** разберёт вообще —
`shardirovanie-bez-daountaima` для него бессмысленный набор букв, тогда как
`sharding-without-downtime` понятен без перевода. Раз сайт двуязычный и рассчитан
на обе аудитории, URL должен быть полезен для обеих, а не только для той, что
догадается транслитерировать русский текст обратно в уме.

Технически билд не проверяет это (нет способа автоматически отличить «настоящий
английский» от «транслита» в общем случае) — это ревью-конвенция, соблюдайте её
при выборе слага на шаге 1 [`guides/add-new-post.md`](../guides/add-new-post.md).

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

## Связанные спецификации
- [`bilingual-model.md`](bilingual-model.md) — двуязычные конвенции.
- [`data-model/frontmatter-reference.md`](../data-model/frontmatter-reference.md) —
  где эти значения используются.
