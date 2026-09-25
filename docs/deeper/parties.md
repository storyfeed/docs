# Parties & Anonymous Actors

## Introduction

<script setup>
import { orders, party, activity } from '../.vitepress/theme/samples'

const paid = activity({
  id: 'pt1', verb: 'pay', glyph: 'credit-card',
  published_at: '2026-08-14T14:32:00.000000Z',
  headline_template: ':actor marked :object paid',
  actor: party.service,
  object: orders.first,
})
</script>

An activity's actor doesn't have to be a user. It can be a **party**, such as
a payment provider, or **anonymous**.

|  | Means | In the Payload |
|---|---|---|
| **anonymous** | the actor is genuinely unknown | `actor: null` — actorless grammar or a renderer fallback |
| **party** | a named participant with no model in your app | an ordinary entity, `type: "storyfeed.party"`, real `label`, `url: null` |

<a id="parties"></a>

## Recording a Party

::: code-group
```php [Fluent Syntax]
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

        $party = Storyfeed::party('Stripe');

        Storyfeed::activity()
            ->by($party)
            ->action('pay', $order)
            ->publish();

        return response()->noContent();
    }
}
```

```php [Named Arguments]
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

        $party = Storyfeed::party('Stripe');

        Storyfeed::record(
            verb: 'pay',
            object: $order,
            actor: $party,
        );

        return response()->noContent();
    }
}
```
:::

<FeedExample context :items="[paid]" />

### Using Parties in Other Roles

A party can fill any role, not only the actor:

::: code-group
```php [Fluent Syntax]
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
            ->to(Storyfeed::party('Front desk'))
            ->publish();

        return back();
    }
}
```

```php [Named Arguments]
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
            target: Storyfeed::party('Front desk'),
        );

        return back();
    }
}
```
:::

`party()` finds or creates the party by name.

<a id="declaring-parties"></a>

## Declaring Party Names

A name given to `Storyfeed::actor()`, or to a verb's own `->actor()`, may come
from outside your code. Declare the names an actor may take:

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;

Storyfeed::parties(['Stripe', 'Paddle', 'System']);
```

Once a list is declared, a name outside it:

| Environment | An Undeclared Name |
|---|---|
| `local`, `testing` | throws `UndeclaredParty`, naming the call and the list |
| everywhere else | is ignored: the activity keeps the actor it would have had without the name, and `storyfeed:doctor` reports it |

With no list, any name becomes a party. Names match as party keys do, so
`'Stripe'` and `'stripe'` are one party. `parties.strict` in
`config/storyfeed.php` sets whether an undeclared name throws; `null` throws in
`local` and `testing` only.

<a id="app-wide-fallbacks"></a>

## Setting a Default Actor

```php
// config/storyfeed.php
'parties' => [
    // e.g. 'System' — a name for otherwise-anonymous publishes
    'fallback' => null,
],

// an invokable class; null = the authenticated user
'actor_resolver' => null,
```

With no fallback, an activity with no user is anonymous.

## Recording Anonymous Activities

Use `->anonymously()` to record an activity without an actor, even when a scope
or default supplies one. Omitting the actor lets those defaults apply. See
[Activities Without an Actor](/cookbook/activities-without-an-actor) for a full
recording example.

<a id="actorless-voice"></a>

### Anonymous Headlines

```php
// routes/feed.php
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
<a id="scoped-attribution"></a>

## Sharing an Actor

Use `Storyfeed::actor($party, $callback)` to supply an actor to every activity
published inside a callback. A declared party name such as `System` also works.
[Activity Scopes](/deeper/activity-scopes#sharing-an-actor) covers the callback,
its lifecycle and role precedence.
