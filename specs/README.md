# Specs — единый источник истины по блогу

Это набор спецификаций (specs) для персонального двуязычного (ru/en) блога
Антона Воронцова на Hugo. Специфы описывают **то, как проект устроен сейчас** —
не идеальное состояние, а фактическую реализацию. Цель: чтобы новый разработчик
или AI-агент мог разобраться в проекте и сделать новую фичу, опираясь только на
эти документы.

> Специфы — **зеркало кода**, а не ТЗ. Если код и специфа расходятся — прав код,
> а специфу нужно поправить. При изменении поведения проекта соответствующую
> специфу обновляют в том же изменении.

## С чего начать

1. Прочитайте [`architecture/overview.md`](architecture/overview.md) — общая картина
   системы и как данные текут от Markdown-файла к HTML-странице.
2. Прочитайте [`conventions/bilingual-model.md`](conventions/bilingual-model.md) —
   двуязычность пронизывает весь проект, без неё ничего не понятно.
3. Дальше — по задаче: нужный компонент из [`components/`](components/) или готовое
   руководство из [`guides/`](guides/).

## Карта документа

### `architecture/` — архитектура и обзор
- [`overview.md`](architecture/overview.md) — что это за система, из чего состоит,
  как движутся данные, ключевые ограничения.
- [`tech-stack.md`](architecture/tech-stack.md) — версии, стек, что **нельзя**
  добавлять в проект.
- [`build-and-deploy.md`](architecture/build-and-deploy.md) — CI, GitHub Pages,
  домен, обработка `baseURL`.

### `data-model/` — структуры данных
- [`content-organization.md`](data-model/content-organization.md) — как организована
  папка `content/`.
- [`frontmatter-reference.md`](data-model/frontmatter-reference.md) — все поля
  frontmatter по типам страниц.
- [`url-scheme.md`](data-model/url-scheme.md) — как формируются URL (`uglyURLs`,
  `relativeURLs`, префиксы языков).

### `conventions/` — соглашения
- [`naming.md`](conventions/naming.md) — имена файлов, слаги, якоря заголовков,
  теги, id серий.
- [`bilingual-model.md`](conventions/bilingual-model.md) — двуязычность на файловом
  уровне + UI-строки (`i18n/`).

### `components/` — реализованные функции
- [`README.md`](components/README.md) — карта «фича → шаблоны/файлы».
- [`posts.md`](components/posts.md) — посты, страница поста, ToC-сайдбар.
- [`tags.md`](components/tags.md) — теги (taxonomy).
- [`series.md`](components/series.md) — серии постов (content section).
- [`search.md`](components/search.md) — клиентский поиск.
- [`navigation-and-theme.md`](components/navigation-and-theme.md) — шапка, бургер-меню,
  тема, переключатель языка, футер.
- [`homepage-and-about.md`](components/homepage-and-about.md) — главная, «Обо мне»,
  архив постов.

### `patterns/` — повторяющиеся паттерны
- [`taxonomy-pattern.md`](patterns/taxonomy-pattern.md) — как добавить taxonomy
  (на примере тегов).
- [`content-section-pattern.md`](patterns/content-section-pattern.md) — как добавить
  раздел с рукописными страницами (на примере серий).
- [`i18n-string-pattern.md`](patterns/i18n-string-pattern.md) — как добавить
  UI-строку.
- [`shared-partial-pattern.md`](patterns/shared-partial-pattern.md) — как выносить
  переиспользуемую разметку в partial.

### `decisions/` — архитектурные решения
- [`architecture-decisions.md`](decisions/architecture-decisions.md) — почему
  двуязычность/URL/стек сделаны именно так (ADR-стиль).

### `guides/` — руководства и чек-листы
- [`add-new-post.md`](guides/add-new-post.md) — добавить пост.
- [`add-new-feature.md`](guides/add-new-feature.md) — добавить новую фичу.
- [`checklists.md`](guides/checklists.md) — чек-листы (двуязычность, поиск, тесты).

### Прочее
- [`FUTURE_IMPROVEMENTS.md`](FUTURE_IMPROVEMENTS.md) — идеи на будущее (вторично).

## Связь с другими документами репозитория

Эти специфы не заменяют, а дополняют существующие файлы:
- **`CLAUDE.md`** (корень) — операционные инструкции для агента, максимально плотные.
  Специфы разворачивают их в структурированную документацию с примерами.
- **`ROADMAP.md`** (корень) — что сделано / что запланировано.
- **`.claude/skills/`** — автоматизированные скиллы (`validate-blog-post`,
  `add-post-to-series`), вызываются через субагентов.
