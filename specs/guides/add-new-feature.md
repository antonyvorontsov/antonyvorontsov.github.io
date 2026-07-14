# Руководство: добавить новую фичу

Как подступиться к новой функции, чтобы она вписалась в архитектуру проекта, а не
сломала её. Начните с определения, к какому **паттерну** сводится задача.

## Шаг 0. Проверьте ограничения

Прежде всего — фича **не должна** тянуть запрещённое (JS/CSS-фреймворк, npm, Hugo
Pipes, стороннюю библиотеку). См.
[`architecture/tech-stack.md`](../architecture/tech-stack.md) и ADR-5. Если кажется,
что без библиотеки никак — почти наверняка есть ванильный путь (как поиск без lunr.js).

## Шаг 1. Определите паттерн

```
Нужна группировка постов по признаку?
├── страница группы = просто авто-список (порядок по дате)
│      → TAXONOMY-паттерн   → patterns/taxonomy-pattern.md   (эталон: теги)
└── страница группы = рукописный текст + ручной порядок
       → CONTENT-SECTION-паттерн → patterns/content-section-pattern.md (эталон: серии)

Нужна повторяемая разметка в нескольких местах?
   → SHARED-PARTIAL-паттерн → patterns/shared-partial-pattern.md

Нужна новая UI-строка?
   → I18N-паттерн → patterns/i18n-string-pattern.md

Нужна клиентская интерактивность?
   → новый модуль в static/js/modules/ (window.Blog.*), init в main.js
   → БЕЗ библиотек, ванильный JS (эталон: search.js)

Нужен новый тип страницы (свой <head>/контейнер)?
   → расширить $isPostSingle-развилку в baseof.html/head.html
```

## Шаг 2. Пройдите чек-лист двуязычности

Любая фича должна работать на **обоих** языках:
- Контент → парные файлы `*.ru.md`/`*.en.md` или per-language автоматика Hugo.
- UI-строки → ключи в **оба** `i18n/*.toml`.
- URL → ru без префикса, en с `/en/` (для ручных `url:` — прописать префикс).
- Проверить ru (на `/`) и en (на `/en/`) в `hugo server`.

См. [`conventions/bilingual-model.md`](../conventions/bilingual-model.md).

## Шаг 3. Соблюдите URL-правила

- Обычные страницы — `url:` не нужен (авто из `uglyURLs` + язык).
- Разводящие страницы разделов — **нужны** `url:` + `outputs: [html]` (RSS иначе
  уводит URL). См.
  [`data-model/url-scheme.md`](../data-model/url-scheme.md#почему-нужны-явные-url-и-outputs).

## Шаг 4. Добавьте build-time валидацию (если есть инварианты)

Если у фичи есть правила («номер уникален», «поле обязательно») — проверяйте их в
шаблоне через `errorf`/`warnf` (ADR-8). Дешевле любых тестов, ловит ошибку на сборке.

## Шаг 5. Интегрируйте с поиском (если это контент)

Новый тип контентных страниц добавьте в `layouts/index.searchindex.json`:
`range where .Site.RegularPages "Section" "<раздел>"`. Убедитесь, что у страниц есть
`description`. См. [`components/search.md`](../components/search.md).

## Шаг 6. Переиспользуйте существующее

Прежде чем писать разметку/CSS с нуля — проверьте, нет ли готового:
- ряд списка → `archive-item.html`;
- пилюля → `.tag-pill`;
- заголовок-хаб → `.profile-header` / `.profile-name`;
- дата → `post-date.html` / `archive-date.html`;
- контролы шапки → `.btn-control`.

## Шаг 7. Обновите спецификации

Фича меняет поведение → обновите соответствующую спецификацию (или добавьте новую в
`components/`) **в том же изменении**. Спецификации — зеркало кода (см.
[`README.md`](../README.md)).

## Пример: как добавляли серии (сквозной проход)

1. Паттерн — content-section (рукописный хаб + ручной порядок) → ADR-7.
2. Раздел `content/series/`, страницы `<name>.{ru,en}.md` с `url` + `outputs`.
3. Гашение авто-`/series.html` через `_index.{ru,en}.md` (`build.render=false`).
4. Шаблон `layouts/series/single.html` + проверка уникальности `number` (`errorf`).
5. Опт-ин постов `series: {name, number}`; рендер в 3 местах `posts/single.html` с
   fallback.
6. i18n-ключи (`postSeriesMeta`, `seriesTitle`, `seriesItemNumber`, `seriesMobileText`)
   в оба TOML.
7. Серии в `index.searchindex.json`.
8. Спека — [`components/series.md`](../components/series.md).

## Связанные спецификации
- [`patterns/`](../patterns/) — все паттерны.
- [`decisions/architecture-decisions.md`](../decisions/architecture-decisions.md) —
  границы решений.
- [`checklists.md`](checklists.md).
