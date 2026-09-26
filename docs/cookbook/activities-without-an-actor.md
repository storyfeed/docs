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
```php [Fluent Syntax]
Storyfeed::activity()
    ->by('Stripe') // [!code highlight]
    ->action('pay', $order)
    ->publish();
```

```php [Named Arguments]
Storyfeed::record(
    verb: 'pay',
    object: $order,
    actor: 'Stripe', // [!code highlight]
);
```
:::

<FeedExample :items="[paid]" />

[Publishing From Events](/deeper/events) shows the whole webhook. To
name one party for a whole job, see
[Sharing an Actor](/deeper/activity-scopes#sharing-an-actor).
A party can also fill [other roles](/deeper/parties#using-parties-in-other-roles).

<span id="recording-without-an-actor"></span>

## Recording No Actor

A scheduled command that expires unpaid orders acts for nobody, so each
expiry is published with `Storyfeed::anonymous()`:

```php
Storyfeed::anonymous() // no actor, even inside Storyfeed::actor() [!code highlight]
    ->action('expire', $order)
    ->to($order->shop)
    ->publish();
```

<FeedExample :items="[expired]" />

The `expire` headline leaves `:actor` out.
[Recording Anonymous Activities](/deeper/parties#recording-anonymous-activities)
covers every spelling of an anonymous activity, and
[Anonymous Headlines](/deeper/parties#anonymous-headlines) covers headlines
for activities with no actor.
