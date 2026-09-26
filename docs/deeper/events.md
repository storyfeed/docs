# Publishing From Events

<script setup>
import { scene } from '../.vitepress/theme/world'
</script>

## Publishing From an Event

In an event-driven application, a controller dispatches an event so listeners
can handle the resulting work:

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

Listeners handle tasks such as marking the order paid:

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

When an event implementing `PublishesToFeed` is dispatched, Storyfeed calls its
`toFeedActivity` method and publishes the returned activity:

<FeedExample :items="[scene.basics.recording.paid]" />

> [!NOTE]
> Do not call the `publish` method on the event's activity. Storyfeed publishes
> it automatically, so another call would record it twice.

### Skipping Publication

Return `null` to skip publishing for this event:

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

Use [the Storyfeed fake](/deeper/testing#testing-queued-and-event-publishing)
to test publishing. Do not fake the application event, because its listeners
must run to call the `toFeedActivity` method.

<a id="storyfeed-events"></a>

## Listening for Storyfeed Events

<a id="publication-and-deletion-events"></a>

Storyfeed dispatches an event when an activity is published or deleted:

| Event | Payload |
|---|---|
| `Storyfeed\Events\ActivityPublished` | `$event->activity`: the published activity's values |
| `Storyfeed\Events\ActivityDeleted` | `$event->activity`: the deleted activity's values |

The `$event->activity` value is an immutable copy of the activity, not an
Eloquent model. Both events are dispatched after the outermost transaction
commits. A rollback dispatches neither event.

A listener for these events can implement `ShouldQueue`. `Storyfeed::fake()`
does not dispatch them, so use `Queue::fake()` alone when asserting that a
listener was queued.

<a id="batch-events"></a>

Storyfeed also dispatches `BatchClosed` when a batch closes. See
[Listening for Closed Batches](/deeper/story-middleware-and-batching#listening-for-closed-batches).
