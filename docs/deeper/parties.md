# Parties & Anonymous Actors

## Introduction

An activity's actor doesn't have to be a user. It can be a **party**, such as
a payment provider, or **anonymous**.

<script setup>
import { scene } from '../.vitepress/theme/world'
const paid = scene.deeper.latestPerObject.timeline.find(row => row.verb === 'pay')
const { anonymous } = scene.cookbook.actorless
</script>

|  | Means | In the Payload |
|---|---|---|
| **anonymous** | the actor is genuinely unknown | `actor: null`; the headline uses the [anonymous headline](#anonymous-headlines) |
| **party** | a named participant with no model in your app | an ordinary entity, `type: "storyfeed.party"`, real `label`, `url: null` |

<a id="parties"></a>

## Recording a Party

A string in any role names a party. Give the actor's name to `by()`:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/StripeWebhookController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Storyfeed\Facades\Storyfeed;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $order = Order::where('payment_intent', $request->input('data.object.id'))
            ->firstOrFail();

        $order->update(['paid_at' => now()]);

        Storyfeed::activity()
            ->by('Stripe')
            ->action('pay', $order)
            ->publish();

        return response()->noContent();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/StripeWebhookController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Storyfeed\Facades\Storyfeed;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $order = Order::where('payment_intent', $request->input('data.object.id'))
            ->firstOrFail();

        $order->update(['paid_at' => now()]);

        Storyfeed::record(
            verb: 'pay',
            object: $order,
            actor: 'Stripe',
        );

        return response()->noContent();
    }
}
```
:::

<FeedExample :items="[paid]" />

The first activity with a name creates its party; later ones reuse it.

### Using Parties in Other Roles

A party can fill any role, not only the actor:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/DispatchOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class DispatchOrderController extends Controller
{
    public function __invoke(Order $order): RedirectResponse
    {
        $order->update(['dispatched_at' => now()]);

        Storyfeed::activity()
            ->action('dispatch', $order)
            ->to('Front desk')
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/DispatchOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class DispatchOrderController extends Controller
{
    public function __invoke(Order $order): RedirectResponse
    {
        $order->update(['dispatched_at' => now()]);

        Storyfeed::record(
            verb: 'dispatch',
            object: $order,
            target: 'Front desk',
        );

        return back();
    }
}
```
:::

`Storyfeed::party('Front desk')` returns the party's model, finding or creating
it by name, for code that needs the model rather than its name.

<a id="declaring-parties"></a>

## Declaring Party Names

Each distinct name is its own party, so a misspelt `'Strpie'` records a second
party beside `'Stripe'`. Declare the names an actor may take:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::parties(['Stripe', 'Paddle', 'System']);
```

Once a list is declared, a name outside it:

| Environment | An Undeclared Name |
|---|---|
| `local`, `testing` | throws `UndeclaredParty`, naming the call and the list |
| everywhere else | is ignored: the activity keeps the actor it would have had without the name, and `storyfeed:doctor` reports it |

The list applies to names given to
[`Storyfeed::actor()`](/deeper/activity-scopes#sharing-an-actor) and to a
[verb's own `->actor()`](/deeper/stories#request-based-actors); `->by()` does
not check it. With no list, any name becomes a party. Names match by their
slug, so `'Stripe'` and `'stripe'` are one party. `parties.strict` in
`config/storyfeed.php` sets whether an undeclared name throws; `null` throws in
`local` and `testing` only.

<a id="app-wide-fallbacks"></a>

## Setting a Default Actor

```php memo="config/storyfeed.php"
'parties' => [
    // e.g. 'System' — a name for otherwise-anonymous publishes
    'fallback' => null,
],
```

With no fallback, an activity with no user is anonymous.

<a id="resolving-the-default-actor"></a>

### Resolving the Default Actor

By default, an activity published without an actor records the authenticated
user. When your app authenticates with another guard, set `actor_resolver` to
an invokable class that returns the actor:

```php memo="app/Support/ResolveFeedActor.php"
<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ResolveFeedActor
{
    public function __invoke(): ?Model
    {
        return Auth::guard('admin')->user() ?? Auth::user();
    }
}
```

```php memo="config/storyfeed.php"
'actor_resolver' => App\Support\ResolveFeedActor::class,
```

When the resolver returns `null`, the fallback party applies.

## Recording Anonymous Activities

Omitting the actor lets the authenticated user, a scope or a default apply.
To record an activity with no actor, even in an authenticated request, pass
`null` to `by()`:

```php memo="app/Http/Controllers/OrderController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlaceOrderRequest;
use App\Models\Shop;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class OrderController extends Controller
{
    public function store(
        PlaceOrderRequest $request,
        Shop $shop,
    ): RedirectResponse {
        $order = $shop->orders()->create($request->validated());

        $knownAuthor = $request->boolean('anonymous') ? null : $request->user();

        Storyfeed::activity()
            ->by($knownAuthor) // User|null: null means anonymous
            ->action('place', $order)
            ->to($shop)
            ->publish();

        return to_route('orders.show', $order);
    }
}
```

<FeedExample :items="[anonymous]" />

| Spelling | Actor |
|---|---|
| omit `by()` | resolved from the request |
| `->by(null)` or `->actor(null)` | anonymous |
| `->anonymously()` | anonymous, on an existing builder |
| `Storyfeed::anonymous()` | anonymous, from the start |
| `Storyfeed::record(..., anonymous: true)` | anonymous; supplying a non-null `actor:` too throws |

`Storyfeed::record(..., actor: null)` still records the logged-in user. Use
`anonymous: true` for explicit anonymity with named arguments.

<a id="actorless-voice"></a>

### Anonymous Headlines

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('confirm')
    ->headline(':actor confirmed :object')
    ->anonymousHeadline(':object was confirmed');
```

An activity recorded with no actor uses the anonymous headline. A party uses
the ordinary headline. The anonymous template cannot contain `:actor`.
A closure works as in
[The Feed File](/basics/the-feed-file#choosing-a-headline-per-activity).

A verb that never has an actor, such as one recorded by a scheduled command,
can leave `:actor` out of its headline:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('expire')
    ->headline(':object expired at :target');
```

Leaving `:actor` out of a headline only changes the sentence. A stored actor
stays stored.
