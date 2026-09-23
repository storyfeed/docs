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
        $order = Order::where('payment_intent', $request->input('data.object.id'))->firstOrFail();

        $order->update(['paid_at' => now()]);

        $party = Storyfeed::party('Stripe'); // [!code focus]

        Storyfeed::activity() // [!code focus]
            ->by($party) // [!code focus]
            ->action('pay', $order) // [!code focus]
            ->publish(); // [!code focus]

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
        $order = Order::where('payment_intent', $request->input('data.object.id'))->firstOrFail();

        $order->update(['paid_at' => now()]);

        $party = Storyfeed::party('Stripe'); // [!code focus]

        Storyfeed::record( // [!code focus]
            verb: 'pay', // [!code focus]
            object: $order, // [!code focus]
            actor: $party, // [!code focus]
        ); // [!code focus]

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

        Storyfeed::activity() // [!code focus]
            ->action('dispatch', $order) // [!code focus]
            ->to(Storyfeed::party('Front desk')) // [!code focus]
            ->publish(); // [!code focus]

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

        Storyfeed::record( // [!code focus]
            verb: 'dispatch', // [!code focus]
            object: $order, // [!code focus]
            target: Storyfeed::party('Front desk'), // [!code focus]
        ); // [!code focus]

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
        Storyfeed::as('System', function () { // [!code focus]
            Order::whereNull('paid_at')->where('created_at', '<', now()->subDay())->each(function (Order $order) {
                $order->update(['cancelled_at' => now()]);

                Storyfeed::activity() // [!code focus]
                    ->action('cancel', $order) // [!code focus]
                    ->publish(); // [!code focus]
            });
        }); // [!code focus]
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
        Storyfeed::as('System', function () { // [!code focus]
            Order::whereNull('paid_at')->where('created_at', '<', now()->subDay())->each(function (Order $order) {
                $order->update(['cancelled_at' => now()]);

                Storyfeed::record( // [!code focus]
                    verb: 'cancel', // [!code focus]
                    object: $order, // [!code focus]
                ); // [!code focus]
            });
        }); // [!code focus]
    }
}
```
:::

Pass a name for a party, or a model. An explicit `->by()` inside the block
still wins.

## App-wide Fallbacks

```php
// config/storyfeed.php
'parties' => [
    'fallback' => null,      // e.g. 'System' — a name for otherwise-anonymous publishes
],

'actor_resolver' => null,    // an invokable class; null = the authenticated user
```

With no fallback, an activity with no user is anonymous.

## Actorless Voice

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::actorlessGrammar([
    'confirm' => ':object was confirmed', // exact verb, not objectType.verb
]);
```

An activity recorded with no actor uses this template when one matches. A
party still uses the ordinary grammar.

Keys are exact verbs, with no wildcards. A template can't contain `:actor`. A
closure works as in [Grammar](/deeper/grammar).
