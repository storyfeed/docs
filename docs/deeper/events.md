# Publishing from Events

When a fact is already an event, the activity can be published from it. When
you are done, dispatching the event is what puts the activity on the feed.

<script setup>
import { scenes } from '../.vitepress/theme/samples'
</script>

## From a Listener

```php
<?php

namespace App\Events;

class OrderPlaced
{
    public function __construct(public Order $order, public User $customer) {}
}
```

<<< @/snippets/publish-from-listener.php

<FeedExample context :items="[scenes.order]" />

## From the Event Itself

An event can build the same activity itself, with no listener to register.
Return it without publishing; dispatching the event publishes it:

<<< @/snippets/publish-from-event.php

<FeedExample :items="[scenes.order]" />

Dispatch the event and the activity is published. Return `null` to publish
nothing, when only some instances belong on the feed:

```php
// app/Events/OrderPlaced.php
public function toFeedActivity(): ?PendingActivity
{
    if ($this->order->isTest()) { // [!code focus]
        return null; // [!code focus]
    } // [!code focus]

    return Storyfeed::activity()
        ->by($this->customer)
        ->action('placed', $this->order)
        ->to($this->order->kitchen);
}
```

::: tip
The name is `toFeedActivity()`, not `toFeed()`, so a model can be both
`Feedable` and publishing without a collision.
:::

## Events Storyfeed Emits

| Event | Payload |
|---|---|
| `Storyfeed\Events\ActivityPublished` | `$event->activity`: the published activity's facts |
| `Storyfeed\Events\ActivityDeleted` | `$event->activity`: the deleted activity's facts |
| `Storyfeed\Events\BatchClosed` | `$event->batch`: the closed batch, with its activities |

Each carries a snapshot of the facts at event time, not a model. Events are
delivered after the outermost transaction commits, and a rollback delivers
nothing. A listener on any of the three can be `ShouldQueue` and receives the
same facts on the worker. [Queues](/deeper/queues) covers what travels and
when the job is pushed.
