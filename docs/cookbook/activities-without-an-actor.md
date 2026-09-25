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

A job dispatched from an authenticated request already carries that user.
A job started from a console command or scheduler has no logged-in user.
Without an actor scope, resolver or fallback party, its actor is `null`:

::: code-group
```php [Fluent Syntax] memo="app/Jobs/RecordOrder.php"
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
            ->to($this->order->shop)
            ->publish();
    }
}
```

```php [Named Arguments] memo="app/Jobs/RecordOrder.php"
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
            target: $this->order->shop,
        );
    }
}
```
:::

<FeedExample :items="[anonymous]" />

To keep the author, pass the user into the job and call `->by()` with it, as
the event below does.

Pass the user who acted with the event or job, then assign that user with `by()`:

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

<script setup>
import { scene } from '../.vitepress/theme/world'
const placed = scene.order
const { anonymous, paid, expired } = scene.cookbook.actorless
</script>

<FeedExample :items="[placed]" />

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Storyfeed;

Storyfeed::verbs([
    'place' => ActivityType::Create,
    'pay' => ActivityType::Accept,
    'expire' => ActivityType::Remove,
]);
```

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target');

Story::for(Order::class)->verb('pay')
    ->headline(':actor marked :object paid');
```

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

To name the party once for a whole job, wrap it in `Storyfeed::actor('System', …)`.
See [Scoped Attribution](/deeper/parties#scoped-attribution).

## Recording Anonymous Activities

Use explicit anonymity when an activity must carry no actor, even in an authenticated request.

### Explicit Anonymity

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

| Spelling | Actor |
|---|---|
| omit `by()` | resolved from the request |
| `->by(null)` or `->actor(null)` | anonymous |
| `->anonymously()` | anonymous, on an existing builder |
| `Storyfeed::anonymous()` | anonymous, from the start |
| `Storyfeed::record(..., anonymous: true)` | anonymous; supplying a non-null `actor:` too throws |

`Storyfeed::record(..., actor: null)` still records the logged-in user. Use
`anonymous: true` for explicit anonymity with named arguments.

<span id="recording-without-an-actor"></span>

### Anonymous Headlines

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('expire')
    ->headline(':object expired at :target');
```

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

Leaving `:actor` out of a headline only changes the sentence. A stored actor
stays stored.
