---
title: Scrutor, or How to Decorate Any Component
date: 2024-11-04
description: How the Decorator pattern and the Scrutor library help separate business logic from technical concerns — metrics, tracing, logs, and caching.
tags: [decorator-pattern, dependency-injection, dotnet, design-patterns]
slug: "scrutor-or-how-to-decorate-anything"
---

## History {#history}

Many programmers at the start of their careers turn to the "Gang of Four" book to learn about design patterns. And many, myself included, after reading that book, start inventing the wheel and implementing these patterns left and right to "practice," "level up," and "prove to others that I know what I'm doing." Then come the stages of denial and depression about how these patterns aren't so useful after all. This is especially pronounced when .NET programmers encounter modern approaches to writing code. If this story resonates with you, welcome to the article.

## More Than Just Decorators {#more-than-just-decorators}

One might mistakenly think that in the first paragraph I'm leading toward the conclusion that patterns aren't needed. Not at all! They are needed, used constantly, but their implementation has long gone beyond how Erich Gamma, Richard Helm, Ralph Johnson, and John Vlissides described them.

- Singleton is actively used in the aforementioned DI.
- Builder often finds its place in unit tests when creating test objects.
- Factory method can often be seen when creating domain entities.
- Mediator can be seen in one well-known library.
- And the list goes on.

It's not always obvious what's a pattern and what's an anti-pattern, but if you look closely, you can find a lot of interesting things. In this article, I want to share these observations and tell you how we found an application for the Decorator pattern.

## Challenges {#challenges}

