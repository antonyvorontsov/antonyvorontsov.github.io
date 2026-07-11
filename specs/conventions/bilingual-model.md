# Соглашения: двуязычная модель (ru/en)

Двуязычность пронизывает весь проект. Без понимания этой модели нельзя трогать ни
контент, ни шаблоны. Это самый важный документ в `conventions/`.

## Базовый принцип

Сайт использует **встроенный многоязычный режим Hugo**. Русский — **язык по
умолчанию, без префикса** (`/`, `/about.html`, `/posts/<slug>.html`); английский —
**с префиксом** (`/en/`, `/en/about.html`, `/en/posts/<slug>.html`).

Это было осознанное решение: сначала пробовали оба языка с префиксом (`/ru/...` /
`/en/...`), но для основной (русскоязычной) аудитории это оказалось хуже по UX, а
переход на «дефолтный язык без префикса» заодно обходит реальный дефект Hugo (см.
[`data-model/url-scheme.md`](../data-model/url-scheme.md) и
[`decisions/architecture-decisions.md`](../decisions/architecture-decisions.md)).

**Клиентского языкового состояния нет вообще.** Переключатель языка — реальная
ссылка на переведённую страницу, а не JS-тоггл видимости. Это заменило раннюю
кастомную схему с маркерами `|||` (её можно найти в git-истории до ветки
`feature/hugo-native-i18n-migration`).

## Три уровня, где живёт двуязычность

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. КОНТЕНТ         content/foo.ru.md   +   content/foo.en.md      │
│    (по файлу       └── парятся по базовому имени "foo"            │
│     на язык)                                                       │
├─────────────────────────────────────────────────────────────────┤
│ 2. UI-СТРОКИ       i18n/ru.toml   +   i18n/en.toml                │
│    (интерфейс)     {{ i18n "ключ" }}  в шаблонах                  │
├─────────────────────────────────────────────────────────────────┤
│ 3. КОНФИГ ЯЗЫКА    [languages.ru] / [languages.en] в hugo.toml    │
│    + МЕНЮ          config/_default/menus.ru.toml / menus.en.toml  │
└─────────────────────────────────────────────────────────────────┘
```

### Уровень 1 — контент: один файл на язык

`content/posts/<slug>.ru.md` / `content/posts/<slug>.en.md`. Hugo сопоставляет
переводы **автоматически по совпадающему базовому имени** — `translationKey` не
нужен. Каждый файл — самодостаточный одноязычный Markdown; никакого маркер-синтаксиса.

Пост может иметь **только один язык** — просто не создавайте второй файл. Тогда:
- на другом языке страницы не существует (нет в списке, архиве, RSS, sitemap);
- переключатель языка через `.IsTranslated` уходит на главную того языка, а не в 404.

Подробнее — [`data-model/content-organization.md`](../data-model/content-organization.md)
и [`guides/add-new-post.md`](../guides/add-new-post.md).

### Уровень 2 — UI-строки: `i18n/`

Все строки интерфейса (aria-labels, тексты кнопок, заголовки секций, копирайт)
вынесены в `i18n/ru.toml` и `i18n/en.toml`, вызываются через `{{ i18n "ключ" }}`.

```toml
# i18n/ru.toml                         # i18n/en.toml
[latestPostsTitle]                     [latestPostsTitle]
other = "Последние посты"              other = "Latest Posts"
```

С аргументами — через `(dict ...)`:

```go-html-template
{{ i18n "postSeriesMeta" (dict "Name" $seriesTitle "Number" $seriesNumber) }}
{{ i18n "footerCopyright" (dict "Year" "2026" "Name" .Site.Params.profileName) }}
```

```toml
[postSeriesMeta]
other = "Серия постов «{{ .Name }}» №{{ .Number }}"
```

**Правило:** любая новая хардкод-строка в шаблоне идёт через i18n. Ключ добавляется
в **оба** TOML-файла. Как это делать — [`patterns/i18n-string-pattern.md`](../patterns/i18n-string-pattern.md).

### Уровень 3 — конфиг языка и меню

В `hugo.toml`:
```toml
defaultContentLanguage = "ru"
defaultContentLanguageInSubdir = false

