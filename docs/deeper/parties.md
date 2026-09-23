# Parties & Anonymous Actors

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

## Parties

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

## Scoped Attribution

Inside a job or console command there is no authenticated user. Scope a block:

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Storyfeed\Facades\Storyfeed;

class CancelUnpaidOrders extends Command
{
    protected $signature = 'orders:cancel-unpaid';

    public function handle(): void
    {
        Storyfeed::as('System', function () {
            Order::whereNull('paid_at')
                ->where('created_at', '<', now()->subDay())
                ->each(function (Order $order) {
                    $order->update(['cancelled_at' => now()]);

                    Storyfeed::activity()
                        ->action('cancel', $order)
                        ->publish();
                });
        });
    }
}
```

```php [Named Arguments]
<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Storyfeed\Facades\Storyfeed;

class CancelUnpaidOrders extends Command
{
    protected $signature = 'orders:cancel-unpaid';

    public function handle(): void
    {
        Storyfeed::as('System', function () {
            Order::whereNull('paid_at')
                ->where('created_at', '<', now()->subDay())
                ->each(function (Order $order) {
                    $order->update(['cancelled_at' => now()]);

                    Storyfeed::record(
                        verb: 'cancel',
                        object: $order,
                    );
                });
        });
    }
}
```
:::

Pass a name for a party, or a model. An explicit `->by()` inside the block
still wins.

## Declaring Parties

A name given to `Storyfeed::as()`, or to a verb's own `->actor()`, may come
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

## App-wide Fallbacks

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

## Actorless Voice

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;

Storyfeed::actorlessGrammar([
    'order.confirm' => ':object was confirmed',
]);
```

An activity recorded with no actor uses this template when one matches. A
party still uses the ordinary grammar.

Keys are object type and verb, like the grammar's, and resolve most-specific
first: `order.confirm`, `order.*`, `*.confirm`, `*.*`. A key with no dot is a
verb on any type, so `'confirm'` means `*.confirm`. A template can't contain
`:actor`. A closure works as in
[The Feed File](/basics/the-feed-file#choosing-a-headline-per-activity).
