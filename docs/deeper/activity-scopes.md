# Activity Scopes

`Storyfeed::context()` supplies the context for activities published inside a callback.
HTTP middleware can supply that context or an actor for a request.

<script setup>
import { activity, scenes, where } from '../.vitepress/theme/samples'
const scoped = { ...activity({ ...scenes.order, target: null, context: where.kitchen,
  headline_template: ':actor placed :object in :context' }), data: null, glyph_intent: null }
</script>

## Setting Context on an Activity

::: code-group
```php [Fluent Syntax]
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

        Storyfeed::activity()
            ->by($request->user())
            ->action('place', $order)
            ->context($order->kitchen)
            ->publish();

        return to_route('orders.show', $order);
    }
}
```

```php [Named Arguments]
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

        Storyfeed::record(
            verb: 'place',
            object: $order,
            actor: $request->user(),
            context: $order->kitchen,
        );

        return to_route('orders.show', $order);
    }
}
```
:::

With `:actor placed :object in :context` declared as the headline:

<FeedExample :items="[scoped]" expanded />

`context` is the activity's wider setting. It is separate from `target`;
`->to()` and `->in()` set the target. [Containers & Context](/deeper/context)
explains those roles.

## Sharing Context Within a Callback

::: code-group
```php [Fluent Syntax]
// app/Http/Controllers/PlaceOrderController.php, __invoke()
use Storyfeed\Facades\Storyfeed;

Storyfeed::context($order->kitchen, function () use ($request, $order) {
    Storyfeed::activity()
        ->by($request->user())
        ->action('place', $order)
        ->publish();
});
```

```php [Named Arguments]
// app/Http/Controllers/PlaceOrderController.php, __invoke()
use Storyfeed\Facades\Storyfeed;

Storyfeed::context($order->kitchen, function () use ($request, $order) {
    Storyfeed::record(
        verb: 'place',
        object: $order,
        actor: $request->user(),
    );
});
```
:::

<FeedExample :items="[scoped]" expanded />

Every activity published inside the callback inherits the context, including
activities published by methods the callback calls. An explicit context on an
activity wins. Nested callbacks use the innermost context; leaving a callback
restores the previous one, even when it throws.

The scope accepts an Eloquent model or a declared party name and returns the
callback's result. Without a callback, `Storyfeed::context($model)` returns an
activity builder with that context set.

Jobs dispatched inside the scope carry its context to the worker. The context
is resolved from its identity there. The worker restores its previous scope
after the job.

## Setting Context From a Route

```php
// routes/web.php
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
```php [Fluent Syntax]
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

```php [Named Arguments]
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

## Setting a Route's Actor

```php
// routes/web.php
use App\Http\Controllers\PlaceOrderController;
use Illuminate\Support\Facades\Route;

Route::post('/kitchens/{kitchen}/orders/{order}/place', PlaceOrderController::class)
    ->scopeBindings()
    ->middleware(['auth', 'storyfeed.context:kitchen', 'storyfeed.as:System']);
```

`storyfeed.as:System` wraps the request in `Storyfeed::as('System', ...)`.
Declare that [party](/deeper/parties#declaring-parties) in your service provider.
The explicit `->by($request->user())` in the controller still wins; activities
without an explicit actor inherit `System`.

## Actor and Context Precedence

| Priority | Actor | Context |
|---|---|---|
| Call site | `->by($user)` or explicit anonymity | `->context($model)` |
| Scope | `Storyfeed::as()` or `storyfeed.as:{Party}` | `Storyfeed::context()` or `storyfeed.context:{param}` |
| Story middleware | supplies an actor when `hasActor()` is false | supplies context when `has('context')` is false |
| Defaults | the verb's actor; otherwise a custom resolver (or authenticated user when no resolver is set), then the fallback party | none |

Explicit anonymity keeps the actor empty. Without any context supplied, the
context stays empty.
