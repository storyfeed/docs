# Activity Scopes

## Introduction

`Storyfeed::actor()` and `Storyfeed::context()` supply their roles inside a callback.
HTTP middleware can supply either role for a request.

<script setup>
import { activity, scenes, where } from '../.vitepress/theme/samples'
const scoped = { ...activity({ ...scenes.order, target: null, context: where.kitchen,
  headline_template: ':actor placed :object in :context' }), data: null, glyph_intent: null }
</script>

<a id="setting-context-on-an-activity"></a>

The [context role](/deeper/context) records an activity's wider setting. Scopes
supply a default for that role or the actor across several publishes.

## Sharing Roles Within a Callback

<a id="sharing-context-within-a-callback"></a>

### Sharing Context

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/PlaceOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PlaceOrderController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update(['status' => 'placed']);

        Storyfeed::context($order->kitchen, function () use ($request, $order) {
            Storyfeed::activity()
                ->by($request->user())
                ->action('place', $order)
                ->publish();
        });

        return to_route('orders.show', $order);
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/PlaceOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PlaceOrderController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update(['status' => 'placed']);

        Storyfeed::context($order->kitchen, function () use ($request, $order) {
            Storyfeed::record(
                verb: 'place',
                object: $order,
                actor: $request->user(),
            );
        });

        return to_route('orders.show', $order);
    }
}
```
:::

With `:actor placed :object in :context` declared as the headline:

<FeedExample :items="[scoped]" expanded />

Every activity published inside the callback inherits the context, including
activities published by methods the callback calls. An explicit context on an
activity wins.

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
        ->context($order->kitchen)
        ->publish();
});
```

```php [Named Arguments] memo="app/Http/Controllers/PlaceOrderController.php" at="__invoke()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::actor($request->user(), function () use ($order) {
    Storyfeed::record(
        verb: 'place',
        object: $order,
        context: $order->kitchen,
    );
});
```
:::

<FeedExample :items="[scoped]" expanded />

`actor()` supplies the actor as `context()` supplies the context. Both accept
an Eloquent model or a declared party name and return the callback's result.
An explicit actor or explicit anonymity wins over the actor scope.

Without a callback, `Storyfeed::actor($user)` returns an activity builder with
that actor set. Jobs dispatched inside the callback carry its actor to the
worker; see [Queued Publishing](/deeper/queues#scoped-actors).

### Nested Scopes

Nested callbacks use the innermost actor or context. Leaving a callback
restores the previous scope, even when it throws. An explicit value on the
activity still takes precedence over the scope.

## Sharing Roles Within an HTTP Request

<a id="setting-context-from-a-route"></a>

### Context From Route Parameters

```php memo="routes/web.php"
use App\Http\Controllers\PlaceOrderController;
use Illuminate\Support\Facades\Route;

Route::post('/kitchens/{kitchen}/orders/{order}/place', PlaceOrderController::class)
    ->scopeBindings()
    ->middleware(['auth', 'storyfeed.context:kitchen']);
```

`storyfeed.context:kitchen` takes the bound `kitchen` route parameter.
The parameter must be an Eloquent model; a missing or unbound value throws.
Implicit binding needs the controller to receive that parameter:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/PlaceOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Kitchen;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PlaceOrderController extends Controller
{
    public function __invoke(Request $request, Kitchen $kitchen, Order $order): RedirectResponse
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

use App\Models\Kitchen;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PlaceOrderController extends Controller
{
    public function __invoke(Request $request, Kitchen $kitchen, Order $order): RedirectResponse
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

The `Kitchen` model needs an `orders()` relationship for the scoped binding.
The middleware supplies the context to every activity published in this request.

<a id="setting-a-route-s-actor"></a>

### Declared Party Actors

```php memo="routes/web.php"
use App\Http\Controllers\PlaceOrderController;
use Illuminate\Support\Facades\Route;

Route::post('/kitchens/{kitchen}/orders/{order}/place', PlaceOrderController::class)
    ->scopeBindings()
    ->middleware(['auth', 'storyfeed.context:kitchen', 'storyfeed.actor:System']);
```

`storyfeed.actor:System` wraps the request in `Storyfeed::actor('System', ...)`.
Declare that [party](/deeper/parties#declaring-parties) in your service provider.
The explicit `->by($request->user())` in the controller still wins; activities
without an explicit actor inherit `System`.

<a id="actor-and-context-precedence"></a>

## Role Precedence

| Priority | Actor | Context |
|---|---|---|
| Call site | `->by($user)` or explicit anonymity | `->context($model)` |
| Scope | `Storyfeed::actor()` or `storyfeed.actor:{Party}` | `Storyfeed::context()` or `storyfeed.context:{param}` |
| Story middleware | supplies an actor when `hasActor()` is false | supplies context when `has('context')` is false |
| Defaults | the verb's actor; otherwise a custom resolver (or authenticated user when no resolver is set), then the fallback party | none |

Explicit anonymity keeps the actor empty. Without any context supplied, the
context stays empty.

## Passing Scopes to Queued Jobs

Jobs dispatched inside an actor or context scope carry its identity to the
worker. [Queued Publishing](/deeper/queues#carrying-actors-and-context) covers
restoration, nested jobs and dispatch methods that run after the scope closes.
