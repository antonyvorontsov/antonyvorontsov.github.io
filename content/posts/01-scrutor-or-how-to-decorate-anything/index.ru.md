---
title: Scrutor или как задекорировать любой компонент
date: 2024-11-04
description: Рассказываю, как паттерн «Декоратор» и библиотека Scrutor помогают
  разделить бизнес-логику и технические concern'ы — метрики, трейсинг, логи и кеширование.
tags: [dotnet, design-patterns]
slug: "scrutor-or-how-to-decorate-anything"
---

## Предыстория {#history}

Многие программисты в начале своей карьеры обращаются к книге «банды четырех», дабы познать паттерны. И многие, я здесь не исключение, прочитав данную книгу, начинают изобретать велосипеды и писать реализации этих паттернов налево и направо, чтобы «потренироваться», «прокачаться» и «доказать другим, что не пальцем деланы». А следом начинаются стадии отрицания и депрессии, что не так-то эти паттерны полезны. Особенно сильно это проявляется, когда .NET программисты сталкиваются с современными подходами написания кода. Если эта история находит у вас отклик, то добро пожаловать в статью.

## Не декоратором единым {#more-than-just-decorators}

Можно ошибочно подумать, что в первом параграфе я клоню к тому, что паттерны не нужны. Вовсе нет! Они нужны, используются сплошь и рядом, но их реализация давно ушла за рамки того, как их описывали господа Эрих Гамма, Ричард Хелм, Ральф Джонсон и Джон Влиссидес.

- Singleton активно используется в упомянутом DI.
- Builder часто находит свое применение в Unit тестах при создании тестируемых объектов.
- Factory method часто можно встретить при создании сущностей в домене.
- Mediator можно увидеть в одной известной библиотеке.
- And the list goes on.

Не всегда очевидно, что есть паттерн, а что антипаттерн, но если пристально присматриваться, то можно найти много интересного. В этой же статье хочется поделиться этими наблюдениями и рассказать, как мы нашли применение паттерну «Декоратор».

## Задачи {#challenges}

Когда я только начал работать над одной из in-house систем в Ozon Tech, код писался довольно топорно и без задней мысли о том, во что он превратится через год-два. Причиной тому были и высокий темп разработки (startup like), и небольшие нагрузки (система только обретала свой вид, но пользовались ей еще не так обильно). Нагрузка росла вместе с системой, а код становился более запутанным. Технические вещи перемешивались с бизнесовыми, и в далеком 2020 мы стали задумываться, как же нам отделить одно от другого, не превращая кодовую базу в big mess. Смену архитектурных подходов, decoupling распределенного монолита и начало применения DDD мы оставим за скобками, про них я расскажу отдельно.

Задачи, которые встали перед нами:

- измерение скорости работы отдельных компонентов в коде, а не только лишь бездумная оценка более «размытой» метрики response time;
- ведение детального трейсинга (спанов отдельных операций, если быть точнее);
- повышение прозрачности работы, дополнение контекста логов информацией;
- кеширование данных, снижение latency.

