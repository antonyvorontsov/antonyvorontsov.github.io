# Компонент: главная, «Обо мне», архив постов

Три «страницы-хаба» с общим profile-header и переиспользуемыми partial'ами.

## Общий `profile-header.html`

Шапка профиля (аватар + имя + титул + био + соцсети). Используется **главной** и
**«Обо мне»**.

Вызывается через `dict` с параметрами: `page` (контекст страницы), `showAvatar`
(явный bool) и `useHomeBio` (явный bool, см. ниже).

```go-html-template
{{ $page := .page }}
{{ $showAvatar := .showAvatar }}
{{ $site := $page.Site }}
{{ $hasSocial := $page.Params.social }}
<header class="profile-header profile-header-center">
  {{ if $showAvatar }}<div class="avatar-wrap"><img … class="avatar-img"></div>{{ end }}
  <h1 class="profile-name">{{ $site.Params.profileName }}</h1>
  <p class="profile-title">{{ $site.Params.profileTitle }}</p>
  {{ $bio := $site.Params.bio }}
  {{ if .useHomeBio }}{{ $bio = $site.Params.homeBio }}{{ end }}
  <div class="profile-bio">{{ range $bio }}<p>{{ . }}</p>{{ end }}</div>
  {{ if $hasSocial }}… соцсети через social-icon.html …{{ end }}
</header>
```

Места вызова:
```go-html-template
{{/* layouts/about.html */}}   {{ partial "profile-header.html" (dict "page" . "showAvatar" true) }}
{{/* layouts/index.html */}}   {{ partial "profile-header.html" (dict "page" . "showAvatar" false "useHomeBio" true) }}
```

**Три независимые развилки:**
- **Аватар** — по явному флагу `showAvatar` (передаётся из места вызова).
- **Bio-текст** — по явному флагу `useHomeBio` (тот же принцип, что и у
  `showAvatar` — видимость/выбор источника логически не зависит от данных, см.
  [`patterns/shared-partial-pattern.md`](../patterns/shared-partial-pattern.md)).
  Главная показывает короткий `homeBio` (одна фраза о теме блога), «Обо мне» —
  полный `bio` (два абзаца с бэкграундом). Оба — отдельные site-параметры на
  языках, не связаны друг с другом.
- **Соцсети** — по наличию данных `social` во frontmatter (сами данные и есть то, что
  рендерится, поэтому блок физически не может существовать без них).

Сейчас: «Обо мне» — `showAvatar true`, `useHomeBio` не передан (→ `bio`) + есть
`social` (аватар и соцсети); главная — `showAvatar false`, `useHomeBio true` (→
`homeBio`), `social` нет. Развилки развязаны — будущая страница может показать
аватар без соцсетей, или наоборот.

Данные: `profileName`, `bio`, `homeBio` — из `[languages.<lang>.params]`
(переводятся); `profileTitle` — из `[params]` (общий). См.
[`conventions/bilingual-model.md`](../conventions/bilingual-model.md).

## Ширина сайта — `.container`

`.container` (обёртка всего контента, задаётся в `baseof.html`) —
`max-width: var(--container-width)` (900px). Это значение применяется главной,
архиву, тегам, сериям и «Обо мне» — все они используют один и тот же класс
`.container`.

