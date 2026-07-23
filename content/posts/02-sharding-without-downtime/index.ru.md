---
title: 'Шардирование без даунтайма: практический разбор'
date: 2025-03-14
draft: true
description: Разбираю, как перевести ключевое хранилище высоконагруженной WMS на шардированную
  схему без остановки склада. Рассказываю про выбор ключа шардирования, миграцию данных
  и обработку граничных случаев с консистентностью.
tags: [sharding, databases, distributed-systems]
series:
  name: "distributed-systems"
  number: 1
cover:
  src: "images/cover.jpg"
  alt: "Схема шардирования базы данных по диапазону ключей"
slug: "sharding-without-downtime"
aliases: ["/posts/shardirovanie-bez-daountaima.html"]
---

<p>Разбираю, как перевести ключевое хранилище высоконагруженной WMS на шардированную схему без остановки склада. Рассказываю про выбор ключа шардирования, миграцию данных и обработку граничных случаев с консистентностью.</p>

## Контекст {#context}

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Проблема {#the-problem}

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

### Рост нагрузки {#growing-load}

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.

![Схема шардирования по диапазону ключей](images/inline-diagram.jpg)

### Ограничения одного узла {#single-node-limits}

Consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.

## Техническое решение {#technical-solution}

At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.

### Выбор ключа шардирования {#choosing-a-shard-key}

Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit.

### Миграция без остановки {#live-migration}

Quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae.

## Итоги {#takeaways}

Sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat, nihil impedit quo minus.
