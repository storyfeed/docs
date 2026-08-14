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

Dispatch the event; the activity is published. No listener registration — the
package registers one interface listener, and Laravel's dispatcher walks
`class_implements()`, so every implementor is covered at zero cost to events
that don't implement it.

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

## Why a method, not an attribute

`#[RecordsStory(SomeStory::class)]` names a story but not the roles, so the
roles would have to be inferred — which hides the recording site. A required
method forces it to be written out, autocompletes, fails at class-load if
missing, and shows up in `php artisan event:list`.

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

All three are explicit calls. Whichever you choose,
`php artisan storyfeed:stories` inventories every publish site in the app —
including ones the package never wired.