Все перечисленные пункты можно решить при помощи библиотеки [Scrutor](https://github.com/khellang/Scrutor).

## Scrutor {#scrutor}

В стандартном ASP.NET приложении никуда не деться от Dependency Injection. Все компоненты (за редким исключением) регистрируются в DI, и декорировать их вручную не очень-то удобно. Scrutor же дает возможность сделать это очень лаконично.

Представим, что у нас есть классический домен с заказом товаров в интернет-магазине, где мы знаем, кто, что и в каком количестве заказал.

```csharp
public sealed record Product(
    ProductId ProductId,
    string Image);

public sealed record OrderedProduct(
    ProductId ProductId,
    int Quantity);

public enum OrderStatus
{
    Created,
    Packed,
    Delivered,
    Cancelled
}

public sealed record Order(
    UserId UserId,
    OrderId OrderId,
    IReadOnlyCollection<OrderedProduct> OrderedProducts,
    OrderStatus OrderStatus);
```

Этот домен описан в сервисе, который управляет заказами и хранит информацию о них в базе данных. Классика. Сервис может как управлять сущностями, например, изменяя статус заказа при доставке или его отмене, так и отдавать информацию по самому заказу или списку заказов пользователя (помним про личный кабинет и историю взаимодействия с интернет-магазином).

```csharp
public interface IRepository
{
    Task<Order> Get(
        OrderId orderId,
        CancellationToken cancellationToken);

    Task<IReadOnlyCollection<Order>> Get(
        UserId userId,
        CancellationToken cancellationToken);

    Task Add(
        Order order,
        CancellationToken cancellationToken);

    Task Save(
        Order order,
        CancellationToken cancellationToken);
}
```

Можем ли мы понять, как быстро отрабатывает наша база данных? Конечно, можем. Никто не отменяет статистику, собираемую самой БД, но есть «особые» случаи:

- А что, если заказ очень большой?
- Может быть, клиент помешан на покупках и тратит всю свою зарплату в магазине, что делает его список заказов огромным (и нужен paging для вытягивания всех данных)?

Хочется немного удобства, и такое удобство может дать график с гистограммой, которая покажет, какие методы у нас «летают», а какие «тормозят». Давайте напишем нечто похожее, начав реализацию с компонента, который будет отвечать за запись метрики.

```csharp
public interface IMeter
{
    Observer ObserveMethod(string methodName);
}

internal sealed class Meter : IMeter
{
    // Тут должен быть конструктор и создание метрики, куда мы будем писать скорость работы в ms.
    // ...

    Observer ObserveMethod(string methodName)
    {
        return new Observer(
            milliseconds => _histogram
                .WithLabels("method_name", methodName)
                .Observe(milliseconds));
    }
}
```

Для сокращения кода в декораторе вернем `IDisposable` observer, который запишет метрику по факту завершения работы метода.

```csharp
public readonly struct Observer : IDisposable
{
    private readonly Action<long> _postObserveAction;
    private readonly Stopwatch _stopwatch;

    public Observer(Action<long> postObserveAction)
    {
        _postObserveAction = postObserveAction;
        _stopwatch = Stopwatch.StartNew();
    }

    public void Dispose()
    {
        _stopwatch.Stop();
        var elapsed = _stopwatch.ElapsedMilliseconds;
        _postObserveAction(elapsed);
    }
}
```

Декорируем наш репозиторий и начинаем делать замеры скорости работы. Минимум нового кода.

```csharp
internal sealed class RepositoryMeter(
    IRepository repository,
    IMeter meter) : IRepository
{
    public async Task<Order> Get(
        OrderId orderId,
        CancellationToken cancellationToken)
    {
        using var _ = meter.ObserveMethod("Get.OrderId");
        return await repository.Get(orderId, cancellationToken);
    }

    // ....

    public async Task Add(
        Order order,
        CancellationToken cancellationToken)
    {
        using var _ = meter.ObserveMethod("Add");
        await repository.Add(order, cancellationToken);
    }

    // ....
}
```

Остается лишь зарегистрировать сам декоратор в DI, и вуаля, все работает. Мы больше не переживаем про метрики нашего репозитория. Бежим скорее строить график по 90 и 99 квантилям и отслеживать потенциальные проблемы в работе!

```csharp
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddRepositories(
        this IServiceCollection services)
    {
        services.AddSingleton<IRepository, Repository>();
        services.Decorate<IRepository, RepositoryMeter>();
        return services;
    }
}
```

Стал ли код сложнее? **Несомненно**. Стоило ли это того? **Да**. В коде увеличивается количество абстракций, и для человека, который не привык в таком количестве абстракций разбираться, кодовая база может стать более нагруженной. Но повышение так называемого «cognitive cost of reasoning» может не быть большой проблемой в среднесрочной и долгосрочной перспективах. Как только вы привыкаете к такому стилю декорирования, разобраться в архитектуре становится не так сложно, а разделение технических concern'ов может сыграть на руку, когда кодовая база в _декорируемом_ компоненте увеличится. Ведь мы же не хотим иметь «простынку» из кода?

## Еще немного примеров {#more-examples}

### Кеширование {#caching}

Давайте раскручивать нашу доменную модель дальше. Поднимемся на уровень повыше и посмотрим на компонент, который собирает данные из БД и обогащает их данными из других источников. Мы можем столкнуться с необходимостью:

- подтянуть атрибуты заказанных товаров (изображение и еще много всего другого) из мастер-системы;
- данные о сроках доставки, за которые отвечает логистический сервис;
- любую другую информацию, которую мы по той или иной причине не хотим хранить в своем сервисе, — все зависит от вашего воображения (и требований к сервису, если разбирать работу с реальной системой).

```csharp
public sealed record EnrichedOrderedProduct(
    ProductId ProductId,
    string Name,
    string Description,
    string Image,
    int Quantity);

public sealed record EnrichedOrder(
    UserId UserId,
    OrderId OrderId,
    DateTimeOffset EstimatedDeliveryDate,
    IReadOnlyCollection<EnrichedOrderedProduct> Products,
    OrderStatus OrderStatus);
```

Представим, что у нас есть компонент, который получает эти данные, собирает их воедино и возвращает пользователю.

```csharp
public interface IOrderService
{
    Task<EnrichedOrder> Get(
        OrderId orderId,
        CancellationToken cancellationToken);

    Task<IReadOnlyCollection<EnrichedOrder>> Get(
        UserId orderId,
        CancellationToken cancellationToken);
}
```

Информация о товарах меняется не так часто, и атрибуты получать мы хотим с завидным постоянством. Еще одним местом для кеширования может быть список заказов пользователя. Ведь даже богатые клиенты смотрят список заказов чаще, чем делают эти самые заказы.

Прекрасным решением для кеширования будет декоратор. Там мы можем:

- контролировать срок жизни кешированных объектов;
- писать метрики попадания в кеш (классический _hit or miss_) для повышения общего уровня observability сервиса.

Накидаем примитивный интерфейс. Давайте расценивать этот компонент как псевдокод, потому что _детали_ реализации не так важны в данном контексте.

```csharp
public interface ICache
{
    Task Add<T>(
        string key,
        T value,
        CancellationToken cancellationToken);

    Task<(bool Hit, T Object)> Get<T>(
        string key,
        CancellationToken cancellationToken);
}
```

И напишем декоратор для `IOrderService`. Пример с использованием Scrutor относительно прост.

```csharp
internal sealed class OrderServiceCache(
    IOrderService orderService,
    ICache cache,
    ICacheMeter cacheMeter) : IOrderService
{
    public async Task<IReadOnlyCollection<EnrichedOrder>> Get(
        UserId userId,
        CancellationToken cancellationToken)
    {
        var (hit, userOrders) = await cache.Get<IReadOnlyCollection<EnrichedOrder>>(
            userId.ToString(),
            cancellationToken);
        if (hit)
        {
            cacheMeter.IncrementHits("UserOrders");
            return userOrders;
        }

        cacheMeter.IncrementMisses("UserOrders");
        var enrichedOrders = await orderService.Get(userId, cancellationToken);

        // Не забываем наполнить кеш данными.
        await cache.Add(userId.ToString(), enrichedOrders, cancellationToken);
        return enrichedOrders;
    }
}
```

В описанном выше псевдокоде нет контроля по времени жизни объектов в кеше (я его хитро опустил, упомянув при этом ранее), но даже без него размер логики, которая «уезжает» в декоратор, уже значителен. Представьте, если бы эта часть кода была в основном компоненте?

Можно также заниматься кешированием конкретных заказов, никто не мешает написать нам этот код. А если вернуться к идее кеширования информации о товарах, то логика станет еще более нагруженной, если начать запрашивать множество товаров (например, команда `MGET` в Redis), и обогащение и инвалидацию кешей нужно будет делать в более умном режиме (часть значений есть в кеше, а другая часть отсутствует). Но это уже история, которая тянет на отдельную статью.

### Логи {#logging}

В некоторых случаях сервисам необходимо писать много логов в рамках одного запроса, не ограничиваясь сухими request и response. Чтобы иметь определенные значения во всех логируемых сообщениях, мы можем воспользоваться logger scope, сделав аналогичный декоратор, например, для нашего `IOrderService`.

```csharp
internal sealed class OrderServiceLogger(
    IOrderService orderService,
    ILogger<OrderServiceLogger> logger) : IOrderService
{
    public async Task<EnrichedOrder> Get(
        OrderId orderId,
        CancellationToken cancellationToken)
    {
        using var _ = logger.BeginScope(
            new Dictionary<string, object>
            {
                ["order_id"] = orderId.ToString()
            });
        return await orderService.Get(orderId, cancellationToken);
    }

    public async Task<IReadOnlyCollection<EnrichedOrder>> Get(
        UserId userId,
        CancellationToken cancellationToken)
    {
        using var _ = logger.BeginScope(
            new Dictionary<string, object>
            {
                ["user_id"] = userId.ToString()
            });
        return await orderService.Get(userId, cancellationToken);
    }
}
```

Здесь полезность может быть не такой очевидной, но если вы активно пользуетесь структурируемыми логами и хотите повысить «наблюдаемость» сервиса, описанный паттерн вполне себе подходит.

### Трейсинг {#tracing}

Думаю, суть вы уловили. Реализация делается аналогично, и мы можем создавать декораторы, которые отвечали бы за создание отдельных span'ов, детализируя trace всего запроса. Давайте для примера обернем один из методов репозитория.

```csharp
internal sealed class RepositoryTracer(
    IRepository repository,
    ITracer tracer) : IRepository
{
    public async Task<Order> Get(
        OrderId orderId,
        CancellationToken cancellationToken)
    {
        using var _ = tracer.BuildSpan("Repository.Get").StartActive();
        return await repository.Get(orderId, cancellationToken);
    }

    // ...
}
```

Так ли это необходимо? Каждый решает для себя самостоятельно, но я такой подход люблю, он тоже улучшает прозрачность работы и кода, и сервиса в целом.

### Регистрация {#registration}

Остается один важный нюанс — последовательность регистрации декораторов. Когда декоратор в единственном экземпляре, проблема отсутствует, но когда их становится больше, то появляется необходимость подумать, в какой последовательности стоит запускать код. Матрешка, не иначе.

```csharp
services.AddSingleton<IRepository, Repository>();
// Внутренний слой декорации 👇
services.Decorate<IRepository, RepositoryMeter>();
// Внешний слой декорации 👇 Трейсы будут первее метрик
services.Decorate<IRepository, RepositoryTracer>();
```

В случае, если в декораторах код синхронный, а значит выполняется моментально, последовательность не критична. Но как только в этот «пайплайн» добавляется любой IO, как это было в примере с кешом, то порядок запуска будет влиять крайне сильно. Дабы не запутаться, лучше следовать правилу хорошего тона — _не размещать регистрацию декораторов в разных местах приложения_. Будьте аккуратны.

## Выводы {#conclusions}

Разменивая простоту кода на абстракции в виде декораторов, мы получаем разделение concern'ов, а такая игра стоит свеч. За эти несколько лет, которые я пользуюсь Scrutor, у меня сформировался вывод — паттерн может быть очень полезен. **Не всегда** и **не во всех случаях**, **но все же полезен**.

Область программирования переполнена субъективизмом, и это нормально. Все мы ищем свой стиль и понимание прекрасного, потому с выводами или предложениями данной статьи можно и нужно не соглашаться. Но я крайне рекомендую попробовать описанный в статье подход, если вы страдаете от того, что в коде все перемешано, и хотите как-то исправить эту щекотливую ситуацию. 🤷
