# Данные: справочник по frontmatter

Frontmatter — YAML-блок между `---` в начале файла. Схема **зависит от типа
страницы** и **одноязычна** (никаких `_en`-парных полей — каждый языковой файл
самодостаточен). Ниже — все типы.

---

## Пост

`content/posts/<slug>.{ru,en}.md`

```yaml
---
title: 'CQRS на практике: когда усложнение оправдано'   # строка, этот язык
date: 2025-08-02                                          # YYYY-MM-DD, ОДИНАКОВАЯ на ru/en
description: 'Разбираю реальные кейсы применения CQRS…'   # строка, этот язык
tags: [cqrs, distributed-systems, patterns]              # []string, англ. слаги, НЕ переводятся
series:                                                   # опционально, объект
  name: "distributed-systems"                            # id серии (= имя файла серии), НЕ переводится
  number: 2                                              # позиция в серии, 1-based, уникальна в серии
cover:                                                    # опционально, объект
  src: "assets/images/posts/cqrs-na-praktike/cover.jpg"  # без ведущего /, рендерится через relURL, НЕ переводится
  alt: "Схема потоков команд и запросов в CQRS"          # переводится, как title/description
enableComments: false                                     # опционально, bool, по умолчанию true
---
```

| Поле          | Тип      | Обяз. | Примечание                                                        |
|---------------|----------|-------|-------------------------------------------------------------------|
| `title`       | string   | да    | Заголовок на языке файла.                                         |
| `date`        | date     | да    | `YYYY-MM-DD`. **Одинаковая** на обоих языковых файлах.            |
| `description` | string   | да    | 1–2 предложения. Идёт в карточку, мета-тег `description`, поиск.  |
| `tags`        | []string | да    | Английские kebab-case слаги. **Одинаковые** в ru/en. Может быть `[]`. |
| `series`      | object   | нет   | `{name, number}`. `name` не переводится. См. [`components/series.md`](../components/series.md). |
| `cover`       | object   | нет   | `{src, alt}`. Обложка на странице поста — единственное место, где показывается изображение поста вне его тела (карточки на главной картинок не показывают). `src` не переводится (путь без ведущего `/`, идёт через `relURL`), `alt` переводится. См. [`components/posts.md`](../components/posts.md). |
| `enableComments` | bool | нет   | По умолчанию `true` (комментарии включены). `false` отключает Giscus на этой конкретной странице. См. [`components/comments.md`](../components/comments.md). |

- `og_description` у поста **не бывает** (только у трёх корневых страниц).
- Про формат тегов и якорей — [`conventions/naming.md`](../conventions/naming.md).
- `cover` валидируется через `partials/assert-image-field.html`
  (`isset` + `errorf`) — если объект указан, оба подполя (`src`, `alt`) обязательны.
- **Держите `cover` разумного размера.** Ресайза на сборке нет (ADR-5) — файл
  идёт в HTML как есть, только сжатый CSS-ом под размер блока `.post-cover`.
- **Инлайн-картинки в теле поста** — обычный Markdown `![alt](path)`, отдельного поля
  frontmatter не требуют. Путь для них — **с ведущим `/`**
  (`/assets/images/posts/<slug>/name.jpg`), в отличие от `cover.src`
  (без ведущего `/`). Причина асимметрии: `cover.src` — значение,
  которое шаблон явно прогоняет через `relURL`; путь в Markdown — авторский текст,
  который полагается на глобальный Hugo-постпроцессинг `relativeURLs = true`,
  переписывающий абсолютные пути в финальном HTML.
- **Картинок в карточках на главной нет** — `cover` показывается только на
  странице самого поста. См. [`components/homepage-and-about.md`](../components/homepage-and-about.md).

---

## Главная

`content/_index.{ru,en}.md` — только frontmatter, тело рендерит `layouts/index.html`.

```yaml
---
title: Антон Воронцов — Software Engineering Blog
description: Личный блог Антона Воронцова о разработке распределённых систем…
og_description: Разработка распределённых систем на .NET…
og_type: website
outputs: ["html", "rss", "searchindex"]   # ВАЖНО: searchindex генерит search-index.json
---
```

| Поле             | Примечание                                                              |
|------------------|-------------------------------------------------------------------------|
| `og_description` | Только у корневых страниц. Fallback для `og:description` — `description`. |
| `og_type`        | `website`. Идёт в мета-тег `og:type`.                                    |
| `outputs`        | Обязательно включает `searchindex` — иначе не сгенерится поисковый индекс. |

---

## «Обо мне»

`content/about.{ru,en}.md` — frontmatter как **структурированные данные**, рендер —
`layouts/about.html` (через `layout: about`).

