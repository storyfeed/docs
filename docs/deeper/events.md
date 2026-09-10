# Publishing from events

An event can declare what it puts in the feed by implementing
`PublishesToFeed`:

```php
use Storyfeed\Contracts\PublishesToFeed;
use Storyfeed\PendingStory;

class DeliveryConfirmed implements PublishesToFeed
{
    public function __construct(public Delivery $delivery, public User $user) {}

    public function toFeedStory(): ?PendingStory
    {
        return PendingStory::of(DeliveryWasConfirmed::class)
            ->object($this->delivery)
            ->actor($this->user);
    }
}
```

Dispatch the event; the activity is published. No listener registration.

Return `null` to publish nothing — useful when only some instances are
feed-worthy:

```php
public function toFeedStory(): ?PendingStory
{
    return $this->delivery->isInternal()
        ? null
        : PendingStory::of(DeliveryWasConfirmed::class)->object($this->delivery);
}
```

::: tip
The name is `toFeedStory()`, not `toFeed()`, so a model can be both `Feedable`
and publishing without a collision.
:::

## Choosing a publish site

| site | good for |
|---|---|
| action / service class | the common case — the fact and the record in one place |
| domain event via `PublishesToFeed` | when several things already react to the event |
| model observer | lifecycle facts (created, deleted) with no domain event |

All three are explicit calls. Whichever you choose, the pairs they record show
up in [`storyfeed:stories`](/basics/stories#inventory), including ones the
package never wired.

## Events emitted by Storyfeed

| event | payload |
|---|---|
| `Storyfeed\Events\ActivityPublished` | `$event->activity`: `ActivitySnapshot` |
| `Storyfeed\Events\ActivityDeleted` | `$event->activity`: `ActivitySnapshot` |
| `Storyfeed\Events\BatchClosed` | `$event->batch`: `BatchSnapshot`, including its activity snapshots |

These immutable snapshots live in `Storyfeed\Events\Snapshots`. They preserve
event-time facts; they are not Eloquent models. Events are delivered after the
outermost transaction commits, and a rollback delivers nothing. Queued listeners
receive the same captured facts as synchronous listeners. Batch members are
captured at close, before automatic bundling.

A listener on any of the three can be `ShouldQueue`. What the snapshot
carries onto a worker, and when the job is pushed, is in [Queues](/deeper/queues).