[languages.ru]
  label = "Русский"
  locale = "ru"
  weight = 1
  title = "Антон Воронцов — Software Engineering Blog"
  [languages.ru.params]
    profileName = "Антон Воронцов"
    shortLabel = "Ru"
    bio = [ "…", "…" ]
[languages.en]
  # то же для en, weight = 2
```

- **Параметры, различающиеся по языкам** (`title`, `profileName`, `shortLabel`,
  `bio`), — в блоках `[languages.<lang>.params]`.
- **Параметры, общие для обоих языков** (`profileTitle`), — в верхнеуровневом
  `[params]`.

**Меню** разбито по языкам: `config/_default/menus.ru.toml` / `menus.en.toml` —
записи `[[main]]` с `name`, `pageRef`, `weight`. Рендерит `header.html` через
`.Site.Menus.main`.

## Переключатель языка — реальная ссылка

`layouts/partials/header.html` строит ссылку на **фактическую переведённую страницу**:

```go-html-template
{{ if .IsTranslated }}
  {{ with .Translations }}
    {{ $t := index . 0 }}
    {{ $langURL = $t.RelPermalink }}          {{/* прямая ссылка на перевод */}}
    {{ $otherLangName = $t.Language.Params.shortLabel }}
  {{ end }}
{{ else }}
  {{ range hugo.Sites }}                        {{/* нет перевода → главная др. языка */}}
    {{ if ne .Language.Lang $.Language.Lang }}
      {{ $langURL = .Home.RelPermalink }}
    {{ end }}
  {{ end }}
{{ end }}
```

Логика: есть перевод — ведём прямо на него; нет — на главную другого языка (не в 404).

## Что переводится, а что нет — сводка

| Сущность                          | Переводится?              | Где                                    |
|-----------------------------------|---------------------------|----------------------------------------|
| Тело поста, `title`, `description`| да (отдельный файл)        | `content/*.{ru,en}.md`                 |
| UI-строки                         | да                        | `i18n/{ru,en}.toml`                    |
| Пункты меню                       | да                        | `config/_default/menus.{ru,en}.toml`   |
| `bio`, `title` сайта, `profileName`| да                       | `[languages.<lang>.params]`            |
| `profileTitle`                    | нет (общий)                | `[params]`                             |
| `tags` (слаги)                    | **нет** (англ. слаги)      | frontmatter поста                      |
| `series.name`                     | **нет** (id)               | frontmatter поста                      |
| `company` в `experience`          | **нет** (общий)            | `about.*.md`                           |
| `skills`, `social`                | **нет** (термины/URL)      | `about.*.md` (дублируются дословно)    |
| Якоря заголовков                  | не обязаны совпадать        | тело поста                             |
| Тема (dark/light)                 | **нет** (пер-визитор, не пер-язык) | `data-theme` + `navigation.js`  |

## Тема — не про язык

Переключатель темы client-driven (dark/light — предпочтение посетителя, не языка).
Две подписи рендерятся server-side в `data-dark-label`/`data-light-label`, а
`navigation.js` просто свапает их. Модуль **не знает** текущий язык. См.
[`components/navigation-and-theme.md`](../components/navigation-and-theme.md).

## Чек-лист двуязычности при изменениях
- Тронул контент → есть ли парный языковой файл? Совпадает ли базовое имя?
- Добавил строку в шаблон → завёл ключ в **оба** `i18n/*.toml`?
- Добавил пункт меню → добавил в **оба** `menus.*.toml`?
- Проверил обе версии в `hugo server` (ru на `/`, en на `/en/`)?

Полный чек-лист — [`guides/checklists.md`](../guides/checklists.md).

## Связанные специфы
- [`data-model/url-scheme.md`](../data-model/url-scheme.md) — как язык влияет на URL.
- [`patterns/i18n-string-pattern.md`](../patterns/i18n-string-pattern.md) — паттерн
  добавления строки.
- [`decisions/architecture-decisions.md`](../decisions/architecture-decisions.md) —
  почему русский без префикса.
