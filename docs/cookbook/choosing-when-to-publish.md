# Choosing When to Publish

<script setup>
import { scene } from '../.vitepress/theme/world'
const confirmed = scene.cookbook.transitions.confirmed
</script>

Publish meaningful status changes so routine saves do not create duplicate activities.

<span id="publishing-status-transitions-from-events"></span>

## Publishing From Domain Events

Dispatch a domain event when an order is confirmed. Implement `PublishesToFeed`
on that event so Storyfeed publishes the transition:

```php memo="app/Events/OrderConfirmed.php"
<?php

namespace App\Events;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Storyfeed\Contracts\PublishesToFeed;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\PendingActivity;

class OrderConfirmed implements PublishesToFeed
{
    use Dispatchable;

    public function __construct(public Order $order, public User $staff) {}

    public function toFeedActivity(): ?PendingActivity
    {
        return Storyfeed::activity()
            ->by($this->staff)
            ->action('confirm', $this->order);
    }
}
```

Dispatch the event where the transition succeeds:

```php memo="Where the order is confirmed: an action or service"
use App\Events\OrderConfirmed;

$order->update(['status' => 'confirmed']);
OrderConfirmed::dispatch($order, $staff);
```

Storyfeed publishes the returned activity automatically. Define its headline:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('confirm')
    ->headline(':actor confirmed :object');
```

<FeedExample :items="[confirmed]" />

See [Publishing From Events](/deeper/events) for listeners and conditional publication.

<a id="publishing-a-status-transition"></a>

## Publishing From an Observer

Use a model observer when the application has no domain event for a
transition. Use one publication site for each transition to avoid recording
it twice.

Create an observer for the model whose status changes:

```shell
php artisan make:observer OrderObserver --model=Order
```

In the observer's `updated` method, publish only the transitions the feed should show:

::: code-group
```php [Fluent Syntax] memo="app/Observers/OrderObserver.php"
<?php

namespace App\Observers;

use App\Models\Order;
use Storyfeed\Facades\Storyfeed;

class OrderObserver
{
    public function updated(Order $order): void
    {
        if (! $order->wasChanged('status')) {
            return;                                  // no status change
        }

        $verb = match ($order->status) {
            'confirmed' => 'confirm',
            'ready' => 'prepare',
            'completed' => 'complete',
            default => null,                         // drafts are not recorded
        };

        if ($verb === null) {
            return;
        }

        Storyfeed::activity()
            ->action($verb, $order)
            ->publish();
    }
}
```

```php [Named Arguments] memo="app/Observers/OrderObserver.php"
<?php

namespace App\Observers;

use App\Models\Order;
use Storyfeed\Facades\Storyfeed;

class OrderObserver
{
    public function updated(Order $order): void
    {
        if (! $order->wasChanged('status')) {
            return;                                  // no status change
        }

        $verb = match ($order->status) {
            'confirmed' => 'confirm',
            'ready' => 'prepare',
            'completed' => 'complete',
            default => null,                         // drafts are not recorded
        };

        if ($verb === null) {
            return;
        }

        Storyfeed::record(
            verb: $verb,
            object: $order,
        );
    }
}
```
:::

<span id="status-transitions"></span>

Register the observer in your service provider:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use App\Models\Order;
use App\Observers\OrderObserver;

Order::observe(OrderObserver::class);
```

Define a headline for each verb:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('confirm')
    ->headline(':actor confirmed :object');

Story::for(Order::class)->verb('prepare')
    ->headline(':actor prepared :object');

Story::for(Order::class)->verb('complete')
    ->headline(':actor completed :object');
```

Without `by()`, Storyfeed records the signed-in user as the actor:

<FeedExample :items="[confirmed]" />

A save in a console command or a scheduled task has no signed-in user. The
activity then uses the [default actor](/deeper/parties#setting-a-default-actor),
or has no actor.

## Choosing Transitions to Record

| What Happened | Activity | Verb |
|---|---|---|
| created as a draft | no | |
| saved with no status change | no | |
| placed → confirmed | yes | `confirm` |
| confirmed → ready | yes | `prepare` |
| ready → completed | yes | `complete` |

Use a separate verb for each transition so each has its own headline and
[`keepLatest()`](/cookbook/repeating-activities#keeping-the-latest-occurrence)
can keep its latest activity. A single `status` verb with the state in `data`
does not distinguish transitions this way.

## Choosing a Publish Site

| Call Site | Use For |
|---|---|
| domain event via `PublishesToFeed` | meaningful application events; create an event when the transition needs one |
| model observer | model transitions while the application has no domain event |
| action or service class | dispatching the domain event where the transition succeeds |
