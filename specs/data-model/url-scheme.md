# Данные: схема URL и особенности рендеринга

Три настройки в `hugo.toml` вместе задают всю URL-модель сайта:

```toml
uglyURLs = true
relativeURLs = true
defaultContentLanguage = "ru"
defaultContentLanguageInSubdir = false
```

## Правила формирования URL

| Что                | Русский (default, без префикса) | Английский (префикс `/en/`)   |
|--------------------|----------------------------------|-------------------------------|
| Главная            | `/` (`/index.html`)              | `/en/` (`/en/index.html`)     |
| Обо мне            | `/about.html`                    | `/en/about.html`              |
| Архив постов       | `/posts.html`                    | `/en/posts.html`              |
| Пост               | `/posts/<slug>.html`             | `/en/posts/<slug>.html`       |
| Тег                | `/tags/<tag>.html`               | `/en/tags/<tag>.html`         |
| Серия              | `/series/<name>.html`            | `/en/series/<name>.html`      |
| Поисковый индекс   | `/search-index.json`             | `/en/search-index.json`       |

### `uglyURLs = true` — плоские `.html`
Даёт `/about.html` вместо `/about/`. Применяется к **обоим** языкам. Hugo сам
выводит правильное плоское имя файла с учётом языкового префикса — поэтому обычному
посту и `about.*.md` **не нужен** ручной `url:`.

Посты — Hugo page bundles (см.
[`content-organization.md`](content-organization.md#посты-page-bundle-на-пост-номер-префикс-для-сортировки)),
и это сочетается с `uglyURLs`/`relativeURLs` ровно так, как ожидается: сама
страница публикуется как плоский `<slug>.html`, а картинки поста (page
resources из `images/`) публикуются в соседнюю директорию `<slug>/images/…` —
т.е. `<slug>.html` и `<slug>/` сосуществуют как файл и директория с одним именем
на одном уровне `public/posts/`, без коллизии. Markdown-ссылки на такие ресурсы
(`![alt](images/foo.jpg)`) Hugo переписывает автоматически при рендере.

### `defaultContentLanguage = "ru"` + `defaultContentLanguageInSubdir = false`
Русский (язык по умолчанию) кладётся **без префикса** в корень; английский получает
префикс `/en/` автоматически. Это осознанное решение (лучше UX для основной,
русскоязычной аудитории) и оно обходит реальный дефект Hugo — см.
[`decisions/architecture-decisions.md`](../decisions/architecture-decisions.md).

> ⚠️ **Не ставьте `defaultContentLanguageInSubdir = true`** (т.е. не пытайтесь
> сделать русский как `/ru/...`), не перечитав раздел про дефект Hugo. С
> `uglyURLs = true` авто-редирект `/` → домашняя страница языка по умолчанию и сама
> домашняя страница резолвятся в один и тот же выходной путь, и авто-редирект молча
> затирает настоящую страницу. Флага, чтобы это отключить, нет (PR
> `gohugoio/hugo` #6138 не смёржен).

### `relativeURLs = true` — dot-relative ссылки (load-bearing)
Каждая внутренняя ссылка и путь к ассету (`relURL`, `.RelPermalink`) становятся
относительными (`../css/styles.css`) вместо корневых (`/css/styles.css`). Благодаря
этому папку `public/` можно открыть напрямую через `file://` без сервера — и она же
работает при деплое. **Не убирайте это.**

### `.Permalink` остаётся абсолютным путём
`.Permalink` (используется для `og:url`, `hreflang`) остаётся абсолютным **путём**
независимо от `relativeURLs`. Без `baseURL` локально это значит, что `og:url`
рендерится как корне-относительный (`/about.html`), а не полный URL. Это нормально и
безвредно (мета-теги не навигируются), а флаг `--baseURL` на CI делает их полными в
задеплоенном билде.

## Почему нужны явные `url:` и `outputs`

Обычным постам `url:` не нужен. Но у **разводящих страниц разделов** — архива постов
и каждой страницы серии — есть коллизия: RSS-фид раздела и HTML-страница претендуют
на один URL. Поэтому им нужны **два** ключа во frontmatter:

```yaml
url: /posts.html      # (или /series/<name>.html; для en — с префиксом /en/)
outputs: [html]       # гасит RSS, чтобы фид не «увёл» URL у HTML-страницы
```

Без `outputs: [html]` Hugo молча отдаёт этот URL RSS-фиду раздела вместо HTML.

> Если вы добавляете **ещё один** раздел-архив/список — ему понадобятся те же два
> ключа. Английский вариант получает префикс `/en/` вручную в `url:` — Hugo не умеет
> переставлять префикс для таких страниц.

## Алиасы старых URL (`aliases`)

Пост, у которого поменялся `slug` (обычно — исправление транслита на нормальный
английский, см. [`conventions/naming.md`](../conventions/naming.md#слаг--всегда-настоящий-английский-не-транслит)),
может объявить старый URL через `aliases:` во frontmatter — Hugo сгенерирует по
этому пути отдельную HTML-страницу-заглушку с `<meta http-equiv="refresh">` +
`<link rel="canonical">`, ведущими на актуальный URL поста.

```yaml
aliases: ["/posts/old-slug.html"]
```

> ⚠️ **`aliases` пишется БЕЗ языкового префикса — в отличие от `url:`.** Это
> противоположность правилу для ручного `url:` выше (там префикс `/en/` нужен
> явно). `aliases` проходит через ту же языковую URL-изацию, что обычный
> permalink страницы, — Hugo сам добавляет `/en/` для английского файла.
> Написать `aliases: ["/en/posts/old-slug.html"]` в `index.en.md` — реальная,
> легко допустимая ошибка: Hugo задвоит префикс (`/en/en/posts/old-slug.html`),
> и заглушка окажется по невидимому пути, а не по ожидаемому старому URL.
> Проверено сборкой: `aliases: ["/posts/old-slug.html"]` в `index.en.md` даёт
> корректный `public/en/posts/old-slug.html`; с префиксом в значении — заглушка
> уезжает в `public/en/en/posts/old-slug.html`, недостижимый снаружи.

## Особенности рендеринга Markdown (Goldmark)

Заданы в `hugo.toml`:

```toml
[markup.goldmark.renderer]
  unsafe = true                    # разрешает сырой HTML в Markdown (напр. <p>, <strong>)

[markup.goldmark.parser.attribute]
  title = true                     # включает синтаксис {#slug} на заголовках
```

- `unsafe = true` нужен, чтобы работали интро-абзацы `<p>...</p>` в постах и
  `<strong>` в описаниях на «Обо мне».
- `attribute.title = true` включает `## Заголовок {#anchor}`. Явный ASCII-якорь
  **обязателен** — авто-id Goldmark из кириллицы ломает скроллспай ToC. Формат якоря
  проверяется в `render-heading.html`. См.
  [`components/posts.md`](../components/posts.md) и
  [`conventions/naming.md`](../conventions/naming.md).

## hreflang и alternate-ссылки

`head.html` рендерит `hreflang` через `{{ range .AllTranslations }}` — включая
самоссылку (это корректная SEO-практика). Языковой переключатель — отдельный
механизм (реальная ссылка на перевод), см.
[`components/navigation-and-theme.md`](../components/navigation-and-theme.md).

## Связанные спецификации
- [`architecture/build-and-deploy.md`](../architecture/build-and-deploy.md) — как
  `baseURL` подставляется на CI.
- [`decisions/architecture-decisions.md`](../decisions/architecture-decisions.md) —
  почему выбрана именно эта схема.
- [`conventions/naming.md`](../conventions/naming.md) — правила слагов и якорей.
