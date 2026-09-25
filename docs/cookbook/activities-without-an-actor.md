# Activities Without an Actor

Record the user when a person acted, a named party when a system acted, and
no actor when nobody did.

<span id="headlines-by-actor-type"></span>

## Choosing an Actor

| The Act Was Performed by | The Actor Is | The Sentence |
|---|---|---|
| a user | the user | `:actor placed :object with :target` |
| a job, a command, an integration | a party, named | `:actor marked :object paid` |
| nobody | none | `:object expired at :target` |

<script setup>
import { scene } from '../.vitepress/theme/world'
const placed = scene.order
const { paid, expired } = scene.cookbook.actorless
</script>

<span id="the-default-actor"></span>

## Recording the Authenticated User

Without `by()`, Storyfeed resolves the logged-in user as the actor by default:

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

A job dispatched from an authenticated request already carries that user. A
job started from a console command or the scheduler has no logged-in user, so
its activity has no actor. Pass the user who acted with the event or job, and
assign it with `by()`:

```php memo="app/Events/OrderPlaced.php"
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
            ->to($this->order->shop);
    }
}
```

It records the same activity as the controller above.

## Recording a System Actor

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

To name one party for a whole job, see
[Sharing an Actor](/deeper/activity-scopes#sharing-an-actor).
A party can also fill [other roles](/deeper/parties#using-parties-in-other-roles).

<span id="recording-without-an-actor"></span>

## Recording No Actor

A scheduled command that expires unpaid orders acts for nobody:

```php memo="app/Console/Commands/ExpireOrders.php"
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

            Storyfeed::anonymous() // no actor, even inside Storyfeed::actor()
                ->action('expire', $order)
                ->to($order->shop)
                ->publish();
        }
    }
}
```

<FeedExample :items="[expired]" />

The `expire` headline leaves `:actor` out.
[Recording Anonymous Activities](/deeper/parties#recording-anonymous-activities)
covers every spelling of an anonymous activity, and
[Anonymous Headlines](/deeper/parties#anonymous-headlines) covers headlines
for activities with no actor.
