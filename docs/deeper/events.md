# Publishing from Events

When a fact is already an event, the activity can be published from it. When
you are done, dispatching the event is what puts the activity on the feed.

<script setup>
import { who, where, doc, activity } from '../.vitepress/theme/samples'

const uploaded = activity({ id: 'ev1', verb: 'upload', glyph: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :object to :target',
  actor: who.designer, object: doc.report, target: where.main })
</script>

## From a Listener

```php
class DocumentUploaded
{
    public function __construct(public Document $document, public User $user) {}
}
```

<<< @/snippets/publish-from-listener.php

<FeedStream :items="[uploaded]" :grouped="false" />

## From the Event Itself

An event can build the same activity itself, with no listener to register.
Return it without publishing; dispatching the event publishes it:

<<< @/snippets/publish-from-event.php

<FeedStream :items="[uploaded]" :grouped="false" />

Return `null` to publish nothing, when only some instances belong on the feed:

```php
public function toFeedStory(): ?PendingActivity
{
    if ($this->document->isDraft()) { // [!code focus]
        return null; // [!code focus]
    } // [!code focus]

    return Storyfeed::activity()
        ->by($this->user)
        ->action('upload', $this->document)
        ->to($this->document->project);
}
```

::: tip
The name is `toFeedStory()`, not `toFeed()`, so a model can be both `Feedable`
and publishing without a collision.
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
