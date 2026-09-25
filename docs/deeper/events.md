# Publishing From Events

## Introduction

If your app already dispatches an event when something happens, you can
publish the activity from that event: from a listener, or from the event class
itself.

<script setup>
import { scene } from '../.vitepress/theme/world'
</script>

## Generating Events and Listeners

Use Laravel's generators to create the event and its listener:

```shell
php artisan make:event OrderPlaced
php artisan make:listener RecordOrderPlaced --event=OrderPlaced
```

## Publishing From a Listener

```php memo="app/Events/OrderPlaced.php"
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
<<< @/snippets/publish-from-listener.php {php memo="app/Listeners/RecordOrderPlaced.php"} [Fluent Syntax]
<<< @/snippets/publish-from-listener.named-arguments.php {php memo="app/Listeners/RecordOrderPlaced.php"} [Named Arguments]
:::

<FeedExample :items="[scene.order]" />

### Registering the Listener

Laravel discovers listeners in `app/Listeners` from the event type hinted in
`handle()`. See [event discovery](https://laravel.com/docs/13.x/events#event-discovery)
if your listeners live elsewhere. Dispatch `OrderPlaced` after placing the order
to run the listener.

## Publishing From an Event

An event can build the activity itself, with no listener to register. Return
it without calling `publish()`; dispatching the event publishes it:

<<< @/snippets/publish-from-event.php {php memo="app/Events/OrderPlaced.php"}

<FeedExample :items="[scene.order]" />

### Skipping Publication

Return `null` to publish nothing for this instance:

```php memo="app/Events/OrderPlaced.php"
public function toFeedActivity(): ?PendingActivity
{
    if ($this->order->isTest()) {
        return null;
    }

    return Storyfeed::activity()
        ->by($this->customer)
        ->action('place', $this->order)
        ->to($this->order->shop);
}
```

<a id="storyfeed-events"></a>

## Listening for Storyfeed Events

### Publication and Deletion Events

| Event | Payload |
|---|---|
| `Storyfeed\Events\ActivityPublished` | `$event->activity`: the published activity's facts |
| `Storyfeed\Events\ActivityDeleted` | `$event->activity`: the deleted activity's facts |

These events carry a snapshot of the facts, not a model, and are dispatched after the
outermost transaction commits. [Queued Publishing](/deeper/queues) covers queued
listeners on these events.

### Batch Events

`Storyfeed\Events\BatchClosed` carries the closed
[batch](/deeper/story-middleware-and-batching#batching-activities) and its activities in
`$event->batch`. It also carries a snapshot and dispatches after the outermost
transaction commits. Register a Laravel listener for this event to act when a
batch closes.

## Testing Event Publishing

Use [the Storyfeed fake](/deeper/testing#testing-queued-and-event-publishing) to
assert the activity your application event publishes. Keep that application
event unfaked so its listener or `PublishesToFeed` integration can run.
