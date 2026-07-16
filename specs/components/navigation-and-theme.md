# Компонент: навигация, тема, футер

Шапка (`header.html`) и футер (`footer.html`) — общий каркас всех страниц, плюс
клиентская логика темы/меню в `navigation.js`.

## Шапка (`layouts/partials/header.html`)

Структура:
```
.nav-container
├── nav.nav-menu
│   ├── a.nav-avatar-link  → главная (аватар; href физически ".../index.html" —
│   │                        см. ниже про initCleanHomeURL)
│   ├── button#nav-burger  → бургер (моб.), 2 svg (open/close)
│   └── .nav-links#nav-links
│       └── {{ range .Site.Menus.main }} a.nav-link[.active]
└── .controls
    ├── button#search-btn      → поиск (см. search.md)
    ├── a#lang-btn             → переключатель языка
    └── button#theme-btn       → тема (sun/moon svg)
```

### Пункты меню и подсветка активного
Меню — из `.Site.Menus.main` (файлы `config/_default/menus.{ru,en}.toml`). Активность:

```go-html-template
{{ $itemActive := or (eq $.RelPermalink .Page.RelPermalink)
                     (and (eq .Page.Section "posts") (eq $currentSection "posts")) }}
```

`$currentSection` спец-кейсит «виды на посты», чтобы пункт «Архив постов»
подсвечивался и на них:
```go-html-template
{{ if eq .Kind "term" }}{{ $currentSection = "posts" }}{{ end }}      {{/* страница тега */}}
{{ if eq .Section "series" }}{{ $currentSection = "posts" }}{{ end }} {{/* страница серии */}}
```

### Переключатель языка
Реальная ссылка на перевод (не JS-тоггл). Полностью описан в
[`conventions/bilingual-model.md`](../conventions/bilingual-model.md#переключатель-языка--реальная-ссылка).
Подпись кнопки — `shortLabel` другого языка («En»/«Ru»).

### Чистка адресной строки на главной (`navigation.js` → `initCleanHomeURL`)
`relativeURLs` + `uglyURLs` (см.
[`data-model/url-scheme.md`](../data-model/url-scheme.md)) заставляют `href`
аватара физически указывать на `.../index.html` — иначе сломается открытие
`public/` через `file://`. Поэтому после загрузки страницы `initCleanHomeURL`
проверяет `window.location.pathname` и, если он оканчивается на
`/index.html` и протокол не `file:`, убирает `index.html` из адресной строки
через `history.replaceState` (без перезагрузки и без новой записи в истории).
Из-за этого клик по аватару с любой другой страницы возвращает на чистый
`/` (или `/en/`), а не на `.../index.html`.

## Тема (dark/light)

Тема — предпочтение **посетителя, не языка** (client-driven, в `localStorage`).

### Разметка
Кнопка `#theme-btn` с двумя svg (`.theme-icon-light` солнце / `.theme-icon-dark`
луна). Активная тема — атрибут `data-theme` на `<html>`; CSS-переменные в
`[data-theme="dark"]` переопределяют `:root`.

### Логика (`navigation.js` → `initTheme`)
```js
function getSystemTheme() {
  return getStoredTheme()
      || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
function toggleTheme() {
  const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}
```
- При загрузке: `localStorage.theme` → иначе системная тема (`prefers-color-scheme`).
- Клик свапает тему, пишет в `localStorage`, меняет иконку (`updateThemeIcon`
  показывает/скрывает солнце/луну).
- Модуль **не знает язык** — кнопка чисто иконочная, текстовой подписи у неё нет
  (только `aria-label` из i18n `themeSwitchAria`). Никаких текстовых подписей темы
  (`data-*-label`, отдельных i18n-ключей) в коде нет — свапаются только svg-иконки.

## Бургер-меню (mobile)

Ниже `767px` три пункта `.nav-links` сворачиваются в дропдаун, управляемый
`#nav-burger`. Выше порога `.nav-links` всегда видимы через CSS, а этот код ни на что
не влияет.

`navigation.js` → `initMobileMenu`:
- клик по бургеру — open/close (класс `.open` на `.nav-links`, свап svg-иконок,
  `aria-expanded`);
- закрытие по клику вне и по `Escape` (слушатели навешиваются только пока открыто).

## Футер (`layouts/partials/footer.html`)

```go-html-template
{{ i18n "footerCopyright" (dict "Year" "<span id=\"copyright-year\">2026</span>" "Name" .Site.Params.profileName) | safeHTML }}
… {{ i18n "madeWithHugo" | safeHTML }}
```
- Копирайт с именем и годом; год — в `<span id="copyright-year">`, который
  `utils.js` → `updateFooterYear` обновляет на диапазон «2026 - <текущий>», если год > 2026.
- «Сделано с помощью Hugo» — i18n-ключ `madeWithHugo` (содержит ссылку, потому
  `safeHTML`).

## SVG-иконки
Все иконки — **инлайновые `<svg>`** прямо в шаблонах (никакой icon-библиотеки).
Соц-иконки вынесены в `social-icon.html` (см.
[`homepage-and-about.md`](homepage-and-about.md)).

## Точка входа JS (`static/js/main.js`)
```js
(function (navigation, utils, search) {
  navigation.initTheme();
  utils.updateFooterYear();
  navigation.initToc();          // скроллспай ToC (см. posts.md)
  navigation.initMobileMenu();
  search.init();                 // см. search.md
})(window.Blog.navigation, window.Blog.utils, window.Blog.search);
```
Подключение (в `baseof.html`, все `defer`): `utils` → `navigation` → `search` → `main`.

## Отображение
- **Desktop:** горизонтальное меню + контролы справа.
- **Mobile (`≤767px`):** бургер вместо inline-меню; контролы остаются.

## Интеграция
- Поиск — кнопка `#search-btn` ([search.md](search.md)).
- ToC-скроллспай — тот же модуль `navigation.js` ([posts.md](posts.md)).
- Язык — [`conventions/bilingual-model.md`](../conventions/bilingual-model.md).

## Связанные спецификации
- [`conventions/bilingual-model.md`](../conventions/bilingual-model.md) — меню и язык.
- [`architecture/tech-stack.md`](../architecture/tech-stack.md) — структура JS-модулей.
