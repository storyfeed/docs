# Activity Scopes

## Introduction

`Storyfeed::actor()` and `Storyfeed::context()` supply a default actor or
[context](/deeper/context) to every activity published inside a callback.
HTTP middleware can supply either role for a whole request.

<script setup>
import { activity, scene, role } from '../.vitepress/theme/world'
const scoped = { ...activity({ ...scene.order, target: null, context: role.shop,
  headline_template: ':actor placed :object in :context' }), data: null, glyph_intent: null }
</script>

<a id="setting-context-on-an-activity"></a>

## Sharing Roles Within a Callback

<a id="sharing-context-within-a-callback"></a>

### Sharing Context

::: code-group
```php [Fluent Syntax]
Storyfeed::context($order->shop, function () use ($request, $order) { // [!code highlight]
    Storyfeed::activity()
        ->by($request->user())
        ->action('place', $order)
        ->publish();
});
```

```php [Named Arguments]
Storyfeed::context($order->shop, function () use ($request, $order) { // [!code highlight]
    Storyfeed::record(
        verb: 'place',
        object: $order,
        actor: $request->user(),
    );
});
```
:::

With `:actor placed :object in :context` declared as the headline:

<FeedExample :items="[scoped]" expanded />

Every activity published inside the callback inherits the context, including
activities published by methods the callback calls.

The scope accepts an Eloquent model or a declared party name and returns the
callback's result. Without a callback, `Storyfeed::context($model)` returns an
activity builder with that context set.

<a id="sharing-an-actor-within-a-callback"></a>

### Sharing an Actor

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/PlaceOrderController.php" at="__invoke()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::actor($request->user(), function () use ($order) {
    Storyfeed::activity()
        ->action('place', $order)
        ->context($order->shop)
        ->publish();
});
```

```php [Named Arguments] memo="app/Http/Controllers/PlaceOrderController.php" at="__invoke()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::actor($request->user(), function () use ($order) {
    Storyfeed::record(
        verb: 'place',
        object: $order,
        context: $order->shop,
    );
});
```
:::

<FeedExample :items="[scoped]" expanded />

The `actor` method accepts an Eloquent model or declared party name and returns
the callback's result. Without a callback, `Storyfeed::actor($user)` returns an
activity builder with that actor set.

### Nested Scopes

Nested callbacks use the innermost actor or context. The previous scope is
restored when the callback ends, including when it throws an exception.

## Sharing Roles Within an HTTP Request

<a id="setting-context-from-a-route"></a>

### Context From Route Parameters

```php memo="routes/web.php"
use App\Http\Controllers\PlaceOrderController;
use Illuminate\Support\Facades\Route;

Route::post('/shops/{shop}/orders/{order}/place', PlaceOrderController::class)
    ->middleware(['auth', 'storyfeed.context:shop']);
```

The `storyfeed.context:shop` middleware uses the bound `shop` route parameter.
It must be an Eloquent model; missing or unbound values throw an exception.
For implicit binding, type-hint the parameter in the controller:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/PlaceOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PlaceOrderController extends Controller
{
    public function __invoke(Request $request, Shop $shop, Order $order): RedirectResponse
    {
        $order->update(['status' => 'placed']);

        Storyfeed::activity()->by($request->user())->action('place', $order)->publish();

        return to_route('orders.show', $order);
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/PlaceOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PlaceOrderController extends Controller
{
    public function __invoke(Request $request, Shop $shop, Order $order): RedirectResponse
    {
        $order->update(['status' => 'placed']);

        Storyfeed::record(
            verb: 'place',
            object: $order,
            actor: $request->user(),
        );

        return to_route('orders.show', $order);
    }
}
```
:::

<FeedExample :items="[scoped]" expanded />

The middleware supplies the context to every activity published in this request.

<a id="setting-a-route-s-actor"></a>

### Declared Party Actors

```php memo="routes/web.php"
use App\Http\Controllers\PlaceOrderController;
use Illuminate\Support\Facades\Route;

Route::post('/shops/{shop}/orders/{order}/place', PlaceOrderController::class)
    ->middleware(['auth', 'storyfeed.context:shop', 'storyfeed.actor:System']);
```

The `storyfeed.actor:System` middleware wraps the request in
`Storyfeed::actor('System', ...)`. Declare the
[party](/deeper/parties#declaring-parties) in your service provider.
An explicit `->by($request->user())` takes precedence; activities without an
explicit actor use `System`.

<a id="actor-and-context-precedence"></a>

## Role Precedence

Storyfeed resolves each role from the first applicable source:

| Priority | Actor | Context |
|---|---|---|
| Call site | `->by($user)` or explicit anonymity | `->context($model)` |
| Scope | `Storyfeed::actor()` or `storyfeed.actor:{Party}`, including a scope carried into a queued job | `Storyfeed::context()` or `storyfeed.context:{param}`, including a scope carried into a queued job |
| [Story middleware](/deeper/story-middleware-and-batching) | supplies an actor when `hasActor()` is false | supplies context when `has('context')` is false |
| Verb | the [verb's actor](/deeper/stories#request-based-actors) | none |
| Resolver or user | a custom [`actor_resolver`](/deeper/parties#resolving-the-default-actor); without one, the authenticated user, or in a queued job the user authenticated at dispatch | none |
| Fallback | [`parties.fallback`](/deeper/parties#setting-a-default-actor) | none |

A custom resolver replaces the authenticated user as a source. If it returns
`null`, the fallback party applies. Explicit anonymity records no actor.
Without a resolved actor, the activity is anonymous and cannot join a
[batch](/deeper/story-middleware-and-batching#batch-windows). If no context is
supplied, that role remains empty.

<a id="passing-scopes-to-queued-jobs"></a>

## Carrying Roles Into Queued Jobs

<a id="carrying-actors-and-context"></a>

### The Authenticated User

A job dispatched during a request publishes as the request's authenticated
user, even though the worker has no logged-in user. Jobs dispatched from that
job inherit the same user.

<a id="scoped-actors"></a>

### Actor Scopes

A job dispatched inside `Storyfeed::actor()` runs as that actor on the worker:

```php
Storyfeed::actor('System', fn () => SyncMenu::dispatch());
```

Activities published by the job use the `System` party unless they specify an
actor. Jobs it dispatches inherit the scope, which ends when the job completes
or throws an exception. A job dispatched with `->afterResponse()` runs after
the scope closes, so it does not carry the actor.

<a id="scoped-context"></a>

### Context Scopes

Jobs dispatched inside `Storyfeed::context()` run inside that context on the
worker, and jobs they dispatch inherit it. The scope ends with the job, even
when the job throws.

<a id="request-based-actors"></a>

### Request-Based Actors

Jobs dispatched during a request carry the actor selected by the
[request-based verb actor](/deeper/stories#request-based-actors).
