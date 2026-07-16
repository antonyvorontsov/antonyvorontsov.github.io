# Компоненты: карта

Каждая реализованная функция сайта описана отдельной спецификой. Здесь — карта
«фича → файлы» для быстрой навигации.

## Список компонентов

| Компонент                                          | Что это                                    | Тип механизма             |
|----------------------------------------------------|--------------------------------------------|---------------------------|
| [`posts.md`](posts.md)                             | Посты, страница поста, ToC-сайдбар          | content + single-шаблон   |
| [`tags.md`](tags.md)                               | Теги                                        | Hugo taxonomy             |
| [`series.md`](series.md)                           | Серии постов                                | Hugo content section      |
| [`search.md`](search.md)                           | Клиентский поиск                            | JSON-индекс + ванильный JS |
| [`navigation-and-theme.md`](navigation-and-theme.md) | Шапка, бургер, тема, переключатель языка, футер | шаблон + JS          |
| [`homepage-and-about.md`](homepage-and-about.md)   | Главная, «Обо мне», архив постов            | list/single-шаблоны       |
| [`comments.md`](comments.md)                       | Комментарии (Giscus) на постах               | сторонний виджет + JS      |

## Матрица «шаблон → компонент»

| Файл в `layouts/`                       | Компонент                          |
|-----------------------------------------|------------------------------------|
| `_default/baseof.html`                  | все (базовый каркас)               |
| `_default/_markup/render-heading.html`  | [posts](posts.md) (якоря заголовков) |
| `_default/_markup/render-codeblock.html` | [posts](posts.md) (подсветка кода: обёртка + copy/expand кнопки вокруг штатного вывода Chroma) |
| `partials/head.html`                    | все (`<head>`, мета, SEO)          |
| `partials/header.html`                  | [navigation-and-theme](navigation-and-theme.md) |
| `partials/footer.html`                  | [navigation-and-theme](navigation-and-theme.md) |
| `partials/search-modal.html`            | [search](search.md)                |
| `partials/code-modal.html`              | [posts](posts.md) (модалка Expand для code blocks, одна на страницу) |
| `partials/profile-header.html`          | [homepage-and-about](homepage-and-about.md) |
| `partials/timeline-item.html`           | [homepage-and-about](homepage-and-about.md) (about) |
| `partials/social-icon.html`             | [homepage-and-about](homepage-and-about.md) (about) |
| `partials/archive-item.html`            | [posts](posts.md) / [tags](tags.md) / [series](series.md) (общий ряд списка; закрытый контракт параметров — см. [`patterns/shared-partial-pattern.md`](../patterns/shared-partial-pattern.md)) |
| `partials/archive-date.html`            | archive-item (дата в списке)       |
| `partials/post-date.html`               | [posts](posts.md), [homepage](homepage-and-about.md) (дата поста) |
| `partials/date-ru.html`                 | русское форматирование даты        |
| `partials/cover-image.html`             | [posts](posts.md) (рендер обложки поста) |
| `partials/assert-image-field.html`      | [posts](posts.md) (валидация обложки поста) |
| `partials/giscus.html`                  | [comments](comments.md) (placeholder-контейнер) |
| `index.html`                            | [homepage-and-about](homepage-and-about.md) (главная) |
| `about.html`                            | [homepage-and-about](homepage-and-about.md) («Обо мне») |
| `posts/list.html`                       | [homepage-and-about](homepage-and-about.md) (архив постов) |
| `posts/single.html`                     | [posts](posts.md) (страница поста + ToC + серия), [comments](comments.md) |
| `series/single.html`                    | [series](series.md)                |
| `tags/term.html`                        | [tags](tags.md)                    |
| `index.searchindex.json`                | [search](search.md)                |

## Матрица «JS-модуль → компонент»

| Файл в `static/js/`         | Компонент / функция                                |
|-----------------------------|----------------------------------------------------|
| `main.js`                   | точка входа, вызывает `init` модулей                |
| `modules/navigation.js`     | тема, бургер-меню, скроллспай ToC ([nav](navigation-and-theme.md), [posts](posts.md)) |
| `modules/search.js`         | [search](search.md)                                |
| `modules/utils.js`          | год в футере                                        |
| `modules/copy-button.js`    | [posts](posts.md) (copy-to-clipboard в code blocks) |
| `modules/code-expand.js`    | [posts](posts.md) (Expand → модалка code blocks) |
| `modules/giscus.js`         | [comments](comments.md) (инициализация виджета + синхронизация темы) |

## Как читать спецификацию компонента

Каждая специфа компонента отвечает на:
1. **Что и зачем** — назначение фичи.
2. **Как устроено** — данные, файлы, шаблоны, поток.
3. **Как отображается** — desktop/mobile, примеры разметки.
4. **Интеграция** — связи с другими компонентами.

## Связанные спецификации
- [`../patterns/`](../patterns/) — обобщённые паттерны за этими компонентами.
- [`../guides/add-new-feature.md`](../guides/add-new-feature.md) — как добавить новый.