Страница поста — исключение: она получает дополнительный класс `.container-wide`
(добавляется в `baseof.html` через уже вычисленный `.Scratch "isPostSingle"`,
см. [`posts.md`](posts.md#ширина-страницы-поста--containerwide)), который
расширяет `max-width` до `var(--container-width) + var(--toc-width)` (900px +
230px = 1130px). Так было и раньше (класс `container-wide` — не новый, а
восстановленный: сайт какое-то время жил с единой шириной для всех страниц —
`.container` без варианта, 900px и постам, и остальным — но на практике этого не
хватало постам с широкими code-блоками, т.к. `<article>` внутри grid'а
статья+ToC-сайдбар был заметно уже 900px).

`--toc-width` — не приблизительная оценка, а **точная** ширина `.toc-sidebar`:
desktop-grid `.post-layout` (`grid-template-columns: 1fr var(--toc-width)`, см.
[`posts.md`](posts.md#структура-oглавление-toc-и-скроллспай)) делает сайдбар
фиксированной колонкой, а не пропорциональной (`fr`) долей. Поэтому весь запас,
который добавляет `.container-wide` сверх обычных 900px, целиком достаётся
`<article>`, а не делится с сайдбаром пропорционально — ровно то, ради чего
формула вообще была нужна (широкие code-блоки в посте). Если бы сайдбар
остался на `fr`-долях, `--toc-width` быстро разошёлся бы с его реальной
шириной при любом изменении пропорции/gap/padding — так и было в первой версии
этой фичи (сайдбар на `3fr 1.2fr` рендерился шире объявленных 230px, а
`<article>` — уже, чем предполагала формула); фикс — не в спеке, а в самом
grid'е, ставшем источником истины для этого числа.

## Главная (`layouts/index.html`)

```
profile-header (без соцсетей)
└── section «Последние посты»
    ├── h2.section-heading (svg + i18n latestPostsTitle)
    ├── .cards-grid
    │   └── {{ range first 5 (where .Site.RegularPages "Section" "posts").ByDate.Reverse }}
    │       a.card
    │       ├── .card-title-row
    │       ├── .card-meta
    │       └── .card-description
    └── a.btn-show-more → архив постов (i18n showMore)
```

- Показывает **5 последних** постов карточками.
- Карточка — **один `<a class="card">`**, оборачивающий весь блок → внутри не может
  быть вложенных `<a>` (поэтому теги на карточках не показываются, см.
  [`tags.md`](tags.md)).
- **Карточка чисто текстовая — без изображений.** Раньше карточка показывала
  превью (`thumbnail` с fallback на `cover`), но в текущем дизайне картинка
  выглядела плохо в сжатом виде — функционал полностью убран (метаданные,
  рендер, CSS). Единственное место, где показывается изображение поста —
  `.post-cover` на странице самого поста (см. [`posts.md`](posts.md)); карточки
  на главной картинок не показывают.
  Схема полей — [`frontmatter-reference.md`](../data-model/frontmatter-reference.md#пост).
- Ссылка «Показать ещё» ведёт на `/posts` (архив).

## «Обо мне» (`layouts/about.html`)

Маршрутизируется через `layout: about` во frontmatter. Рендерит структурированные
данные из frontmatter (см.
[`data-model/frontmatter-reference.md`](../data-model/frontmatter-reference.md#обо-мне)):

```
profile-header (с аватаром и соцсетями)
├── section «Опыт»      → range .Params.experience → timeline-item (showCompany=true)
├── section «Выступления» → range .Params.speaking → timeline-item (showCompany=false)
└── section «Навыки»    → range .Params.skills → .skills-category → .skill-tag (tag-pill)
```

### `timeline-item.html`
Рендерит одну запись `experience`/`speaking`, параметризован `showCompany`:
```go-html-template
<span class="timeline-role">{{ $item.role }}</span>
<span class="timeline-meta">
  {{ if .showCompany }}<span class="timeline-company">{{ $item.company }}</span>{{ end }}
  <span class="timeline-date">{{ $item.date }}</span>
</span>
<p>{{ $item.desc | safeHTML }}</p>     {{/* safeHTML → допускает <strong> в desc */}}
```

`role` и `.timeline-meta` — ровно два top-level flex-child в `.timeline-header`
(`justify-content: space-between`), независимо от того, есть ли `company`.
Раньше role/company/date были тремя прямыми flex-child в одном ряду — при трёх
элементах `company` «плавал» в свободном пространстве между role и date, смещаясь
от длины role. Группировка company+date в один `.timeline-meta`
(`flex-direction: column; align-items: flex-end`) ставит их друг над другом,
прижатыми к правому краю, — устойчиво независимо от длины role, и работает
одинаково что для `experience` (есть company), что для `speaking` (только date).

По формату `date` — оба языка используют одинаковое слово **"Present"** для
незавершённых записей (не "настоящее время" в ru) — единообразие важнее перевода
здесь, т.к. это короткая метка в интерфейсе-таймлайне, а не текст поста.

### `social-icon.html`
Возвращает инлайн-svg по ключу `icon`: `linkedin` | `github` | `getmentor` |
`telegram`. Новый соцсеть = добавить ветку `{{ else if eq . "…" }}` с svg.

## Архив постов (`layouts/posts/list.html`)

```
header.profile-header (h1 = i18n postsArchiveTitle)
└── {{ range .Pages.GroupByPublishDate "2006" }}
    .archive-year-group
    ├── h2.archive-year ({{ .Key }} = год)
    └── .archive-list
        └── {{ range .Pages }} archive-item.html
```

- Посты **сгруппированы по годам** публикации (в отличие от плоских списков тегов и
  серий).
- URL — `/posts.html` (ru) / `/en/posts.html` (en), задан `url:` во frontmatter
  `posts/_index.*.md` (см. [`data-model/url-scheme.md`](../data-model/url-scheme.md)).

## Общий `archive-item.html` — переиспользуемый ряд списка

Один ряд «дата + ссылка», используется **тремя** списками: архив постов, страница
тега, страница серии.

```go-html-template
{{ $linkText := .linkText | default $page.Title }}
<div class="archive-item">
  {{ if not .hideDate }}<span class="archive-date">{{ partial "archive-date.html" $page }}</span>{{ end }}
  <a href="{{ $page.RelPermalink }}" class="archive-link">{{ $linkText }}</a>
</div>
```

Параметры (через `dict`):
| Параметр   | По умолчанию   | Кто передаёт                                  |
|------------|----------------|-----------------------------------------------|
| `page`     | — (обяз.)       | все                                           |
| `linkText` | `$page.Title`   | серия (передаёт «№N. Заголовок»)              |
| `hideDate` | `false`         | серия (`true` — даты не нужны)               |

Это эталон **shared-partial-паттерна** — см.
[`patterns/shared-partial-pattern.md`](../patterns/shared-partial-pattern.md).

## CSS-переиспользование
- `.tag-pill` — базовый класс пилюль; `.skill-tag` (здесь) и `.post-tag` (теги)
  наследуют от него.
- `.profile-header`, `.profile-name` — переиспользуются заголовками архива/тега/серии.

## Интеграция
- Карточки главной — [posts](posts.md) (те же посты).
- `archive-item.html` — общий с [tags](tags.md) и [series](series.md).
- Данные профиля — [bilingual-model](../conventions/bilingual-model.md).

## Связанные спецификации
- [`data-model/frontmatter-reference.md`](../data-model/frontmatter-reference.md#обо-мне) —
  схема данных «Обо мне».
- [`patterns/shared-partial-pattern.md`](../patterns/shared-partial-pattern.md).
