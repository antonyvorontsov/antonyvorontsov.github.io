# Чек-листы

Быстрые проверочные списки для типовых изменений. Полные контексты — в
соответствующих специфах по ссылкам.

## Двуязычность (любое изменение)

- [ ] Тронул контент → есть парный `*.ru.md`/`*.en.md`? Совпадает базовое имя?
- [ ] Добавил UI-строку в шаблон → ключ есть в **обоих** `i18n/ru.toml` и `i18n/en.toml`?
- [ ] Добавил пункт меню → добавлен в **оба** `config/_default/menus.{ru,en}.toml`?
- [ ] Ручной `url:` для en прописан с префиксом `/en/`?
- [ ] Проверил ru (на `/`) **и** en (на `/en/`) в `hugo server`?

→ [`conventions/bilingual-model.md`](../conventions/bilingual-model.md)

## Новый пост

- [ ] Слаг ASCII kebab-case, одинаковый для ru/en
- [ ] Оба файла (или сознательно один язык)
- [ ] `date` одинаковая на обоих
- [ ] `description` заполнен на каждом языке (иначе пусто в карточке/поиске)
- [ ] Интро-`<p>`, секции `## … {#anchor}` с ASCII-якорями, уникальными в файле
- [ ] Переключатель языка на посте линкует между версиями
- [ ] Прогнан субагент `blog-post-validator`

→ [`guides/add-new-post.md`](add-new-post.md)

## Новая UI-строка

- [ ] Ключ (camelCase) в `i18n/ru.toml`
- [ ] Тот же ключ в `i18n/en.toml`
- [ ] Вызов `{{ i18n "ключ" }}` (с `(dict …)` если есть аргументы)
- [ ] HTML в значении → `| safeHTML`
- [ ] Проверен на обоих языках

→ [`patterns/i18n-string-pattern.md`](../patterns/i18n-string-pattern.md)

## Новая taxonomy

- [ ] `[taxonomies]` в `hugo.toml`
- [ ] `[outputs] term = ["html"]` (гасит RSS на терм)
- [ ] Решение по `disableKinds` (нужна ли сводная страница)
- [ ] `layouts/<name>/term.html`
- [ ] Спец-кейс `{{ if eq .Kind "term" }}` в `head.html` (title/description)
- [ ] i18n-ключ описания в оба TOML
- [ ] Поле во frontmatter постов (англ. слаги, одинаковые в ru/en)

→ [`patterns/taxonomy-pattern.md`](../patterns/taxonomy-pattern.md)

## Новый content-раздел (как серии)

- [ ] `content/<section>/<name>.{ru,en}.md` с `url` + `outputs: [html]` + `description`
- [ ] `content/<section>/_index.{ru,en}.md` с `build: {list:false, render:false}`
- [ ] `layouts/<section>/single.html` + `errorf`-проверки инвариантов
- [ ] Опт-ин объект во frontmatter постов
- [ ] Рендер привязки в `posts/single.html` с fallback (nil-страница)
- [ ] i18n-ключи в оба TOML
- [ ] Раздел в `layouts/index.searchindex.json`

→ [`patterns/content-section-pattern.md`](../patterns/content-section-pattern.md)

## Правка шаблона/partial

- [ ] Не появилась ли хардкод-строка вместо i18n?
- [ ] Если правил общий partial (`archive-item`, `timeline-item`, `profile-header`) —
      проверил **все** места вызова?
- [ ] Не сломал ли `$isPostSingle`-развилку в `baseof.html`/`head.html`?
- [ ] Иконки — инлайн-svg (не подключение библиотеки)?

## Правка JS

- [ ] Ванильный JS, без библиотек (ADR-5)?
- [ ] Модуль в `window.Blog.*`, `init` вызван в `main.js`?
- [ ] Порядок подключения в `baseof.html` не нарушен?
- [ ] Работает при отключённом JS gracefully (контент рендерится server-side)?

## «Тестирование» (нет автотестов — это контентный сайт)

- [ ] `hugo server` без ошибок/варнингов в консоли сборки
- [ ] Обе языковые версии открываются
- [ ] Тёмная и светлая тема (`data-theme`)
- [ ] Мобильный вид (`≤767px`): бургер-меню, скрытый ToC-сайдбар
- [ ] Поиск находит новую/изменённую страницу
- [ ] `hugo --gc --minify` собирается; `public/<page>.html` открывается через `file://`

→ [`architecture/build-and-deploy.md`](../architecture/build-and-deploy.md)

## Перед мержем в `master` (= деплой)

- [ ] Помню: пуш в `blog` не деплоит — деплоит только `master`
- [ ] PR-gate зелёный (`.github/workflows/hugo-pr-check.yml` — build без деплоя,
      реально гоняется на PR, в отличие от `hugo.yml`, который срабатывает только
      **после** мержа)
- [ ] Домен не просочился никуда, кроме `static/CNAME` (ADR-4)

## Связанные специфы
- [`guides/add-new-post.md`](add-new-post.md)
- [`guides/add-new-feature.md`](add-new-feature.md)
