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
- **отсутствие** OG-мета-тегов (у постов их нет);
- `.container-wide` (см. ниже);
- рендер `partials/code-modal.html` и подключение
  `modules/copy-button.js`/`modules/code-expand.js` — эти два скрипта и модалка
  нужны только там, где вообще есть code-блоки (посты), поэтому на остальных
  страницах (главная, архив, теги, серии, about) не рендерятся и не
  загружаются вовсе. `main.js` учитывает это: `copyButton`/`codeExpand` могут
  быть `undefined` и вызываются через `if (copyButton) copyButton.init()`.

### Ширина страницы поста — `.container-wide`

Ширина страницы поста **зависит** от `$isPostSingle`: `baseof.html` добавляет к
`.container` класс `.container-wide`, который расширяет `max-width` до ширины
остальных страниц (`var(--container-width)`, 900px) плюс ширина ToC-сайдбара
(`var(--toc-width)`, 230px) — итого 1130px. `.post-layout`'s desktop grid
(`grid-template-columns: 1fr var(--toc-width)`) делает сайдбар **фиксированной**
колонкой, а не пропорциональной (`fr`) долей — поэтому `--toc-width` это не
приблизительная оценка, а реальная, всегда точная ширина `.toc-sidebar`, и весь
запас `.container-wide` добавляет целиком к `<article>`, а не делится с
сайдбаром. Без этого запаса широкие code-блоки в посте упирались бы в стенки
раньше, чем могли бы. Оба CSS-токена объявлены в `:root` (`styles.css`), полное
обоснование — [`homepage-and-about.md`](homepage-and-about.md#ширина-сайта--container).

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

## Подсветка кода (code blocks)

Fenced code blocks (` ```lang `) подсвечиваются встроенным в Hugo Chroma
(server-side, без JS-библиотек — см. [`architecture/tech-stack.md`](../architecture/tech-stack.md)
и ADR-5). Тема подсветки **напрямую** соответствует теме сайта (не инвертирована):
светлая тема сайта → Chroma-стиль `vs`, тёмная → `vulcan`.

- `hugo.toml` — `[markup.highlight] noClasses = false` (Chroma отдаёт классы
  токенов, не инлайн-цвета).
- `static/css/styles.css` — два блока CSS-правил, сгенерированных `hugo gen
  chromastyles --style=vs` и `--style=vulcan`: правила из `vs` идут как есть
  (дефолт/светлая тема сайта), правила из `vulcan` обёрнуты префиксом
  `[data-theme="dark"]` — тот же механизм, что уже переключает design tokens в
  `:root`/`[data-theme="dark"]` (см.
  [`navigation-and-theme.md`](navigation-and-theme.md#тема-darklight)). Имена
  классов токенов (`.k`, `.s`, `.c1`…) одинаковы в обеих темах — меняются
  только цвета, поэтому переключение темы кода — чистый CSS, без ветвления в
  шаблоне. `vs` — заметно более скупой на классы стиль, чем `vulcan` (меньше
  выделенных типов токенов по дизайну самого стиля) — непокрашенные токены
  просто наследуют цвет текста `.chroma`, это ожидаемо, а не пробел, который
  надо чем-то заполнять.
- Фон код-блока: `vs` (`#fff`) визуально не отличим от `--card-bg` в светлой
  теме, поэтому `background-color` для него переопределён на `var(--badge-bg)`
  отдельным правилом (комментарий в `styles.css` рядом объясняет, почему это
  надо повторно применять после регенерации блока `vs`). `vulcan` (`#282c34`)
  переопределения не требует — уже заметно светлее `--bg`/`--card-bg`, и его
  собственные правила (`.hl`, `.kc`) задают фон относительно этого же базового
  цвета, так что перекрашивать фон отдельно означало бы рассинхронизировать их.
- `layouts/_default/_markup/render-codeblock.html` — render-hook. **Единственная**
  его цель — обернуть штатный вывод `transform.Highlight .Inner .Type .Options`
  (тот же HTML, что Hugo сгенерировал бы и без хука, включая построчные опции
  фенса вроде `hl_lines`/`linenos` — `.Options` обязателен, без него они молча
  отбрасываются) в `.code-block-wrapper` с кнопками copy и expand. Хук не
  подменяет и не настраивает сам хайлайтинг.
- Обе кнопки лежат в общем `.code-block-actions` (флекс-контейнер,
  `position: absolute; top: 8px; right: 8px`) — сам контейнер отвечает за
  позицию и hover/focus-раскрытие, кнопки внутри просто обычные флекс-item без
  своего `position`/`opacity`. Скрыт по умолчанию (`opacity: 0`), появляется на
  `.code-block-wrapper:hover` или `.code-block-actions:focus-within` (а не
  `:focus-visible` на каждой кнопке по отдельности — так фокус на любой из двух
  кнопок раскрывает всю группу разом), а ниже мобильного порога `767px`, или на
  любом устройстве без надёжного hover/с грубым указателем
  (`(hover: none), (pointer: coarse)` — не только по ширине экрана, чтобы
  широкий touch-планшет/2-в-1 тоже попадал под правило), виден всегда. Обе
  кнопки — класс-комбо с `.btn-control`/`.btn-control-icon`
  (переиспользует размер/бордер/тень/hover-lift кнопок шапки); стиль иконок
  (`fill: none; stroke: currentColor`) общий для `.copy-btn svg, .expand-btn
  svg`.
- **Copy** (`.copy-btn`) — свап SVG-иконок (clipboard → checkmark на ~2 сек), по
  образцу sun/moon в
  [`navigation-and-theme.md`](navigation-and-theme.md#тема-darklight). Логика —
  `static/js/modules/copy-button.js` (`window.Blog.copyButton`, `init()` в
  `main.js`): читает `.textContent` уже отрендеренного `<code>` (Chroma-спаны
  игнорируются сами по себе, без data-атрибута с сырым текстом) и пишет через
  `navigator.clipboard.writeText`. **Не** `.innerText` — Chroma генерирует
  `.chroma .line { display: flex }`, и `.innerText` на flex-боксах вставляет
  свой перевод строки на границе каждого бокса поверх того `\n`, что уже лежит
  внутри строки у Chroma, задваивая пустые строки в скопированном тексте;
  `.textContent` не учитывает раскладку и отдаёт исходный текст как есть. Вызов
  обёрнут в `if (!navigator.clipboard) return;` (небезопасный источник/старый
  браузер — `navigator.clipboard` может отсутствовать) — без JS или без
  Clipboard API кнопка просто ничего не делает, код всё равно виден и выделяем
  вручную. `aria-label` — i18n-ключ `copyCodeAria` (статичный, не меняется при
  клике — меняется только иконка).
- **Expand** (`.expand-btn`, статичная stroke-иконка «maximize», без свапа —
  состояние кнопки не меняется) открывает код в модальном окне по центру
  экрана. Модалка — **одна на страницу**, не по одной на блок (по образцу
  `search-overlay`, тоже единственного экземпляра в `baseof.html`, см.
  [`search.md`](search.md)): partial `layouts/partials/code-modal.html`
  (`.code-modal-overlay`/`.code-modal-panel`/`.code-modal-header`/
  `.code-modal-close`/`.code-modal-content`), логика —
  `static/js/modules/code-expand.js` (`window.Blog.codeExpand`, `init()` в
  `main.js`). При клике на Expand JS клонирует `.highlight` (обёртку
  `transform.Highlight`, содержащую сам `.chroma`) выбранного блока в
  `#code-modal-content` — модалка не рендерится на сборке для каждого блока
  отдельно, а переиспользует уже готовую, подсвеченную разметку в рантайме.
  `.code-modal-content` не задаёт свой фон/бордер/размер шрифта — они приходят
  вместе с склонированными классами `.chroma`, поэтому тема (`vs`/`vulcan`) и
  размер шрифта совпадают с блоком-источником без дублирования CSS. Закрытие —
  клик по фону (`overlay`, не по `panel`), `Escape` или отдельная
  close-кнопка (`aria-label` — `codeModalCloseAria`); при закрытии фокус
  возвращается на кнопку, которой была открыта модалка, а
  `#code-modal-content` очищается — тот же паттерн open/close/Escape/клик-по-
  фону, что уже реализован в `search.js` (см. [`search.md`](search.md)). Клик в
  любом другом месте code block модалку не открывает — обработчик навешан
  только на `.expand-btn`.
- `.chroma` не имеет padding из коробки — `padding: 44px 16px 16px` в
  `styles.css` намеренно больше сверху, чтобы длинная первая строка кода не
  оказывалась под абсолютно спозиционированной группой кнопок; `border: 1px
  solid var(--border)` отделяет блок от окружающего текста (без него блок
  сливался с фоном страницы); `font-size: 14px` — код мельче текста поста
  (`.post-content` — `1.05rem`), т.к. код обычно занимает много места на
  экране. Граница, padding и font-size — только на `.chroma`, не на обёртку
  `.highlight` (у неё нет своего фона, значит и рамка задвоилась бы).
- `overflow-x: auto` на `.chroma` держит длинные строки (Chroma не переносит
  строки — `white-space: pre`) внутри блока, а не раздвигает страницу — но
  **сам по себе недостаточен**. `.post-layout` — CSS grid
  (`grid-template-columns: 1fr var(--toc-width)`), и без
  `.post-layout > article { min-width: 0; }` (см. ниже) grid-элемент по
  умолчанию не может сжаться меньше min-content своего содержимого; у
  нередкой строки без пробелов-разрывов min-content равен полной её ширине —
  колонка статьи раздувалась far past свою `1fr`-долю и физически вытесняла
  `.toc-sidebar` за пределы страницы (ToC не сужался, а пропадал). Это была
  реальная регрессия, пойманная уже после первой версии фичи — `min-width: 0`
  и `overflow-x: auto` работают только вместе: первое не даёт колонке
  раздуться, второе даёт длинной строке скроллиться в уже правильно
  посчитанной ширине.

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

## Связанные спецификации
- [`data-model/frontmatter-reference.md`](../data-model/frontmatter-reference.md) —
  схема frontmatter поста.
- [`guides/add-new-post.md`](../guides/add-new-post.md) — как добавить пост.