```yaml
---
title: Обо мне — Антон Воронцов
description: Антон Воронцов — Senior .NET Engineer & Tech Lead…
og_description: Опыт работы, выступления на конференциях…
og_type: profile
layout: about                    # маршрутизирует на layouts/about.html
social:                          # список; НЕ переводится (URL и названия)
- name: LinkedIn
  url: https://www.linkedin.com/in/anton-vorontsov/
  icon: linkedin                 # ключ для partial social-icon.html: linkedin|github|getmentor|telegram
experience:                      # список; ПЕРЕВОДИТСЯ (role/date/desc), кроме company
- role: Software Engineering Manager / Tech Lead
  date: 2019 — настоящее время
  desc: Руковожу разработкой…    # можно <strong> (рендерится через safeHTML)
  company: Ozon Tech             # общий, НЕ переводится
speaking:                        # список; ПЕРЕВОДИТСЯ (role/date/desc), БЕЗ company
- role: Спикер на DotNext 2025
  date: '2025'
  desc: Выступил с докладом <strong>«Шардирование…»</strong>…
skills:                          # список категорий; НЕ переводится (техн. термины)
- category: Languages & Core
  tags: [C#, Python, SQL]
---
```

| Поле         | Переводится? | Рендерит                                                    |
|--------------|--------------|------------------------------------------------------------|
| `social`     | нет          | `profile-header.html` → `btn-social` + `social-icon.html`   |
| `experience` | да (кроме `company`) | `timeline-item.html` с `showCompany=true`          |
| `speaking`   | да           | `timeline-item.html` с `showCompany=false`                  |
| `skills`     | нет          | `.skill-tag` (`tag-pill`) по категориям                      |

Наличие блока аватар+соцсети в `profile-header.html` определяется **наличием поля
`social`**, а не отдельным флагом. См.
[`components/homepage-and-about.md`](../components/homepage-and-about.md).

---

## Разводящая страница архива постов

`content/posts/_index.{ru,en}.md`

```yaml
---
title: Архив постов — Антон Воронцов
description: Все посты блога, сгруппированные по годам публикации.
og_description: Все посты блога, сгруппированные по годам публикации.
og_type: website
url: /posts.html        # ru; en-файл: /en/posts.html
outputs:
- html                  # ОБЯЗАТЕЛЬНО: иначе RSS-фид раздела перехватит этот URL
---
```

Про то, зачем нужны `url:` и `outputs: [html]`, — см.
[`url-scheme.md`](url-scheme.md#почему-нужны-явные-url-и-outputs).

---

## Разводящая страница серии

`content/series/<name>.{ru,en}.md`

```yaml
---
title: "Распределённые системы"
description: "Серия постов о паттернах…"   # зеркалит абзац тела; идёт в мета + поиск
url: /series/distributed-systems.html      # ru; en-файл: /en/series/…
outputs: [html]                            # та же причина, что и у архива
enableComments: false                      # опционально, bool, по умолчанию true
---

Серия постов о паттернах и практических решениях…   # опциональное тело-абзац
```

- **Нет поля `id`** — id серии берётся из базового имени файла (`.File.ContentBaseName`),
  напр. `distributed-systems`.
- `description:` обязателен, иначе результат в поиске будет без описания.
- Тело опционально (`{{ with .Content }}` в шаблоне).
- `enableComments: false` отключает Giscus на этой странице серии — см.
  [`components/comments.md`](../components/comments.md).

Служебные `content/series/_index.{ru,en}.md` содержат только
`build: {list: false, render: false}` — см.
[`content-organization.md`](content-organization.md#служебные-файлы-series_indexmd).

---

## Сводная таблица: у кого какие поля

| Поле             | Пост | Главная | Обо мне | Архив | Серия |
|------------------|:----:|:-------:|:-------:|:-----:|:-----:|
| `title`          | ✅   | ✅      | ✅      | ✅    | ✅    |
| `date`           | ✅   | —       | —       | —     | —     |
| `description`    | ✅   | ✅      | ✅      | ✅    | ✅    |
| `tags`           | ✅   | —       | —       | —     | —     |
| `series`         | опц. | —       | —       | —     | —     |
| `cover`          | опц. | —       | —       | —     | —     |
| `enableComments` | опц. | —       | —       | —     | опц.  |
| `og_description` | —    | ✅      | ✅      | ✅    | —     |
| `og_type`        | —    | ✅      | ✅      | ✅    | —     |
| `url`            | —    | —       | —       | ✅    | ✅    |
| `outputs`        | —    | ✅*     | —       | ✅    | ✅    |
| `layout`         | —    | —       | ✅      | —     | —     |
| данные-списки    | —    | —       | ✅      | —     | —     |

\* у главной `outputs` включает `searchindex`; у архива/серии — только для гашения RSS.

## Связанные спецификации
- [`content-organization.md`](content-organization.md) — где лежат файлы.
- [`conventions/naming.md`](../conventions/naming.md) — правила значений (слаги, якоря).
- [`components/`](../components/) — как каждое поле рендерится.
