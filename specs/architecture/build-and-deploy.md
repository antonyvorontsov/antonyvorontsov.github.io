# Архитектура: сборка и деплой

## Локальная разработка

| Команда        | Что делает                                                           |
|----------------|---------------------------------------------------------------------|
| `hugo server`  | Дев-превью на http://localhost:1313 с live-reload                   |
| `hugo`         | Разовая сборка в `public/` (в `.gitignore`)                         |
| `hugo --gc --minify` | Продакшн-подобная сборка локально (как на CI, но без `--baseURL`) |

`hugo server` также заведён в [`.claude/launch.json`](../../.claude/launch.json) под
именем `hugo-server` — его можно запускать через Preview-инструмент агента.

**Нет lint/test-команд** — это контентный сайт, а не приложение. «Тесты» — это
`hugo server` + визуальная проверка обеих языковых версий (см.
[`guides/checklists.md`](../guides/checklists.md)).

## Обработка домена и `baseURL` — критично

> **Единственное место в репозитории, где может встречаться `vorontsov.dev`, — это
> `static/CNAME`.**

`hugo.toml` **намеренно не содержит `baseURL`**. Причины:

1. **Локальные сборки** (`hugo`, `hugo server`) откатываются на безобидный
   `http://localhost/`-baseURL. Значит, локально собранный `public/index.html`,
   открытый через `file://`, не редиректит на живой прод. До фикса он это делал —
   в сгенерированные redirect/canonical-ссылки был зашит абсолютный
   `https://vorontsov.dev/...`.
2. **CI подставляет реальный URL на сборке** через `actions/configure-pages` +
   флаг `--baseURL` (см. ниже). Домен нигде в репозитории не хардкодится.
3. **`static/CNAME`** (содержит только `vorontsov.dev`) — единственное исключение:
   кастомные домены GitHub Pages требуют этот файл, и это стандартное место для него.

**Не добавляйте домен больше нигде:** не возвращайте `baseURL` в `hugo.toml`, не
хардкодьте его в шаблоне или рукописном redirect. Подробнее о последствиях для
мета-тегов — [`data-model/url-scheme.md`](../data-model/url-scheme.md).

## CI/CD — GitHub Actions

Файл: [`.github/workflows/hugo.yml`](../../.github/workflows/hugo.yml).

### Триггеры
- `push` в ветку **`master`**.
- Ручной `workflow_dispatch`.

> ⚠️ Рабочая ветка — **`blog`**, а деплоится **`master`**. Пуш в `blog` **не**
> триггерит деплой — нужно смёржить в `master`.

### Пайплайн

```
push в master
      │
      ▼
┌─────────────────── job: build ───────────────────┐
│ 1. Install Hugo CLI                                │
│    wget hugo_extended_0.164.0_linux-amd64.deb     │
│    + dpkg -i   (НЕ npm, НЕ кэшируется — намеренно) │
│ 2. actions/checkout@v5 (fetch-depth: 0)           │
│ 3. actions/configure-pages@v6 → base_url          │
│ 4. hugo --gc --minify --baseURL "<base_url>/"     │
│ 5. upload-pages-artifact (./public)               │
└────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────── job: deploy ───────────────┐
│ actions/deploy-pages@v5                    │
└─────────────────────────────────────────────┘
```

Ключевые детали:
- Флаги CI-сборки: `--gc` (сборка мусора), `--minify`, `--baseURL "<pages-url>/"`.
- `HUGO_ENVIRONMENT=production` / `HUGO_ENV=production`.
- Установка Hugo — намеренно простой `wget`+`dpkg`, **без кэширования**: деплои
  редкие, кэш не окупается. Не добавляйте кэш без причины.
- Деплой через официальный флоу `upload-pages-artifact` + `deploy-pages` —
  **нет** ветки `gh-pages`.

### Как обновить версию Hugo
Поменять `HUGO_VERSION` в `env` job'а `build`. Это единственный авторитетный
источник версии (см. [`tech-stack.md`](tech-stack.md)).

## Выходной артефакт (`public/`)

Собранный сайт — плоский набор `.html` (из-за `uglyURLs = true`) с dot-relative
ссылками (из-за `relativeURLs = true`), поэтому его можно открыть через `file://`
без сервера. Что генерируется:
- `index.html`, `about.html`, `posts.html` (ru, корень);
- `en/index.html`, `en/about.html`, `en/posts.html` (en);
- `posts/<slug>.html`, `en/posts/<slug>.html`;
- `tags/<tag>.html`, `en/tags/<tag>.html`;
- `series/<name>.html`, `en/series/<name>.html`;
- `search-index.json` (ru) и `en/search-index.json`;
- `CNAME`, RSS-фиды главных, статика.

## Связанные специфы
- [`data-model/url-scheme.md`](../data-model/url-scheme.md) — почему URL плоские и
  относительные.
- [`decisions/architecture-decisions.md`](../decisions/architecture-decisions.md) —
  решение про домен и `baseURL`.
