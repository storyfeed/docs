# Choosing When to Publish

A publish site that fires when a status changes and stays silent on every
other save. A feed that reads as what happened, not as what was edited.

```php
<?php

namespace App\Observers;

class OrderObserver
{
    public function updated(Order $order): void
    {
        if (! $order->wasChanged('status')) {
            return;                                  // a save is not news
        }

        $verb = match ($order->status) {
            'confirmed' => 'confirmed',
            'ready' => 'ready',
            'archived' => 'archive',
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

<script setup>
import { who, where, orders, activity } from '../.vitepress/theme/samples'

const confirmed = activity({
  id: 'ck2', verb: 'confirmed', glyph: 'circle-check',
  published_at: '2026-08-14T15:02:00.000000Z',
  headline_template: ':actor confirmed :object',
  actor: who.cook, object: orders.first,
})
</script>

*The cook moves an order from placed to confirmed.*

<FeedStream :items="[confirmed]" :grouped="false" />

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::verbs([
    'confirmed' => ActivityType::Accept,
    'ready' => ActivityType::Update,
    'archive' => ActivityType::Remove,
]);

Storyfeed::grammar([
    'order.confirmed' => ':actor confirmed :object',
    'order.ready' => ':actor marked :object ready',
    'order.completed' => ':actor completed :object',
]);
```

## What Publishes

| What Happened | Activity | Verb |
|---|---|---|
| created as a draft | no | |
| saved with no status change | no | |
| placed → confirmed | yes | `confirmed` |
| confirmed → ready | yes | `ready` |
| ready → completed | yes | `completed` |

A verb names one transition. `confirmed`, `ready` and `completed` are three
verbs, not one `status` verb carrying the new state in `data`. The reason is
in [Repeating Activities](/cookbook/repeating-activities#what-replace-matches-on).

## The Transition from the Event

When the transition already has a domain event, the event publishes it:

```php
<?php

namespace App\Events;

class OrderConfirmed implements PublishesToFeed
{
    public function __construct(public Order $order, public User $cook) {}

    public function toFeedActivity(): ?PendingActivity
    {
        return Storyfeed::activity()
            ->by($this->cook)
            ->action('confirmed', $this->order);
    }
}
```

The event is the transition. An `OrderSaved` event has no feed story to
return. See [Publishing from events](/deeper/events).

A feed that publishes every save, with the field diff attached, is an audit
log and reads as one.

## Where to Publish From

| Site | Good For |
|---|---|
| an action or service class | the common case: the fact and the record in one place |
| a domain event via `PublishesToFeed` | when several things already react to the event |
| a model observer | lifecycle facts (created, deleted) with no domain event |

All three are explicit calls. Whichever you choose, the pairs they record show
up in `storyfeed:stories`, including ones the package never wired.
