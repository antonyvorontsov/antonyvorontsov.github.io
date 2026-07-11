# Компонент: поиск

## Что и зачем

Клиентский полнотекстовый поиск по сайту. Открывается кнопкой-лупой в шапке,
модальное окно с полем ввода, результаты фильтруются по мере набора. Без сервера, без
сторонних библиотек — на сборке генерится JSON-индекс, JS его подгружает и фильтрует.

## Архитектура

```
СБОРКА (Hugo)                          РАНТАЙМ (браузер)
┌─────────────────────────┐            ┌──────────────────────────────────┐
│ index.searchindex.json  │  генерит   │ search.js:                       │
│  → /search-index.json    │──────────▶│  1. fetch(search-index.json) 1 раз│
│  → /en/search-index.json │  (по язык)│  2. фильтр по title/desc/content │
└─────────────────────────┘            │  3. рендер списка результатов    │
                                        └──────────────────────────────────┘
                                          ▲ открывает search-modal.html
                                          │ кнопка #search-btn (header.html)
```

## Генерация индекса (`layouts/index.searchindex.json`)

Кастомный output-формат `searchindex`, объявленный в `hugo.toml`:

```toml
[outputFormats.searchindex]
  mediaType = "application/json"
  baseName = "search-index"     # файл называется search-index.json (не index.json)
  isPlainText = true
  notAlternative = true
```

Включается в `outputs` главной (`content/_index.*.md`):
```yaml
outputs: ["html", "rss", "searchindex"]
```
Поэтому индекс генерится **по одному на язык** (в рамках сайта каждого языка).

### Что попадает в индекс
```go-html-template
{{- $pages := slice . -}}                                      {{/* сама главная */}}
{{- with .Site.GetPage "/about" -}}…{{- end -}}                {{/* about */}}
{{- with .Site.GetPage "/posts" -}}…{{- end -}}                {{/* архив постов */}}
{{- range where .Site.RegularPages "Section" "posts" -}}…{{- end -}}   {{/* все посты */}}
{{- range where .Site.RegularPages "Section" "series" -}}…{{- end -}}  {{/* все серии */}}
```

Каждая запись:
```json
{"title": "…", "url": "…", "description": "…", "content": "<первые 400 симв .Plain>"}
```

**НЕ индексируются:** term-страницы тегов. **Per-language:** каждый индекс содержит
только страницы своего языка (`.Site.RegularPages` в рамках языка).

> Именно поэтому у серий обязателен `description:` во frontmatter — иначе результат
> серии в поиске будет без описания.

## Разметка модалки (`layouts/partials/search-modal.html`)

```
.search-overlay#search-overlay[hidden]
└── .search-panel[role=dialog][aria-modal]
    ├── .search-input-row
    │   ├── svg лупа
    │   ├── input#search-input  (placeholder = i18n searchPlaceholder)
    │   └── button#search-close
    └── .search-results#search-results[data-no-results-text = i18n searchNoResults]
```

Все тексты — через i18n (`searchPlaceholder`, `searchNoResults`, `searchCloseAria`,
`searchAria`).

## Логика (`static/js/modules/search.js`)

Модуль `window.Blog.search`, ленивая загрузка индекса:

```js
function loadIndex(url) {            // грузит один раз, кэширует промис
  if (!indexPromise) {
    indexPromise = fetch(url).then(res => res.json()).then(data => { index = data; return data; });
  }
  return indexPromise;
}

function matches(entry, query) {     // регистронезависимо, подстрока
  return entry.title.toLowerCase().includes(query)
      || entry.description.toLowerCase().includes(query)
      || entry.content.toLowerCase().includes(query);
}
```

- Индекс грузится при **открытии** модалки (`open()` вызывает `loadIndex`), не на
  загрузке страницы.
- URL индекса приходит из `data-search-index` на `#search-btn`:
  ```go-html-template
  data-search-index="{{ (strings.TrimSuffix "index.html" .Site.Home.RelPermalink) }}search-index.json"
  ```
  → для en это автоматически `…/en/search-index.json` (язык-корректно).
- Поиск — простая подстрока по трём полям, до 20 результатов (`entries.slice(0, 20)`).
- Пустой запрос очищает результаты; «ничего не найдено» — из `data-no-results-text`.

### UX
- Открытие: клик по `#search-btn` → `overlay.hidden = false`, фокус на input.
- Закрытие: `Escape`, клик по крестику, клик по подложке (`e.target === overlay`).
- Никакого дебаунса — фильтр по массиву дешёвый.

## Ограничения (осознанные)
- Поиск по подстроке, без стемминга/ранжирования/фаззи — достаточно для десятков
  постов.
- Индекс — первые 400 символов `.Plain` контента (не весь текст).
- Нет подсветки совпадений.

## Интеграция
- Кнопка открытия — в `.controls` шапки ([navigation-and-theme.md](navigation-and-theme.md)).
- Индексируемые страницы — [posts](posts.md), [series](series.md),
  [homepage-and-about](homepage-and-about.md).
- Двуязычность — индекс и `data-search-index` язык-корректны автоматически.

## Как добавить новый тип страниц в индекс
В `layouts/index.searchindex.json` добавить ещё один `range where .Site.RegularPages
"Section" "<новый-раздел>"`. Убедиться, что у страниц есть `description`.

## Связанные специфы
- [`data-model/frontmatter-reference.md`](../data-model/frontmatter-reference.md) —
  `outputs` с `searchindex`.
- [`architecture/tech-stack.md`](../architecture/tech-stack.md) — почему без
  библиотеки поиска.
