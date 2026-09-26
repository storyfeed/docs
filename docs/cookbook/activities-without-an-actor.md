# Activities Without an Actor

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

<script setup>
import { scene } from '../.vitepress/theme/world'
const placed = scene.order
const { paid, expired } = scene.cookbook.actorless
</script>

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

A job dispatched from an authenticated request carries that user. A job
started by a console command or scheduler has no authenticated user. To
record the person who acted, pass that user to the event or job and call `by()`:

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
```php [Fluent Syntax]
Storyfeed::activity()
    ->by('Stripe')
    ->action('pay', $order)
    ->publish();
```

```php [Named Arguments]
Storyfeed::record(
    verb: 'pay',
    object: $order,
    actor: 'Stripe',
);
```
:::

<FeedExample :items="[paid]" />

See [Publishing From Events](/deeper/events) for the complete webhook or
[Sharing an Actor](/deeper/activity-scopes#sharing-an-actor) to use one party
throughout a job. Parties can also fill
[other roles](/deeper/parties#using-parties-in-other-roles).

<span id="recording-without-an-actor"></span>

## Recording No Actor

This scheduled command expires unpaid orders without recording an actor.
Call `Storyfeed::anonymous()` to make that choice explicit:

```php
Storyfeed::anonymous() // no actor, even inside Storyfeed::actor()
    ->action('expire', $order)
    ->to($order->shop)
    ->publish();
```

<FeedExample :items="[expired]" />

The `expire` headline omits `:actor`. See
[Recording Anonymous Activities](/deeper/parties#recording-anonymous-activities)
for the available APIs and [Anonymous Headlines](/deeper/parties#anonymous-headlines)
for wording when no actor is recorded.
