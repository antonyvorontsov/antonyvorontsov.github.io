# Паттерн: content section (раздел с рукописными страницами)

## Когда использовать

Когда нужен раздел, где **каждая страница пишется вручную** и имеет собственный
заголовок, описание и (опц.) тело — и при этом перечисляет связанные посты. Пост
опционально «привязывается» к такой странице через объект во frontmatter.

**Эталон:** серии постов ([`components/series.md`](../components/series.md)).

**НЕ этот паттерн, если** страница группы — чистый авто-список без своего текста →
[`taxonomy-pattern.md`](taxonomy-pattern.md) (теги).

## Как реализовать (шаги)

На примере серий (`content/series/`):

### 1. Создать раздел контента
Папка `content/<section>/`. Страницы — **суффикс-конвенция файлов на язык**, НЕ
подпапка на язык:
```
content/<section>/<name>.ru.md
content/<section>/<name>.en.md
```
> ⚠️ `content/<section>/en/<name>.md` **не** распознается как перевод — на сайте нет
> per-language `contentDir`, переводы парятся по базовому имени.

### 2. Frontmatter рукописной страницы
```yaml
---
title: "Заголовок раздела-хаба"
description: "Описание — идёт в мета-тег И в поиск (обязательно!)"
url: /<section>/<name>.html      # ru; en-файл: /en/<section>/<name>.html
outputs: [html]                  # гасит RSS-фид раздела (иначе уводит URL)
---

Опциональное тело.
```
- **id страницы = базовое имя файла** (`.File.ContentBaseName`) — отдельного поля id
  не заводите.
- `description` обязателен (страница попадёт в поиск).
- `url:` + `outputs: [html]` — обязательны (см.
  [`data-model/url-scheme.md`](../data-model/url-scheme.md#почему-нужны-явные-url-и-outputs)).

### 3. Погасить авто-страницу «список раздела»
`content/<section>/_index.ru.md` и `_index.en.md`:
```yaml
---
build:
  list: false
  render: false
---
```
(Если сводная страница-список раздела вам НУЖНА — не создавайте эти файлы и добавьте
`layouts/<section>/list.html`.)

### 4. Шаблон рукописной страницы
`layouts/<section>/single.html`. Образец (серии):
```go-html-template
{{ define "main" }}
{{ $id := .File.ContentBaseName }}
{{ $posts := where (where .Site.RegularPages "Section" "posts") "Params.<section>.name" $id }}
{{ $posts = sort $posts "Params.<section>.number" "asc" }}
{{/* build-time проверка уникальности number → errorf */}}
<header class="profile-header"><h1 class="profile-name">{{ .Title }}</h1></header>
{{ with .Content }}<div class="post-content">{{ . }}</div>{{ end }}
<div class="archive-list">
  {{ range $posts }}{{ partial "archive-item.html" (dict "page" . …) }}{{ end }}
</div>
{{ end }}
```

### 5. Опт-ин постов
Объект во frontmatter поста:
```yaml
<section>:
  name: "<name>"    # = id страницы раздела, НЕ переводится
  number: 2         # порядок, уникальный в рамках раздела
```

### 6. Рендер привязки в посте (`posts/single.html`)
Резолвьте страницу раздела через `.Site.GetPage (printf "<section>/%s" $id)` **с
fallback**, если вернулся `nil` (страницы ещё нет):
- текст ссылки → сырой id;
- href → `.RelPermalink` самого поста (self-link, не битая).

Серии рендерятся в трёх местах (шапка/сайдбар-desktop/моб.) — см.
[`components/series.md`](../components/series.md#пост-в-серии-три-места-рендеринга-postssinglehtml).

### 7. Валидация build-time
Тот же приём `errorf`, что для дубликатов якорей:
- объект без `name`/`number` → `errorf`;
- дубликат `number` → `errorf`;
- `name` без страницы → `warnf` + fallback.

### 8. i18n и поиск
- Все подписи привязки — через i18n в оба TOML.
- Добавьте раздел в `layouts/index.searchindex.json`:
  `range where .Site.RegularPages "Section" "<section>"`.

## Двуязычность
`.Site.RegularPages` per-language автоматически. URL — ru без префикса, en с `/en/`
(вручную в `url:`).

## Чек-лист
- [ ] `content/<section>/<name>.{ru,en}.md` с `url` + `outputs: [html]` + `description`
- [ ] `content/<section>/_index.{ru,en}.md` с `build: {list:false, render:false}`
- [ ] `layouts/<section>/single.html` + проверки `errorf`
- [ ] опт-ин объект во frontmatter постов
- [ ] рендер привязки в `posts/single.html` с fallback
- [ ] i18n-ключи в оба TOML
- [ ] раздел в `index.searchindex.json`
- [ ] проверка ru + en

## Связанные спецификации
- [`components/series.md`](../components/series.md) — эталонная реализация.
- [`taxonomy-pattern.md`](taxonomy-pattern.md) — альтернатива.
