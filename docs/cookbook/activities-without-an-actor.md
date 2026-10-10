# Activities Without an Actor

<script setup>
import { scene } from '../.vitepress/theme/world'
const placed = scene.order
const { paid, expired } = scene.cookbook.actorless
</script>

Use the user as actor for a person's action and a named party for a system's
action. An anonymous activity has no recorded actor: who acted is unknown,
including when you deliberately use `Storyfeed::anonymous()` or `by(null)`.

<span id="headlines-by-actor-type"></span>

## Choosing an Actor

| Event | Actor | Headline |
|---|---|---|
| a user places an order | the user | `:actor placed :object with :target` |
| a job, command, or integration marks an order paid | a named party | `:actor marked :object paid` |
| an order expires without a recorded actor | none | `:object expired at :target` |

<span id="the-default-actor"></span>

## Recording the Authenticated User

If you omit `by()`, Storyfeed uses the authenticated user by default:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/OrderController.php"
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

        Storyfeed::activity()
            ->action('place', $order)
            ->to($shop)
            ->publish();

        return to_route('orders.show', $order);
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/OrderController.php"
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

        Storyfeed::record(
            verb: 'place',
            object: $order,
            target: $shop,
        );

        return to_route('orders.show', $order);
    }
}
```
:::

<FeedExample :items="[placed]" />

## Preserving an Actor in Background Work

A job dispatched from an authenticated request publishes as that user. A job
started by a console command or the scheduler has no authenticated user. To
record the person who acted, pass that user to the job and call `by()`:

::: code-group
```php [Fluent Syntax] memo="app/Jobs/PlaceOrder.php"
<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Storyfeed\Facades\Storyfeed;

class PlaceOrder implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order, public User $customer) {}

    public function handle(): void
    {
        $this->order->update(['status' => 'placed']);

        Storyfeed::activity()
            ->by($this->customer) // the actor travels with the job
            ->action('place', $this->order)
            ->to($this->order->shop)
            ->publish();
    }
}
```

```php [Named Arguments] memo="app/Jobs/PlaceOrder.php"
<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Storyfeed\Facades\Storyfeed;

class PlaceOrder implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order, public User $customer) {}

    public function handle(): void
    {
        $this->order->update(['status' => 'placed']);

        Storyfeed::record(
            verb: 'place',
            object: $this->order,
            actor: $this->customer, // the actor travels with the job
            target: $this->order->shop,
        );
    }
}
```
:::

<FeedExample :items="[placed]" />

See [Carrying Roles Into Queued Jobs](/deeper/activity-scopes#carrying-roles-into-queued-jobs)
for the user and scopes a queued job inherits.

## Recording a System Actor

Pass a string to `by()` to record a named party, such as the payment service
that confirmed the payment:

::: code-group
```php [Fluent Syntax] memo="app/Jobs/MarkOrderPaid.php"
<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Storyfeed\Facades\Storyfeed;

class MarkOrderPaid implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order) {}

    public function handle(): void
    {
        $this->order->update(['status' => 'paid']);

        Storyfeed::activity()
            ->by('Stripe')
            ->action('pay', $this->order)
            ->publish();
    }
}
```

```php [Named Arguments] memo="app/Jobs/MarkOrderPaid.php"
<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Storyfeed\Facades\Storyfeed;

class MarkOrderPaid implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order) {}

    public function handle(): void
    {
        $this->order->update(['status' => 'paid']);

        Storyfeed::record(
            verb: 'pay',
            object: $this->order,
            actor: 'Stripe',
        );
    }
}
```
:::

Define the headline for the verb:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('pay')
    ->headline(':actor marked :object paid');
```

<FeedExample :items="[paid]" />

See [Publishing From Events](/deeper/events) for the complete webhook or
[Sharing an Actor](/deeper/activity-scopes#sharing-an-actor) to use one party
throughout a job. Parties can also fill
[other roles](/deeper/parties#using-parties-in-other-roles).

<span id="recording-without-an-actor"></span>

## Recording No Actor

This scheduled command expires unpaid orders without recording an actor.
Call `Storyfeed::anonymous()` to make that choice explicit:

```php memo="app/Console/Commands/ExpireUnpaidOrders.php"
<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Storyfeed\Facades\Storyfeed;

class ExpireUnpaidOrders extends Command
{
    protected $signature = 'orders:expire';

    protected $description = 'Expire orders that were not paid within a day';

    public function handle(): void
    {
        Order::query()
            ->where('status', 'placed')
            ->where('created_at', '<', now()->subDay())
            ->each(function (Order $order) {
                $order->update(['status' => 'expired']);

                Storyfeed::anonymous() // no actor, even inside Storyfeed::actor()
                    ->action('expire', $order)
                    ->to($order->shop)
                    ->publish();
            });
    }
}
```

Define a headline that omits `:actor`:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('expire')
    ->headline(':object expired at :target');
```

<FeedExample :items="[expired]" />

See
[Recording Anonymous Activities](/deeper/parties#recording-anonymous-activities)
for the available APIs and [Anonymous Headlines](/deeper/parties#anonymous-headlines)
for wording when no actor is recorded.

For message delivery, bounces, spam complaints and send failures, see
[Recording Email Lifecycle Events](/cookbook/email-lifecycle-events).
