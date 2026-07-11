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
- класс `container-wide` (шире, чтобы влезал ToC-сайдбар);
- **отсутствие** OG-мета-тегов (у постов их нет).

## Страница поста: структура (`posts/single.html`)

```
.post-layout                          (grid: article + sidebar на desktop)
├── article
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

Метка серии рендерится в **трёх** местах — полностью описано в
[`series.md`](series.md).

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
  {{- partial "date-ru.html" .Date -}}      {{/* «2 августа 2025» — генитив */}}
{{- else -}}
  {{- .Date.Format "January 2, 2006" -}}    {{/* «August 2, 2025» */}}
{{- end -}}
```

Русских генитивных месяцев нет в Go/Hugo из коробки — `date-ru.html` хардкодит список
месяцев. `archive-date.html` — отдельный, короткий формат `2006-01-02` для списков.

## Отображение: desktop vs mobile

- **Desktop:** `.post-layout` — двухколоночный grid: статья + `.toc-sidebar` справа.
  `container-wide` даёт дополнительную ширину.
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