When I first started working on one of the in-house systems at Ozon Tech, code was written rather crudely and without much thought about what it would become a year or two later. This was due to high development pace (startup-like) and low loads (the system was still taking shape and wasn't heavily used yet). As the load grew along with the system, the code became more convoluted. Technical things got mixed with business logic, and back in 2020 we started thinking about how to separate one from the other without turning the codebase into a big mess. We'll skip the architectural changes, decoupling of the distributed monolith, and the beginning of DDD application — I'll tell you about those separately.

The challenges we faced were:

- measuring the speed of individual components in the code, not just blindly estimating the broader "response time" metric;
- maintaining detailed tracing (individual operation spans, to be precise);
- increasing transparency of operations and adding context to logs;
- caching data and reducing latency.

All these points can be solved using the [Scrutor](https://github.com/khellang/Scrutor) library.

## Scrutor {#scrutor}

In a standard ASP.NET application, there's no getting away from Dependency Injection. Most components (with rare exceptions) are registered in the DI container, and manually decorating them isn't very convenient. Scrutor makes it possible to do this very cleanly.

Let's imagine we have a classic domain with ordering goods in an online store, where we know who ordered what and in what quantity.

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

This domain is described in a service that manages orders and stores information about them in a database. Classic stuff. The service can both manage entities, for example by changing the order status on delivery or cancellation, and provide information about a specific order or a list of orders for a user (remember the personal account and the order history).

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

Can we understand how fast our database is working? Of course we can. Nothing prevents the statistics collected by the database itself, but there are "special" cases:

- What if the order is very large?
- Maybe the customer is obsessed with shopping and spends their entire paycheck at the store, making their order list huge (and we need paging to pull all the data)?

We'd like some convenience, and that convenience could come from a graph with a histogram showing which methods are "flying" and which are "crawling." Let's write something like that, starting the implementation with a component responsible for recording metrics.

```csharp
public interface IMeter
{
    Observer ObserveMethod(string methodName);
}

internal sealed class Meter : IMeter
{
    // Here should be a constructor and metric creation, where we'll write the speed in ms.
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

To reduce code in the decorator, let's return an `IDisposable` observer that will record the metric when the method completes.

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

Let's decorate our repository and start measuring the speed of its work. Minimal new code.

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

All that's left is to register the decorator in the DI container, and voilà, everything works. We no longer worry about our repository metrics. Let's go build a graph by the 90th and 99th percentiles and track potential performance issues!

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

Did the code become more complex? **Undoubtedly**. Was it worth it? **Yes**. The code increases in the number of abstractions, and for someone not used to dealing with so many abstractions, the codebase can become more burdensome. But the increase in the so-called "cognitive cost of reasoning" might not be a major problem in the medium to long term. Once you get used to this style of decorating, understanding the architecture becomes less difficult, and the separation of technical concerns can play in your favor when the code in the decorated component grows. After all, we don't want to have a "wall of code," do we?

## More Examples {#more-examples}

### Caching {#caching}

Let's continue expanding our domain model. Let's go up a level and look at a component that collects data from the database and enriches it with data from other sources. We might face the need to:

- fetch attributes of ordered products (images and many other things) from the master system;
- data on delivery deadlines, which is the responsibility of the logistics service;
- any other information that for one reason or another we don't want to store in our service — it all depends on your imagination (and the service requirements if we're looking at a real system).

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

Let's imagine we have a component that retrieves this data, assembles it all together, and returns it to the user.

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

Information about products doesn't change often, and we want to retrieve attributes with enviable regularity. Another place for caching could be the user's order list. After all, even rich clients look at their order list more often than they make new orders.

Caching with a decorator is a perfect solution. There we can:

- control the lifetime of cached objects;
- write cache hit metrics (the classic _hit or miss_) to increase the overall observability of the service.

Let's sketch out a primitive interface. Let's treat this component as pseudocode, because the _details_ of the implementation aren't as important in this context.

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

And let's write a decorator for `IOrderService`. The example with Scrutor is relatively simple.

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

        // Don't forget to fill the cache with data.
        await cache.Add(userId.ToString(), enrichedOrders, cancellationToken);
        return enrichedOrders;
    }
}
```

In the pseudocode above, there's no control over the lifetime of objects in the cache (I cleverly omitted it while mentioning it earlier), but even without it, the amount of logic that "moves" to the decorator is already significant. Imagine if this part of the code was in the main component?

We could also do caching for specific orders, nothing prevents us from writing that code. And if we go back to the idea of caching product information, the logic would become even more burdened if we started requesting many products (for example, the `MGET` command in Redis), and enriching and invalidating caches would need to be done in a smarter way (some values are in the cache and others are missing). But that's already a story that deserves a separate article.

### Logging {#logging}

In some cases, services need to write many logs within a single request, not limited to just dry request and response logs. To have certain values in all logged messages, we can use logger scope by creating a similar decorator, for example, for our `IOrderService`.

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

The usefulness here might not be as obvious, but if you actively use structured logging and want to increase the "observability" of your service, the pattern described above is quite suitable.

### Tracing {#tracing}

I think you've got the idea. The implementation is done similarly, and we can create decorators that would be responsible for creating individual spans, detailing the trace of the entire request. Let's wrap one of the repository methods as an example.

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

Is this necessary? Everyone decides for themselves, but I like this approach — it also improves the transparency of both the code and the service as a whole.

### Registration {#registration}

There's one important nuance left — the order in which decorators are registered. When there's only one decorator, there's no problem, but when there are more, you need to think about the order in which the code should run. Like Russian nesting dolls.

```csharp
services.AddSingleton<IRepository, Repository>();
// Inner layer of decoration 👇
services.Decorate<IRepository, RepositoryMeter>();
// Outer layer of decoration 👇 Traces will come before metrics
services.Decorate<IRepository, RepositoryTracer>();
```

If the code in the decorators is synchronous and therefore executes instantly, the order is not critical. But as soon as any IO is added to this "pipeline," as was the case in the caching example, the order of execution will be extremely important. To avoid getting confused, it's better to follow a good practice — _don't place decorator registrations in different places in the application_. Be careful.

## Conclusions {#conclusions}

By trading code simplicity for abstractions in the form of decorators, we gain separation of concerns, and such a trade is worth it. Over the years I've been using Scrutor, I've formed the conclusion — the pattern can be very useful. **Not always** and **not in all cases**, **but still useful**.

Programming is full of subjectivity, and that's normal. We all seek our own style and understanding of beauty, so it's perfectly fine to disagree with the conclusions or suggestions in this article. But I highly recommend trying the approach described in the article if you suffer from code where everything is mixed together and want to somehow fix this tricky situation.
