# Publishing From Events

If your app already dispatches an event when something happens, you can
publish the activity from that event: from a listener, or from the event class
itself.

<script setup>
import { scenes } from '../.vitepress/theme/samples'
</script>

## Publishing From a Listener

```php
<?php

namespace App\Events;

use App\Models\Order;
use App\Models\User;

class OrderPlaced
{
    public function __construct(public Order $order, public User $customer) {}
}
```

::: code-group
<<< @/snippets/publish-from-listener.php [Fluent Syntax]
<<< @/snippets/publish-from-listener.named-arguments.php [Named Arguments]
:::

<FeedExample context :items="[scenes.order]" />

## Publishing From an Event

An event can build the activity itself, with no listener to register. Return
it without calling `publish()`; dispatching the event publishes it:

<<< @/snippets/publish-from-event.php

<FeedExample :items="[scenes.order]" />

Return `null` to publish nothing for this instance:

```php
// app/Events/OrderPlaced.php
public function toFeedActivity(): ?PendingActivity
{
    if ($this->order->isTest()) {
        return null;
    }

    return Storyfeed::activity()
        ->by($this->customer)
        ->action('place', $this->order)
        ->to($this->order->kitchen);
}
```

## Storyfeed Events

| Event | Payload |
|---|---|
| `Storyfeed\Events\ActivityPublished` | `$event->activity`: the published activity's facts |
| `Storyfeed\Events\ActivityDeleted` | `$event->activity`: the deleted activity's facts |
| `Storyfeed\Events\BatchClosed` | `$event->batch`: the closed batch, with its activities |

Each carries a snapshot of the facts, not a model, and is dispatched after the
outermost transaction commits. [Queued Publishing](/deeper/queues) covers queued
listeners on these events.
