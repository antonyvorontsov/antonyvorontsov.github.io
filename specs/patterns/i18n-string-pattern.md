# Паттерн: UI-строка через i18n

## Когда использовать

**Всегда**, когда в шаблон нужно добавить любую видимую пользователю строку
(заголовок секции, подпись кнопки, aria-label, плейсхолдер, текст-заглушку). Никаких
хардкод-строк в шаблонах.

## Правило

Любая UI-строка живёт в `i18n/ru.toml` и `i18n/en.toml` под одним ключом и
вызывается через `{{ i18n "ключ" }}`. **Ключ обязан быть в обоих файлах** — иначе на
одном языке будет пусто.

## Как реализовать

### 1. Добавить ключ в оба TOML
```toml
# i18n/ru.toml
[latestPostsTitle]
other = "Последние посты"
```
```toml
# i18n/en.toml
[latestPostsTitle]
other = "Latest Posts"
```
Ключ — camelCase, семантический (см.
[`conventions/naming.md`](../conventions/naming.md#ключи-i18n-строк)).

### 2. Вызвать в шаблоне
```go-html-template
<h2 class="section-heading">{{ i18n "latestPostsTitle" }}</h2>
```

## С аргументами (`dict`)

Когда в строку нужно подставить значение:
```go-html-template
{{ i18n "postSeriesMeta" (dict "Name" $seriesTitle "Number" $seriesNumber) }}
```
```toml
# ru.toml
[postSeriesMeta]
other = "Серия постов «{{ .Name }}» №{{ .Number }}"
# en.toml
[postSeriesMeta]
other = "A part of series “{{ .Name }}” #{{ .Number }}"
```

Реальные примеры из проекта:
| Ключ              | Аргументы        | Назначение                         |
|-------------------|------------------|------------------------------------|
| `footerCopyright` | `Year`, `Name`   | копирайт в футере                  |
| `tagPageDescription` | `Tag`         | мета-описание страницы тега        |
| `postSeriesMeta`  | `Name`, `Number` | метка серии в шапке поста          |
| `seriesItemNumber`| `Number`         | «№N.» перед постом на стр. серии   |
| `seriesMobileText`| `Name`           | моб. метка серии (целая фраза)     |

## Строки с HTML

Если значение содержит HTML (ссылку и т.п.), выводите через `safeHTML`:
```go-html-template
{{ i18n "madeWithHugo" | safeHTML }}
```
```toml
[madeWithHugo]
other = "Сделано с помощью <a href=\"https://gohugo.io/\" …>Hugo</a>"
```

## Приём: целая фраза вместо `<a>` посреди перевода

Когда ссылка — часть предложения, а порядок слов в ru/en различается, делайте **всю
фразу** одним i18n-значением и оборачивайте `<a>` целиком в шаблоне (а не вставляйте
`<a>` в середину строки). Пример — `seriesMobileText`:
```go-html-template
<a href="{{ $seriesHref }}" class="post-series-mobile">
  {{ i18n "seriesMobileText" (dict "Name" $seriesTitle) }}
</a>
```
```toml
# ru: «Эта статья — часть серии «{{ .Name }}».»
# en: «This article is a part of the “{{ .Name }}” series.»
```

## Что НЕ идёт в i18n
- Контент постов/страниц — это отдельные языковые файлы в `content/` (см.
  [`conventions/bilingual-model.md`](../conventions/bilingual-model.md)).
- Пункты меню — `config/_default/menus.{ru,en}.toml`.
- Параметры профиля (`bio`, `title`) — `[languages.<lang>.params]`.

i18n — только для UI-строк, зашитых в шаблоны.

## Чек-лист
- [ ] ключ добавлен в `i18n/ru.toml`
- [ ] ключ добавлен в `i18n/en.toml` (не забыть!)
- [ ] вызов `{{ i18n "ключ" }}` в шаблоне
- [ ] если HTML — `| safeHTML`
- [ ] проверка на обоих языках

## Связанные спецификации
- [`conventions/bilingual-model.md`](../conventions/bilingual-model.md) — уровень
  UI-строк в двуязычной модели.
- [`conventions/naming.md`](../conventions/naming.md#ключи-i18n-строк) — именование ключей.
