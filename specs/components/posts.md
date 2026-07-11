# Компонент: посты

## Что и зачем

Пост — основная единица контента блога: статья на русском и/или английском. Страница
поста показывает заголовок, теги, дату, (опционально) метку серии, тело статьи и
сайдбар-оглавление (ToC) со скроллспаем.

## Как устроено

### Данные
`content/posts/<slug>.{ru,en}.md`. Frontmatter — см.
[`data-model/frontmatter-reference.md`](../data-model/frontmatter-reference.md#пост).
Тело: интро-абзац `<p>...</p>`, дальше секции `## Заголовок {#anchor}` / `### … {#anchor}`.

### Шаблоны
- `layouts/posts/single.html` — страница одного поста.
- `layouts/_default/_markup/render-heading.html` — render-hook, проверяющий якоря.
- `layouts/partials/post-date.html` + `date-ru.html` — дата.
- `layouts/posts/list.html` — архив (описан в
  [`homepage-and-about.md`](homepage-and-about.md)).

### Флаг `$isPostSingle`
`baseof.html` один раз вычисляет `$isPostSingle = (and .IsPage (eq .Section "posts"))`
через `.Scratch` и переиспользует в `head.html`. Для страницы поста это даёт:
- суффикс в `<title>` (i18n `siteTitleSuffix`);
- **отсутствие** OG-мета-тегов (у постов их нет).

Ширина страницы поста **не** зависит от `$isPostSingle` — все страницы сайта
используют один и тот же `.container` (см. [`homepage-and-about.md`](homepage-and-about.md#ширина-сайта--container)).

## Страница поста: структура (`posts/single.html`)

```
.post-layout                          (grid: article + sidebar на desktop)
├── article
│   ├── .post-cover (если cover)  ← partial cover-image.html, ПЕРЕД заголовком
│   ├── .post-header
│   │   ├── h1  (title)
│   │   ├── .post-meta
│   │   │   ├── теги (a.tag-pill.post-tag)  ← .GetTerms "tags"
│   │   │   └── дата  ← partial post-date.html
│   │   └── .post-series-meta (если series)  ← «Серия постов «…» №N»
│   ├── .post-content#post-content  (.Content — Markdown → HTML)
│   └── .post-series-mobile (если series)  ← только моб., см. series.md
└── aside.toc-sidebar#toc-sidebar   (desktop only)
    ├── .toc-title + .toc-list  ← из .Fragments.Headings
    └── .toc-series (если series)  ← только заголовок серии
```

`.post-cover` — первый элемент внутри `<article>`, до `.post-header`: обложка
показывается выше заголовка и метаданных, как первый визуальный блок страницы.

Метка серии рендерится в **трёх** местах — полностью описано в
[`series.md`](series.md).

## Обложка (`cover`) и инлайн-картинки

Изображения поста ограничены **двумя** механизмами — обложка и инлайн-картинки в
теле. Картинок в карточках на главной **нет** (см.
[`homepage-and-about.md`](homepage-and-about.md)) — карточка чисто текстовая.

- `cover` — опциональный объект `{src, alt}` во frontmatter. Позиция рендера
  (`.post-cover`, до `.post-header`) — см. структуру выше.
- Поле валидируется в начале `single.html` через общий partial
  `partials/assert-image-field.html` (по образцу `assert-unique.html` — сам
  partial не знает конкретного текста ошибки, только механику проверки, текст
  строит вызывающий шаблон через `printf`): если объект присутствует, но не
  хватает `src` или `alt` — сборка падает с `errorf`.
- Сам рендер идёт через отдельный partial `partials/cover-image.html`, вызываемый
  как `{{ partial "cover-image.html" .Params.cover }}` (значение напрямую как `.`,
  без `dict` — единственный параметр, по образцу `post-date.html`, см.
  [`patterns/shared-partial-pattern.md`](../patterns/shared-partial-pattern.md)).
  Partial **повторно** проверяет форму (`isset src`/`isset alt`) перед тем, как
  вывести `<img>`, и молча ничего не рендерит, если форма невалидна. Это не избыточность:
  `errorf` в Hugo только логирует ошибку и не прерывает выполнение шаблона
  (ADR-8), поэтому без этой повторной проверки невалидный `cover` (например,
  строка вместо объекта) обваливает сборку необработанной Go-паникой на
  `{{ .src }}` вместо контролируемого `errorf`. Оба partial'а сейчас используются
  только здесь (единственное место с изображением поста вне тела), но остаются
  отдельными файлами ради этого разделения проверка/рендер, а не ради переиспользования
  между несколькими шаблонами — см. [`patterns/shared-partial-pattern.md`](../patterns/shared-partial-pattern.md).
- Никакого Hugo-пайплайна ресайза (ADR-5) — `src` указывает на уже готовый
  статический файл, `cover-image.html` только прогоняет его через `relURL`.
- Файлы лежат в `static/assets/images/posts/<slug>/` (`cover.jpg`, инлайн-картинки —
  произвольные имена). **Держите `cover` разумного размера** — ресайза на сборке
  нет, файл идёт в браузер как есть, только сжатый CSS-ом под размер `.post-cover`.
- **Инлайн-картинки в теле** — обычный Markdown `![alt](/assets/images/posts/<slug>/name.jpg)`,
  без отдельного поля frontmatter. Путь **с ведущим `/`** (в отличие от
  `cover.src` — без него), т.к. полагается на Hugo-постпроцессинг
  `relativeURLs = true`, а не на явный `relURL` в шаблоне. См.
  [`frontmatter-reference.md`](../data-model/frontmatter-reference.md#пост) —
  полная схема полей.

## Оглавление (ToC) и скроллспай

### Server-side построение
ToC строится в `posts/single.html` из **`.Fragments.Headings`** (не из
`.TableOfContents` — `.Fragments` даёт нужную вложенность h2→h3):

```go-html-template
{{ if .Fragments.Headings }}
{{ $root := index .Fragments.Headings 0 }}
{{ $seen := slice }}
<ul class="toc-list">
  {{ range $root.Headings }}
    {{ $seen = partial "assert-unique.html" (dict "seen" $seen "key" .ID "message" (printf "duplicate heading anchor #%s …" .ID $.File.Path)) }}
    <li><a href="#{{ .ID }}" class="toc-link">{{ .Title }}</a></li>
    {{ range .Headings }}   {{/* h3 внутри h2 */}}
      …та же проверка через assert-unique.html + <a style="padding-left:16px">…
    {{ end }}
  {{ end }}
</ul>
{{ end }}
```

Дубликат-проверка (`if in $seen / errorf / append`) вынесена в общий partial
`layouts/partials/assert-unique.html` (см. ADR-8 в
[`decisions/architecture-decisions.md`](../decisions/architecture-decisions.md)) —
используется и здесь, и в `series/single.html` для `series.number`.

Проверка **уникальности** якорей живёт здесь (а не в render-hook) — потому что
`Page.Scratch` протекал между рендер-проходами дев-сервера Hugo. Render-hook
проверяет только **формат** якоря.

### Client-side скроллспай (`navigation.js` → `initToc`)
JS **не строит** ToC (он уже отрендерен Hugo), а только подсвечивает активную ссылку
при скролле через `IntersectionObserver`:

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const link = tocList.querySelector(`a[href="#${entry.target.id}"]`);
    if (!link || !entry.isIntersecting) return;
    tocLinks.forEach((l) => l.classList.remove('active'));
    link.classList.add('active');
  });
}, { rootMargin: '-80px 0px -70% 0px' });
```

Именно из-за этого lookup `a[href="#${id}"]` якоря **обязаны быть ASCII** — см. ниже.

## Якоря заголовков: почему явный ASCII `{#slug}`

Render-hook `layouts/_default/_markup/render-heading.html`:

```go-html-template
{{- if not (findRE "^[a-z0-9]+(-[a-z0-9]+)*$" .Anchor) -}}
  {{- errorf "heading %q in %s has no explicit ASCII {#slug} anchor (got #%s) — …" … -}}
{{- end -}}
<h{{ .Level }} id="{{ .Anchor }}">{{ .Text }}</h{{ .Level }}>
```

- **Проблема:** для кириллического заголовка Goldmark генерит id percent-энкодингом,
  и `href="#…"` (энкоденный) не совпадает с `id="…"` — скроллспай ломается.
- **Решение:** обязательный явный ASCII-якорь `{#context}`. Формат проверяет
  render-hook (⛔ errorf), уникальность — `single.html` (⛔ errorf).
- Синтаксис `{#slug}` включён `[markup.goldmark.parser.attribute] title = true`.

Правила якорей — [`conventions/naming.md`](../conventions/naming.md#якоря-заголовков-).

## Дата поста

```go-html-template
{{/* post-date.html */}}
{{- if eq .Language.Lang "ru" -}}
<span class="post-date">{{ partial "date-ru.html" .Date }}</span>     {{/* «2 августа 2025» — генитив */}}
{{- else -}}
<span class="post-date">{{ .Date.Format "January 2, 2006" }}</span>   {{/* «August 2, 2025» */}}
{{- end -}}
```

Русских генитивных месяцев нет в Go/Hugo из коробки — `date-ru.html` хардкодит список
месяцев. `archive-date.html` — отдельный, короткий формат `2006-01-02` для списков.

Дата обёрнута в `<span class="post-date">`, чтобы `.post-meta .post-date {
flex-basis: 100% }` форсировал перенос: `.post-meta` — `display: flex; flex-wrap:
wrap`, и full-width flex-item не помещается в текущий ряд рядом с тегами, поэтому
всегда уходит на новую строку под ними. Тот же `post-date.html` используется и в
карточке на главной (`.card-meta`, не `.post-meta`) — там правило не действует,
дата остаётся как раньше, отдельным элементом без тегов рядом.

## Отображение: desktop vs mobile

- **Desktop:** `.post-layout` — двухколоночный grid (`3fr 1.2fr`) внутри
  `.container`: статья + `.toc-sidebar` справа.
- **Mobile (`≤767px`):** `.toc-sidebar { display: none }` — сайдбар (с ToC и блоком
  серии) скрыт. Вместо блока серии показывается отдельная `.post-series-mobile`
  ссылка под контентом.

## Интеграция
- **Теги** — `.GetTerms "tags"` в `.post-meta`; см. [`tags.md`](tags.md).
- **Серии** — блок `series` в трёх местах; см. [`series.md`](series.md).
- **Поиск** — пост попадает в `search-index.json`; см. [`search.md`](search.md).
- **Двуязычность** — переключатель ведёт на перевод поста; см.
  [`conventions/bilingual-model.md`](../conventions/bilingual-model.md).

## Связанные специфы
- [`data-model/frontmatter-reference.md`](../data-model/frontmatter-reference.md) —
  схема frontmatter поста.
- [`guides/add-new-post.md`](../guides/add-new-post.md) — как добавить пост.
