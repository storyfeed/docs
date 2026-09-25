# Choosing When to Publish

Publish when a record's status changes, not on every save.

## Publishing a Status Transition

Create an observer for the model whose status changes:

```shell
php artisan make:observer OrderObserver --model=Order
```

In its `updated` method, publish only the transitions the feed should show:

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

Give each verb a headline:

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

*The staff member moves an order from placed to confirmed.*

<FeedExample :items="[confirmed]" />

## Choosing Transitions to Record

| What Happened | Activity | Verb |
|---|---|---|
| created as a draft | no | |
| saved with no status change | no | |
| placed → confirmed | yes | `confirm` |
| confirmed → ready | yes | `ready` |
| ready → completed | yes | `complete` |

Use one verb per transition, not one `status` verb with the new state in
`data`. Each verb gets its own headline, and
[`keepLatest()`](/cookbook/repeating-activities#keeping-the-latest-occurrence)
keeps the latest row of each verb.

<span id="publishing-status-transitions-from-events"></span>

## Publishing From Domain Events

When the transition already has a domain event, publish from the event:

```php memo="app/Events/OrderConfirmed.php"
<?php

namespace App\Events;

use App\Models\Order;
use App\Models\User;
use Storyfeed\Contracts\PublishesToFeed;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\PendingActivity;

class OrderConfirmed implements PublishesToFeed
{
    public function __construct(public Order $order, public User $staff) {}

    public function toFeedActivity(): ?PendingActivity
    {
        return Storyfeed::activity()
            ->by($this->staff)
            ->action('confirm', $this->order);
    }
}
```

See [Publishing from Events](/deeper/events).

## Choosing a Publish Site

| Site | Good For |
|---|---|
| an action or service class | the common case: the fact and the record in one place |
| a domain event via `PublishesToFeed` | when several things already react to the event |
| a model observer | status transitions and lifecycle facts (created, deleted) with no domain event |
