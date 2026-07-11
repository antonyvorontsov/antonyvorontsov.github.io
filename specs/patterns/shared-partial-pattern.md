# Паттерн: переиспользуемый partial

## Когда использовать

Когда один и тот же кусок разметки нужен в нескольких местах, но с небольшими
вариациями. Вместо копипаста — один partial, параметризованный через `dict`.

## Эталоны в проекте

| Partial              | Переиспользуют                                  | Параметры              |
|----------------------|-------------------------------------------------|------------------------|
| `archive-item.html`  | архив постов, страница тега, страница серии      | `page`, `linkText`, `hideDate` |
| `timeline-item.html` | «Опыт» и «Выступления» на «Обо мне»              | `item`, `showCompany`  |
| `profile-header.html`| главная, «Обо мне»                              | (данные из `.` — авто) |
| `post-date.html`     | пост, карточки главной                          | (`.` — страница)       |
| `social-icon.html`   | каждая соцсеть на «Обо мне»                      | (`.` — ключ иконки)    |

## Как реализовать

### 1. Вынести разметку в `layouts/partials/<name>.html`
Принимайте параметры из `dict`, задавайте дефолты через `default`:
```go-html-template
{{/* archive-item.html */}}
{{ $page := .page }}
{{ $linkText := .linkText | default $page.Title }}
<div class="archive-item">
  {{ if not .hideDate }}
  <span class="archive-date">{{ partial "archive-date.html" $page }}</span>
  {{ end }}
  <a href="{{ $page.RelPermalink }}" class="archive-link">{{ $linkText }}</a>
</div>
```

### 2. Вызывать с `dict`
```go-html-template
{{/* обычный список — дефолты */}}
{{ partial "archive-item.html" (dict "page" .) }}

{{/* серия — кастомный текст ссылки, без даты */}}
{{ partial "archive-item.html" (dict
    "page" .
    "linkText" (printf "%s %s" (i18n "seriesItemNumber" (dict "Number" .Params.series.number)) .Title)
    "hideDate" true) }}
```

## Вариант: параметр-флаг

`timeline-item.html` включает/выключает часть разметки булевым флагом:
```go-html-template
{{ $item := .item }}
<span class="timeline-role">{{ $item.role }}</span>
{{ if .showCompany }}<span class="timeline-company">{{ $item.company }}</span>{{ end }}
```
```go-html-template
{{ partial "timeline-item.html" (dict "item" . "showCompany" true) }}   {{/* Опыт */}}
{{ partial "timeline-item.html" (dict "item" . "showCompany" false) }}  {{/* Выступления */}}
```

## Вариант: partial принимает `.` напрямую

Если partial нужен только один аргумент — можно передать его как контекст `.` без
`dict`:
```go-html-template
{{ partial "post-date.html" . }}          {{/* . = страница */}}
{{ partial "social-icon.html" .icon }}    {{/* . = строка-ключ иконки */}}
```

## Вариант: явный флаг vs. связка по данным

Одна и та же выборка может управляться двумя способами — `profile-header.html`
использует оба сразу, и это показывает, когда какой уместен:
```go-html-template
{{ $showAvatar := .showAvatar }}          {{/* ЯВНЫЙ флаг из места вызова */}}
{{ $hasSocial := $page.Params.social }}   {{/* СВЯЗКА по наличию данных */}}
{{ if $showAvatar }}… аватар …{{ end }}
{{ if $hasSocial }}… соцсети …{{ end }}
```
- **Аватар** — чистое решение «показывать или нет», от данных не зависит → **явный
  флаг** (`showAvatar` через `dict`). Не завязывайте такое на посторонние данные.
- **Соцсети** — сам блок *и есть* рендер данных `social`, без них рендерить нечего →
  **связка по наличию данных** уместна.

Правило: если видимость логически независима от данных — передавайте явный флаг; если
блок буквально рендерит эти данные — гейт по их наличию. См.
[`components/homepage-and-about.md`](../components/homepage-and-about.md).

## Когда дефолт важен для консистентности CSS
Общий partial держит единый CSS-класс (`.archive-item`, `.archive-link`) во всех
местах вызова — поэтому три разных списка (посты/теги/серии) выглядят одинаково без
дублирования стилей.

## Чек-лист
- [ ] partial в `layouts/partials/`
- [ ] параметры через `dict` (или `.` для одиночного)
- [ ] дефолты через `default`
- [ ] единый CSS-класс во всех вызовах
- [ ] проверить каждое место вызова после изменения partial

## Связанные специфы
- [`components/homepage-and-about.md`](../components/homepage-and-about.md) —
  `archive-item`, `timeline-item`, `profile-header`.
- [`components/README.md`](../components/README.md) — матрица «partial → компонент».
