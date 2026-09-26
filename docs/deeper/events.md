# Publishing From Events

<script setup>
import { scene } from '../.vitepress/theme/world'
</script>

## Publishing From an Event

In an event-driven app, the controller only reports what happened. It
dispatches an event:

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

        OrderPaid::dispatch($order); // [!code highlight]

        return response()->noContent();
    }
}
```

To publish an activity when an event is dispatched, implement the
`Storyfeed\Contracts\PublishesToFeed` interface on the event class. The
interface requires a `toFeedActivity` method, which returns the activity to
publish:

<<< @/snippets/publish-from-event.php {php memo="app/Events/OrderPaid.php"}

The event's listeners handle its side effects, such as marking the order paid:

```php memo="app/Listeners/MarkOrderPaid.php"
<?php

namespace App\Listeners;

use App\Events\OrderPaid;

class MarkOrderPaid
{
    public function handle(OrderPaid $event): void
    {
        $event->order->update(['paid_at' => now()]);

        // The activity is published automatically.
    }
}
```

Storyfeed publishes the activity automatically. It listens for every event that
implements `PublishesToFeed`, and when one is dispatched, it calls
`toFeedActivity` and publishes the activity it returns:

<FeedExample :items="[scene.basics.recording.paid]" />

> [!NOTE]
> Don't call `publish()` on the event's activity yourself. Storyfeed already
> publishes it, so it would be recorded twice.

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
