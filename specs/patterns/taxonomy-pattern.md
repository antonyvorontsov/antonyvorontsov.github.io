# Паттерн: taxonomy (авто-группировка контента)

## Когда использовать

Когда нужно **автоматически** сгруппировать посты по общему признаку, а страница
группы — это просто список (без собственного рукописного текста). Признак задаётся
списком слагов во frontmatter поста.

**Эталон:** теги ([`components/tags.md`](../components/tags.md)).

**НЕ этот паттерн, если** странице группы нужен собственный заголовок/описание/тело
(рукописная страница) — тогда см.
[`content-section-pattern.md`](content-section-pattern.md) (серии).

| taxonomy-паттерн              | content-section-паттерн         |
|-------------------------------|---------------------------------|
| страница генерится автоматически | страницу пишете вручную        |
| только список постов          | заголовок + описание + список   |
| порядок — по дате             | порядок — задаёте сами          |

## Как реализовать (шаги)

На примере гипотетической таксономии `categories`:

### 1. Объявить таксономию в `hugo.toml`
```toml
[taxonomies]
  tag = "tags"
  category = "categories"      # ← singular = plural (frontmatter-поле)
```

### 2. Ограничить output только HTML
```toml
[outputs]
  term = ["html"]              # уже есть для тегов; покрывает все term-страницы
```
Без этого Hugo сгенерит ненужный RSS-фид на каждый терм.

### 3. Решить про сводную страницу «все категории»
```toml
disableKinds = ["taxonomy"]   # если сводная страница НЕ нужна (как у тегов)
```
Если сводная нужна — не отключать `taxonomy` и добавить `layouts/<name>/taxonomy.html`.
В этом проекте сводных страниц нет сознательно.

### 4. Шаблон term-страницы
`layouts/<name>/term.html` (для тегов — `layouts/tags/term.html`). Минимум:
```go-html-template
{{ define "main" }}
<header class="profile-header"><h1 class="profile-name">#{{ .Data.Term }}</h1></header>
<div class="archive-list">
  {{ range .Pages.ByDate.Reverse }}
  {{ partial "archive-item.html" (dict "page" .) }}
  {{ end }}
</div>
{{ end }}
```
Переиспользуйте общий `archive-item.html` (см.
[`shared-partial-pattern.md`](shared-partial-pattern.md)).

### 5. `<head>` для term-страниц
У term-страницы нет frontmatter — спец-кейсите в `head.html` (образец — блок
`{{ if eq .Kind "term" }}` для тегов), добавив i18n-описание.

### 6. Подсветка навигации
Если term-страница — «вид на посты», в `header.html` добавьте:
```go-html-template
{{ if eq .Kind "term" }}{{ $currentSection = "posts" }}{{ end }}
```
(уже есть; покрывает все term-виды).

### 7. i18n
Ключ описания для `<head>` (аналог `tagPageDescription`) — в **оба** `i18n/*.toml`.
См. [`i18n-string-pattern.md`](i18n-string-pattern.md).

### 8. Frontmatter постов
Добавьте поле в посты: `categories: [foo, bar]`. Слаги — ASCII, не переводятся,
одинаковые в ru/en.

## Двуязычность
Taxonomy в Hugo **per-language автоматически** — term-страница показывает только
посты своего языка. URL: ru без префикса (`/categories/foo.html`), en с префиксом
(`/en/categories/foo.html`).

## Чек-лист
- [ ] `[taxonomies]` в `hugo.toml`
- [ ] `[outputs] term = ["html"]`
- [ ] решение по `disableKinds`
- [ ] `layouts/<name>/term.html`
- [ ] спец-кейс в `head.html` (title/description)
- [ ] i18n-ключ описания в оба TOML
- [ ] проверка ru + en в `hugo server`

## Связанные спецификации
- [`components/tags.md`](../components/tags.md) — эталонная реализация.
- [`content-section-pattern.md`](content-section-pattern.md) — альтернатива.
