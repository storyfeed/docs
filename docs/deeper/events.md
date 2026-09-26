# Publishing From Events

<script setup>
import { scene } from '../.vitepress/theme/world'
</script>

## Publishing From an Event

An event can build the activity itself, with no listener to register. Return
it without calling `publish()`; dispatching the event publishes it:

<<< @/snippets/publish-from-event.php {php memo="app/Events/OrderPaid.php"}

A payment webhook marks the order paid and dispatches the event:

```php memo="app/Http/Controllers/StripeWebhookController.php"
<?php

namespace App\Http\Controllers;

use App\Events\OrderPaid;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $order = Order::where('payment_intent', $request->input('data.object.id'))
            ->firstOrFail();

        $order->update(['paid_at' => now()]);

        OrderPaid::dispatch($order);

        return response()->noContent();
    }
}
```

<FeedExample :items="[scene.basics.recording.paid]" />

### Skipping Publication

Return `null` to publish nothing for this instance:

```php memo="app/Events/OrderPaid.php"
public function toFeedActivity(): ?PendingActivity
{
    if ($this->order->isTest()) {
        return null;
    }

    return Storyfeed::activity()
        ->by('Stripe')
        ->action('pay', $this->order);
}
```

To test it, use [the Storyfeed fake](/deeper/testing#testing-queued-and-event-publishing)
and leave the application event unfaked, so `toFeedActivity()` can run.

<a id="storyfeed-events"></a>

## Listening for Storyfeed Events

### Publication and Deletion Events

| Event | Payload |
|---|---|
| `Storyfeed\Events\ActivityPublished` | `$event->activity`: the published activity's facts |
| `Storyfeed\Events\ActivityDeleted` | `$event->activity`: the deleted activity's facts |

`$event->activity` is a read-only copy of the activity, not an Eloquent model.
Both are dispatched after the outermost transaction commits; a rollback
dispatches nothing.

A listener for these events can implement `ShouldQueue`. `Storyfeed::fake()`
does not dispatch them, so use `Queue::fake()` alone when asserting that a
listener was queued.

### Batch Events

`Storyfeed\Events\BatchClosed` carries the closed
[batch](/deeper/story-middleware-and-batching#batching-activities) and its activities in
`$event->batch`, as a read-only copy. It is also dispatched after the outermost
transaction commits. Register a Laravel listener for this event to act when a
batch closes.
