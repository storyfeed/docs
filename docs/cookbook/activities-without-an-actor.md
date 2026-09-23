# Activities Without an Actor

Record the user when a person acted, a named party when a system acted, and
no actor when nobody did.

```php
<?php

namespace App\Events;

use App\Models\Order;
use App\Models\User;
use Storyfeed\Contracts\PublishesToFeed;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\PendingActivity;

class OrderPlaced implements PublishesToFeed
{
    public function __construct(public Order $order, public User $customer) {}

    public function toFeedActivity(): ?PendingActivity
    {
        return Storyfeed::activity()
            ->by($this->customer) // the actor travels on the event
            ->action('place', $this->order)
            ->to($this->order->kitchen);
    }
}
```

<script setup>
import { who, where, orders, party, activity } from '../.vitepress/theme/samples'

const placed = activity({
  id: 'ck6a', verb: 'place', glyph: 'shopping-bag',
  published_at: '2026-08-14T15:02:00.000000Z',
  headline_template: ':actor placed :object with :target',
  actor: who.regular, object: orders.first, target: where.kitchen,
})

const anonymous = activity({
  id: 'ck6b', verb: 'place', glyph: 'shopping-bag',
  published_at: '2026-08-14T15:02:00.000000Z',
  headline_template: ':actor placed :object with :target',
  actor: null, object: orders.first, target: where.kitchen,
})

const paid = activity({
  id: 'ck6c', verb: 'pay', glyph: 'credit-card',
  published_at: '2026-08-14T16:10:00.000000Z',
  headline_template: ':actor marked :object paid',
  actor: party.service, object: orders.second,
})

const expired = activity({
  id: 'ck6d', verb: 'expire', glyph: 'circle-x',
  published_at: '2026-08-21T00:00:00.000000Z',
  headline_template: ':object expired at :target',
  actor: null, object: orders.fifth, target: where.kitchen,
})
</script>

<FeedExample context :items="[placed]" />

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;

Storyfeed::verbs([
    'place' => ActivityType::Create,
    'pay' => ActivityType::Accept,
    'expire' => ActivityType::Remove,
]);

Storyfeed::grammar([
    'order.place' => ':actor placed :object with :target',
    'order.pay' => ':actor marked :object paid',
]);
```

## The Actor Read from the Request

Without `by()`, the actor is the logged-in user by default. A job started from
a console command or the scheduler has no logged-in user, so its actor is
`null`:

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Storyfeed\Facades\Storyfeed;

class RecordOrder implements ShouldQueue
{
    public function __construct(public Order $order) {}

    public function handle(): void
    {
        Storyfeed::activity()
            ->action('place', $this->order) // no by(), no user: the actor is null
            ->to($this->order->kitchen)
            ->publish();
    }
}
```

```php [Named Arguments]
<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Storyfeed\Facades\Storyfeed;

class RecordOrder implements ShouldQueue
{
    public function __construct(public Order $order) {}

    public function handle(): void
    {
        Storyfeed::record(
            verb: 'place',
            object: $this->order, // no actor:, no user: the actor is null
            target: $this->order->kitchen,
        );
    }
}
```
:::

<FeedExample :items="[anonymous]" />

To keep the author, pass the user into the job and call `->by()` with it, as
the event above does.

## An Explicitly Unknown Actor

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlaceOrderRequest;
use App\Models\Kitchen;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class OrderController extends Controller
{
    public function store(PlaceOrderRequest $request, Kitchen $kitchen): RedirectResponse
    {
        $order = $kitchen->orders()->create($request->validated());

        $knownAuthor = $request->boolean('anonymous') ? null : $request->user();

        Storyfeed::activity()
            ->by($knownAuthor) // User|null: null means anonymous
            ->action('place', $order)
            ->to($kitchen)
            ->publish();

        return to_route('orders.show', $order);
    }
}
```

| Spelling | Actor |
|---|---|
| omit `by()` | resolved from the request |
| `->by(null)` or `->actor(null)` | anonymous |
| `->anonymously()` | anonymous, on an existing builder |
| `Storyfeed::anonymous()` | anonymous, from the start |

`Storyfeed::record(..., actor: null)` still records the logged-in user. Use
one of the calls above instead.

## One Sentence per Kind of Actor

| The Act Was Performed by | The Actor Is | The Sentence |
|---|---|---|
| a user | the user | `:actor placed :object with :target` |
| a job, a command, an integration | a party, named | `:actor marked :object paid` |
| nobody | none | `:object expired at :target` |

## A System Is a Party

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

        Storyfeed::activity()
            ->by('Stripe')
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
        $order = Order::where('payment_intent', $request->input('data.object.id'))->firstOrFail();

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

To name the party once for a whole job, wrap it in `Storyfeed::as('System', …)`.
See [Scoped Attribution](/deeper/parties#scoped-attribution).

## No Actor at All

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;

Storyfeed::grammar([
    'order.expire' => ':object expired at :target',   // no :actor, on purpose
]);
```

```php
<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Storyfeed\Facades\Storyfeed;

class ExpireOrders extends Command
{
    protected $signature = 'orders:expire';

    public function handle(): void
    {
        $unpaid = Order::whereNull('paid_at')
            ->whereNull('expired_at')
            ->where('created_at', '<', now()->subWeek())
            ->get();

        foreach ($unpaid as $order) {
            $order->update(['expired_at' => now()]);

            Storyfeed::anonymous() // no actor, even inside Storyfeed::as()
                ->action('expire', $order)
                ->to($order->kitchen)
                ->publish();
        }
    }
}
```

<FeedExample :items="[expired]" />

Leaving `:actor` out of a headline only changes the sentence. A stored actor
stays stored.
