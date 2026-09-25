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

<script setup>
import { who, where, orders, activity } from '../.vitepress/theme/samples'

const confirmed = activity({
  id: 'ck2', verb: 'confirm', glyph: 'circle-check',
  published_at: '2026-08-14T15:02:00.000000Z',
  headline_template: ':actor confirmed :object',
  actor: who.cook, object: orders.first,
})
</script>

*The cook moves an order from placed to confirmed.*

<FeedExample context :items="[confirmed]" />

```php memo="app/Providers/AppServiceProvider.php"
// boot()
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Storyfeed;

Storyfeed::verbs([
    'confirm' => ActivityType::Accept,
    'ready' => ActivityType::Update,
    'complete' => ActivityType::Update,
]);
```

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

<span id="status-transitions"></span>

Register the observer in your service provider:

```php memo="app/Providers/AppServiceProvider.php"
// boot()
use App\Models\Order;
use App\Observers\OrderObserver;

Order::observe(OrderObserver::class);
```

## Choosing Transitions to Record

| What Happened | Activity | Verb |
|---|---|---|
| created as a draft | no | |
| saved with no status change | no | |
| placed → confirmed | yes | `confirm` |
| confirmed → ready | yes | `ready` |
| ready → completed | yes | `complete` |

Use one verb per transition, not one `status` verb with the new state in
`data`. [Repeating Activities](/cookbook/repeating-activities#matching-activities)
explains why.

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
    public function __construct(public Order $order, public User $cook) {}

    public function toFeedActivity(): ?PendingActivity
    {
        return Storyfeed::activity()
            ->by($this->cook)
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
| a model observer | lifecycle facts (created, deleted) with no domain event |
