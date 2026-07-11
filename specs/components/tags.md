# Компонент: теги

## Что и зачем

Теги группируют посты по темам. Каждый тег порождает страницу-список постов с этим
тегом (`/tags/cqrs.html`). Теги — это **Hugo taxonomy** (авто-генерируемые
term-страницы), в отличие от серий (рукописные страницы, см. [`series.md`](series.md)).

## Как устроено

### Конфиг (`hugo.toml`)
```toml
disableKinds = ["taxonomy"]   # ГАСИТ сводную страницу «все теги» (/tags.html)

[taxonomies]
  tag = "tags"                # frontmatter-поле `tags` → taxonomy «tags»

[outputs]
  term = ["html"]             # term-страница — только HTML (без RSS-фида на тег)
```

- `[taxonomies] tag = "tags"` связывает поле `tags` в постах с таксономией.
- `disableKinds = ["taxonomy"]` — **нет** сводной страницы «все теги». Есть только
  индивидуальные term-страницы. Это сознательно (зеркалит отсутствие «все серии»).
- `[outputs] term = ["html"]` — без RSS-фида на каждый тег (иначе Hugo сгенерил бы
  `/tags/<tag>/index.xml`, который никому не нужен).

### Данные
Поле `tags: [cqrs, distributed-systems, patterns]` в frontmatter поста. Слаги
**английские, kebab-case, не переводятся, одинаковые в ru/en** (см.
[`conventions/naming.md`](../conventions/naming.md#теги)).

### URL
- ru (default, без префикса): `/tags/<tag>.html`
- en (префикс): `/en/tags/<tag>.html`

Обычное правило «префикс языка спереди» применяется и здесь — Hugo не умеет
переставлять префикс для авто-генерируемых taxonomy-страниц.

### Per-language автоматика
Теги в Hugo per-language: term-страница `/tags/cqrs.html` автоматически содержит
только русские посты, `/en/tags/cqrs.html` — только английские. Ничего фильтровать
вручную не нужно.

## Шаблон (`layouts/tags/term.html`)

```go-html-template
{{ define "main" }}
<header class="profile-header">
  <h1 class="profile-name">#{{ .Data.Term }}</h1>
</header>
<div class="archive-list">
  {{ range .Pages.ByDate.Reverse }}
  {{ partial "archive-item.html" (dict "page" .) }}
  {{ end }}
</div>
{{ end }}
```

- Плоский список (не сгруппирован по годам, в отличие от архива постов).
- Заголовок — `#<tag>` (`.Data.Term`).
- Каждый ряд — общий partial `archive-item.html` (дата + ссылка на пост), тот же, что
  в архиве постов и на странице серии.
- Показывает только заголовок+дату (без описания, без тегов у ряда).

## `<head>` для term-страниц

У term-страницы **нет frontmatter**, поэтому `head.html` её спец-кейсит:

```go-html-template
{{ if eq .Kind "term" }}
  {{ $pageTitle = printf "#%s" .Data.Term }}
  {{ $pageDescription = i18n "tagPageDescription" (dict "Tag" .Data.Term) }}
{{ end }}
```

Иначе `<title>` был бы авто-титлкейзнутым термином, а description — пустым. i18n-ключ
`tagPageDescription` = «Посты с тегом #{{ .Tag }}» / «Posts tagged #{{ .Tag }}».

## Навигация: подсветка «Архив постов»

Term-страница — это «вид на посты», не отдельный пункт меню. `header.html` спец-кейсит
её, чтобы подсвечивался пункт «Архив постов»:

```go-html-template
{{ if eq .Kind "term" }}{{ $currentSection = "posts" }}{{ end }}
```

## Где показываются ссылки на теги

Только в **`.post-meta`** на странице поста (`posts/single.html`) через `.GetTerms "tags"`:

```go-html-template
{{ with .GetTerms "tags" }}
  {{ range . }}<a href="{{ .RelPermalink }}" class="tag-pill post-tag">#{{ .Data.Term }}</a>{{ end }}
{{ end }}
```

CSS-класс `.tag-pill` (пилюля) переиспользуется `.skill-tag` на «Обо мне».

**Намеренно НЕ показываются** теги:
- на карточках последних постов на главной;
- в рядах архива постов.

Причина: карточка на главной — это один `<a class="card">`, оборачивающий весь блок;
вложенные `<a>` на теги дали бы невалидный HTML.

## Отображение
`.tag-pill.post-tag` — маленькие пилюли рядом с датой в шапке поста. Одинаково на
desktop и mobile.

## Паттерн
Теги — эталонная реализация **taxonomy-паттерна**. Как добавить свою таксономию —
[`patterns/taxonomy-pattern.md`](../patterns/taxonomy-pattern.md).

## Интеграция
- [`posts.md`](posts.md) — теги в `.post-meta`.
- [`homepage-and-about.md`](homepage-and-about.md) — общий `archive-item.html` и
  класс `.tag-pill`.
- [`search.md`](search.md) — term-страницы в индекс поиска **не** попадают.

## Связанные специфы
- [`conventions/naming.md`](../conventions/naming.md#теги) — формат слагов.
- [`patterns/taxonomy-pattern.md`](../patterns/taxonomy-pattern.md).
