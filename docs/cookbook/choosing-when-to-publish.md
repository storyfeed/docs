# Choosing When to Publish

Publish when a record's status changes, and not on other saves. The feed then
shows what happened to the order, not every edit to it.

::: code-group
```php [Fluent Syntax]
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

        Storyfeed::activity() // [!code focus]
            ->action($verb, $order) // [!code focus]
            ->publish(); // [!code focus]
    }
}
```

```php [Named Arguments]
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

        Storyfeed::record( // [!code focus]
            verb: $verb, // [!code focus]
            object: $order, // [!code focus]
        ); // [!code focus]
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

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::verbs([
    'confirm' => ActivityType::Accept,
    'ready' => ActivityType::Update,
    'complete' => ActivityType::Update,
]);

Storyfeed::grammar([
    'order.confirm' => ':actor confirmed :object',
    'order.ready' => ':actor marked :object ready',
    'order.complete' => ':actor completed :object',
]);
```

## What Publishes

| What Happened | Activity | Verb |
|---|---|---|
| created as a draft | no | |
| saved with no status change | no | |
| placed → confirmed | yes | `confirm` |
| confirmed → ready | yes | `ready` |
| ready → completed | yes | `complete` |

Use one verb per transition, not one `status` verb with the new state in
`data`. The reason is in
[Repeating Activities](/cookbook/repeating-activities#what-replace-matches-on).

## The Transition from the Event

When the transition already has a domain event, publish from the event:

```php
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
        return Storyfeed::activity() // [!code focus]
            ->by($this->cook) // [!code focus]
            ->action('confirm', $this->order); // [!code focus]
    }
}
```

An `OrderSaved` event has no story to return. See
[Publishing from Events](/deeper/events).

## Where to Publish From

| Site | Good For |
|---|---|
| an action or service class | the common case: the fact and the record in one place |
| a domain event via `PublishesToFeed` | when several things already react to the event |
| a model observer | lifecycle facts (created, deleted) with no domain event |

The pairs recorded from any of the three show up in `storyfeed:stories`.
