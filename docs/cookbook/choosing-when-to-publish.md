# Choosing When to Publish

Publish meaningful status changes so routine saves do not create duplicate activities.

## Publishing a Status Transition

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
            return;                                  // a save is not news
        }

        $verb = match ($order->status) {
            'confirmed' => 'confirm',
            'ready' => 'ready',
            'completed' => 'complete',
            default => null,                         // a draft is not news either
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
            return;                                  // a save is not news
        }

        $verb = match ($order->status) {
            'confirmed' => 'confirm',
            'ready' => 'ready',
            'completed' => 'complete',
            default => null,                         // a draft is not news either
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

Story::for(Order::class)->verb('ready')
    ->headline(':actor marked :object ready');

Story::for(Order::class)->verb('complete')
    ->headline(':actor completed :object');
```

<script setup>
import { scene } from '../.vitepress/theme/world'
const confirmed = scene.cookbook.transitions.confirmed
</script>

When a staff member confirms a placed order:

<FeedExample :items="[confirmed]" />

## Choosing Transitions to Record

| What Happened | Activity | Verb |
|---|---|---|
| created as a draft | no | |
| saved with no status change | no | |
| placed → confirmed | yes | `confirm` |
| confirmed → ready | yes | `ready` |
| ready → completed | yes | `complete` |

Use a separate verb for each transition so each has its own headline and
[`keepLatest()`](/cookbook/repeating-activities#keeping-the-latest-occurrence)
can keep its latest activity. A single `status` verb with the state in `data`
does not distinguish transitions this way.

<span id="publishing-status-transitions-from-events"></span>

## Publishing From Domain Events

If the transition already dispatches a domain event, implement
`PublishesToFeed` on that event and return its activity from `toFeedActivity()`:

```php memo="app/Events/OrderConfirmed.php" at="toFeedActivity()"
return Storyfeed::activity()
    ->by($this->staff)
    ->action('confirm', $this->order);
```

See [Publishing from Events](/deeper/events).

## Choosing a Publish Site

| Call Site | Use For |
|---|---|
| action or service class | recording an event where it happens |
| domain event via `PublishesToFeed` | events with several existing listeners |
| model observer | status changes and creation or deletion without a domain event |
