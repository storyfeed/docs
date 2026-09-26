# Publishing From Events

<script setup>
import { scene } from '../.vitepress/theme/world'
</script>

## Publishing From an Event

A controller that publishes its own activity handles the payment and the feed
itself:

```php memo="app/Http/Controllers/StripeWebhookController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Storyfeed\Facades\Storyfeed;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $order = Order::where('payment_intent', $request->input('data.object.id'))
            ->firstOrFail();

        $order->update(['paid_at' => now()]);

        Storyfeed::activity()
            ->by('Stripe')
            ->action('pay', $order)
            ->publish();

        return response()->noContent();
    }
}
```

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

The event describes the activity, and returns it without calling `publish()`:

<<< @/snippets/publish-from-event.php {php memo="app/Events/OrderPaid.php"}

Storyfeed publishes it for you. It listens for every event that implements
`PublishesToFeed`, and when one is dispatched, it calls `toFeedActivity()` and
publishes the activity it returns. There is no listener to register.

> [!WARNING]
> Never call `publish()` on the activity yourself, in the event or in a
> listener. Storyfeed already publishes it when the event is dispatched, so the
> payment would be recorded twice.

The payment itself is a side effect, so it moves to a listener, as any other
consequence of the event would:

```php memo="app/Listeners/MarkOrderPaid.php"
<?php

namespace App\Listeners;

use App\Events\OrderPaid;

class MarkOrderPaid
{
    public function handle(OrderPaid $event): void
    {
        $event->order->update(['paid_at' => now()]);
    }
}
```

Both publish the same activity:

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
