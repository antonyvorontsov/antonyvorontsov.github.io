# Компонент: серии постов

## Что и зачем

Серия — упорядоченная подборка постов на одну сквозную тему (напр. «Распределённые
системы»). У серии есть своя разводящая страница с заголовком, описанием и списком
входящих постов по порядку. Пост, входящий в серию, показывает метку «Серия постов
«…» №N» со ссылкой на разводящую страницу.

## Серии ≠ теги — ключевое различие

| Аспект              | Теги ([tags.md](tags.md))        | Серии (этот файл)                    |
|---------------------|----------------------------------|--------------------------------------|
| Механизм Hugo       | taxonomy (авто term-страницы)    | content section (рукописные страницы) |
| Страница создаётся  | автоматически из frontmatter     | вручную: `content/series/<name>.*.md` |
| У страницы есть…    | только список                    | заголовок + описание + (опц.) тело + список |
| Порядок постов      | по дате                          | по `series.number` (задаётся вручную) |
| Аналогия            | как авто-архив                   | как `about.md` — рукописная страница |

Серия — как `about.md` (рукописная страница со своим смыслом), а не как авто-тег.

## Как устроено

### Разводящая страница серии
`content/series/<name>.{ru,en}.md` — **обычная суффикс-конвенция файлов, НЕ
подпапка на язык** (`content/series/en/<name>.md` **не** распознается как перевод,
т.к. на сайте нет per-language `contentDir` — переводы парятся только по базовому
имени).

```yaml
---
title: "Распределённые системы"
description: "Серия постов о паттернах…"   # зеркалит абзац тела; идёт в мета + поиск
url: /series/distributed-systems.html      # ru; en: /en/series/…
outputs: [html]                            # гасит RSS (как у архива постов)
---

Серия постов о паттернах…                  # опциональное тело
```

- **id серии = базовое имя файла** (`.File.ContentBaseName` = `distributed-systems`).
  Отдельного поля `id` нет.
- `description:` обязателен, иначе в поиске серия будет без описания.
- `url:` + `outputs: [html]` — по той же причине, что у `posts/_index.*.md`
  (RSS-фид иначе уводит URL). См.
  [`data-model/url-scheme.md`](../data-model/url-scheme.md#почему-нужны-явные-url-и-outputs).

### Служебные `content/series/_index.{ru,en}.md`
```yaml
build:
  list: false
  render: false
```
Гасят авто-страницу `/series.html` («все серии») — зеркально отсутствию «все теги».
**Не удалять.**

### Опт-ин поста
Пост входит в серию через опциональный объект во frontmatter:
```yaml
series:
  name: "distributed-systems"   # = id страницы серии, НЕ переводится
  number: 2                     # 1-based позиция, уникальна в серии
```

## Шаблон разводящей страницы (`layouts/series/single.html`)

```go-html-template
{{ $seriesID := .File.ContentBaseName }}
{{ $seriesPosts := where (where .Site.RegularPages "Section" "posts") "Params.series.name" $seriesID }}
{{ $seriesPosts = sort $seriesPosts "Params.series.number" "asc" }}

{{/* проверка уникальности series.number → errorf при дубликате */}}

<header class="profile-header"><h1 class="profile-name">{{ .Title }}</h1></header>
{{ with .Content }}<div class="post-content">{{ . }}</div>{{ end }}
<div class="archive-list">
  {{ range $seriesPosts }}
  {{ partial "archive-item.html" (dict "page" . "linkText" (printf "%s %s" (i18n "seriesItemNumber" (dict "Number" .Params.series.number)) .Title) "hideDate" true) }}
  {{ end }}
</div>
```

- Посты серии = `.Site.RegularPages` секции `posts`, отфильтрованные по
  `Params.series.name`, отсортированные по `series.number`. Per-language автоматически
  (`.Site.RegularPages` — в рамках текущего языка).
- Ряд — общий `archive-item.html`, но с `linkText` = «№2. Заголовок» (номер вшит в
  текст ссылки через i18n `seriesItemNumber`) и `hideDate: true` (даты не показываем).
- Тело серии опционально (`{{ with .Content }}`).

## Пост в серии: три места рендеринга (`posts/single.html`)

Все три резолвят страницу серии через `.Site.GetPage (printf "series/%s" $seriesID)`
с одинаковым fallback, если страницы серии ещё нет (`nil`):
- текст ссылки → падает на сырой id серии;
- href ссылки → падает на `.RelPermalink` самого поста (self-link, не битая).

| # | Место                       | CSS-класс             | i18n-ключ         | Виден         |
|---|-----------------------------|-----------------------|-------------------|---------------|
| 1 | под `.post-meta` в шапке     | `.post-series-link`   | `postSeriesMeta`  | всегда        |
| 2 | блок в `.toc-sidebar`        | `.toc-series`         | `seriesTitle`     | desktop only  |
| 3 | после `.post-content`        | `.post-series-mobile` | `seriesMobileText`| mobile only (`≤767px`) |

- (1) «Серия постов «<name>» №<n>» — с номером.
- (2) только заголовок серии (номер уже в (1)); скрыт на мобиле вместе со всем
  сайдбаром (`.toc-sidebar { display: none }`).
- (3) зеркало (2) для мобилы: одна кликабельная фраза целиком через `seriesMobileText`
  («Эта статья — часть серии «<name>».») — так избегается `<a>` посреди перевода,
  где порядок слов ru/en различается. Центрирована, симметричные отступы.

## Валидация (build-time)
- `series` без `name`/`number` → ⛔ `errorf` (`posts/single.html`).
- Дубликат `series.number` в серии → ⛔ `errorf` (`series/single.html`).
- `series.name` без страницы серии → ⚠️ `warnf` + fallback (не ломает build).

## Поиск
Страницы серий включены в `search-index.json` тем же паттерном
`where .Site.RegularPages "Section" "series"`, что и посты. Поэтому у серии
обязателен `description:`. См. [`search.md`](search.md).

## Отображение
- **Desktop:** метки (1) в шапке и (2) в сайдбаре. Разводящая страница — заголовок +
  описание + список «№N. Заголовок».
- **Mobile:** метка (1) в шапке и (3) под контентом; сайдбар (2) скрыт.

## Паттерн
Серии — эталон **content-section-паттерна** (раздел с рукописными страницами). Как
повторить — [`patterns/content-section-pattern.md`](../patterns/content-section-pattern.md).

## Автоматизация
Добавление поста в серию автоматизировано скиллом `add-post-to-series` (через
субагента `series-editor`). См. [`guides/add-new-feature.md`](../guides/add-new-feature.md).

## Связанные специфы
- [`components/posts.md`](posts.md) — три места рендеринга в контексте страницы поста.
- [`patterns/content-section-pattern.md`](../patterns/content-section-pattern.md).
- [`conventions/naming.md`](../conventions/naming.md#id-серий-) — id и номера.
