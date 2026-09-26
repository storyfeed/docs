# Publishing From Events

<script setup>
import { scene } from '../.vitepress/theme/world'
</script>

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
