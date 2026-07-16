# Компонент: комментарии (Giscus)

## Что и зачем

Комментарии на постах и разводящих страницах серий через [Giscus](https://giscus.app) —
виджет поверх GitHub Discussions репозитория. Единственная сторонняя
JS-зависимость на сайте — почему это допустимо, см. ADR-9
([`decisions/architecture-decisions.md`](../decisions/architecture-decisions.md#adr-giscus-exception)).

## Как устроено

### Server-side: placeholder, не сам виджет

`layouts/partials/giscus.html` рендерит **не** сам Giscus-скрипт, а только
контейнер с data-атрибутами, и делает это через единый флаг `isCommentable` —
см. следующий раздел.

Ничего не рендерится, если:
- `giscusRepoId`/`giscusDefaultCategoryId` не заданы (локальный `hugo server`,
  `hugo-pr-check.yml` — эти два значения существуют только в CI-сборке, см.
  [`architecture/build-and-deploy.md`](../architecture/build-and-deploy.md)), или
- страница явно отключила комментарии через `enableComments: false`.

Причина разделения на placeholder + client-side инициализацию: тема виджета
должна совпадать с ручным тогглом темы сайта (`data-theme` на `<html>`,
`localStorage`), а не с `prefers-color-scheme` — а тема сайта известна только в
браузере, не на сборке.

### Build-time валидация конфигурации

`giscus.html` проверяет две вещи независимо от `isCommentable` (именно потому,
что они существуют, чтобы ловить случаи, из-за которых `isCommentable` мог бы
оказаться ложным не по расчёту, а по ошибке):

- **`enableComments` — не bool.** `{{ ne .Params.enableComments false }}`
  сравнивает типизированно: значение `enableComments: "false"` (строка в
  кавычках) **не равно** булеву `false`, поэтому комментарии остались бы
  включены вопреки намерению автора. `giscus.html` проверяет тип через
  `printf "%T" .Params.enableComments` (не `isset` — Hugo's `Params` не
  вписывается в семантику `isset` так, как ожидается: он вернул `false` даже
  для реально заданного значения в ручной проверке) и падает `errorf`, если
  тип не `"<nil>"` (ключ отсутствует) и не `"bool"` — тем же приёмом по духу,
  что ADR-8 (`assert-image-field.html`).
- **Частично заданный конфиг.** Если задан только `giscusRepoId` или только
  `giscusDefaultCategoryId` (например, опечатка в имени секрета/env-переменной
  в `hugo.yml`), сборка не должна молча решить, что комментарии просто
  отключены — это `warnf` с explicit-сообщением, а не тишина.

### Client-side: `static/js/modules/giscus.js`

Загружается через `defer` (см. `baseof.html`), инициализируется из `main.js`
(`if (giscus) giscus.init()`, как `copyButton`/`codeExpand`). При наличии
`.giscus-container` на странице:
1. Читает data-атрибуты контейнера.
2. Собирает настоящий `<script src="https://giscus.app/client.js" data-repo=...
   data-mapping="url" ... data-theme="...">` и вставляет в контейнер — Giscus сам
   вставляет `iframe.giscus-frame` рядом.
3. `data-theme` берётся из `document.documentElement.getAttribute('data-theme')`
   (fallback `'light'`) в момент инициализации — без этого была бы вспышка
   светлой темы для тёмного пользователя.

Живое переключение темы — `navigation.js`'s `toggleTheme()` дополнительно
вызывает `syncTheme(newTheme)` (передан в `navigation.initTheme(giscus)` из
`main.js`, как DI — а не через прямое обращение к `window.Blog.giscus`, тем же
приёмом, что `copyButton`/`codeExpand`), который делает
`iframe.contentWindow.postMessage({ giscus: { setConfig: { theme } } },
'https://giscus.app')` — это официальный документированный API Giscus для
синхронизации темы хост-страницы, не хак.

**Гонка с ленивой загрузкой.** `data-loading="lazy"` означает, что Giscus
создаёт `iframe.giscus-frame` только при приближении к вьюпорту — а контейнер
комментариев стоит в конце `<article>`, т.е. ниже сгиба почти на любом посте.
Если пользователь переключит тему до того, как долистает до комментариев,
`syncTheme()` не найдёт ещё не смонтированный iframe. `init()` заводит
`MutationObserver` на `.giscus-container`: когда iframe наконец появляется
(ленивая загрузка сработала), обсервер сразу применяет актуальную тему (а не ту,
что была на момент `init()`) и отключается — дальнейшие переключения идут через
обычный `syncTheme()`, потому что iframe уже существует.

### Где на странице (`isCommentable` gate)

`baseof.html` заводит единый флаг:
```go-html-template
{{ .Scratch.Set "isCommentable" (and
  (or (.Scratch.Get "isPostSingle") (and .IsPage (eq .Section "series")))
  .Site.Params.giscusRepoId
  .Site.Params.giscusDefaultCategoryId
  (ne .Params.enableComments false)
) }}
```
— composится поверх уже посчитанного `isPostSingle` (посты) плюс серии, **и**
включает саму проверку конфигурации/`enableComments`, а не только тип страницы.
Это единственный источник истины: и `<script src=".../giscus.js">` в
`baseof.html`, и `{{ if .Scratch.Get "isCommentable" }}` внутри
`giscus.html` читают один и тот же флаг — им физически невозможно разойтись,
в отличие от прежней версии, где у скрипта и у контейнера были две отдельные,
независимо считаемые проверки.

Партиал вызывается напрямую в шаблонах:
- `layouts/posts/single.html` — внутри `<article>`, после mobile-ссылки на серию,
  перед `</article>`.
- `layouts/series/single.html` — после `.archive-list`, перед `{{ end }}`.

Другие типы страниц (главная, архив, теги) партиал не вызывают вовсе — не через
условие, а просто отсутствием вызова. (Место вставки партиала в конкретный
шаблон всё ещё требует ручного добавления при переносе на новую секцию — этого
не избежать, раз виджет должен стоять внутри контента, а не быть глобальной
модалкой вроде `code-modal.html`; но сам расчёт «когда рендерить» теперь один.)

## Frontmatter: `enableComments`

Опциональный булев флаг, доступен и постам, и страницам серий. По умолчанию
`true` (комментарии включены) — отключить можно точечно на конкретной странице:

```yaml
enableComments: false
```

`.Params.enableComments` при отсутствии ключа — `nil`, не `false`, поэтому
условие — `(ne .Params.enableComments false)` (истинно и для `nil`, и для
явного `true`). Значение, заданное не как bool (например, `enableComments:
"false"` в кавычках), падает `errorf` при сборке — см. «Build-time валидация»
выше. См.
[`data-model/frontmatter-reference.md`](../data-model/frontmatter-reference.md).

## Конфигурация

| Параметр                   | Где                                   | Секретно? |
|-----------------------------|----------------------------------------|-----------|
| `giscusRepo`                | `hugo.toml [params]`                  | нет       |
| `giscusDefaultCategory`     | `hugo.toml [params]`                  | нет       |
| `giscusRepoId`              | CI env var `HUGO_PARAMS_GISCUSREPOID` | да        |
| `giscusDefaultCategoryId`   | CI env var `HUGO_PARAMS_GISCUSDEFAULTCATEGORYID` | да |

Секретные значения хранятся как GitHub repo secrets (`GISCUS_DATA_REPO_ID`,
`GISCUS_DATA_CATEGORY_ID`) и инжектятся только на шаге сборки в
`.github/workflows/hugo.yml` — см.
[`architecture/build-and-deploy.md`](../architecture/build-and-deploy.md).

## Ограничения

- **`data-mapping="url"`** — обсуждение привязано к URL страницы. Сайт использует
  `uglyURLs = true` + `relativeURLs = true` (ADR-3), но per-page URL стабилен, так
  что это не проблема сейчас. Если URL поста/серии когда-нибудь изменится
  (переименование, смена схемы), существующая ветка обсуждения на GitHub
  «отвяжется» от страницы — при таком изменении стоит явно решить, что делать со
  старыми обсуждениями.
- Комментарии на PR-check сборках (`hugo-pr-check.yml`) никогда не появляются —
  секреты туда намеренно не передаются (PR из форков не должны их видеть).

## Связанные спецификации
- [`decisions/architecture-decisions.md`](../decisions/architecture-decisions.md#adr-giscus-exception) — ADR-9.
- [`architecture/build-and-deploy.md`](../architecture/build-and-deploy.md) — секреты и CI.
- [`data-model/frontmatter-reference.md`](../data-model/frontmatter-reference.md) — `enableComments`.
- [`components/posts.md`](posts.md), [`components/series.md`](series.md).
