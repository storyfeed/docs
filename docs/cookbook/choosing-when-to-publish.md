# Choosing When to Publish

A publish site that fires when a status changes and stays silent on every
other save. A feed that reads as what happened, not as what was edited.

```php
<?php

namespace App\Observers;

class DocumentObserver
{
    public function updated(Document $document): void
    {
        if (! $document->wasChanged('status')) {
            return;                                  // a save is not news
        }

        $verb = match ($document->status) {
            'submitted' => 'submit',
            'approved' => 'approve',
            'archived' => 'archive',
            default => null,                         // a draft is not news either
        };

        if ($verb === null) {
            return;
        }

        Storyfeed::activity()
            ->action($verb, $document)
            ->to($document->project)
            ->publish();
    }
}
```

<script setup>
import { who, where, doc, activity } from '../.vitepress/theme/samples'

const submitted = activity({
  id: 'ck2', verb: 'submit', glyph: 'file-check',
  published_at: '2026-08-14T15:02:00.000000Z',
  headline_template: ':actor submitted :object to :target',
  actor: who.designer, object: doc.report, target: where.main,
})
</script>

*A user moves a draft to submitted.*

<FeedStream :items="[submitted]" :grouped="false" />

```php
// AppServiceProvider::boot()
Storyfeed::verbs([
    'submit' => ActivityType::Offer,
    'approve' => ActivityType::Accept,
    'archive' => ActivityType::Remove,
]);

Storyfeed::grammar([
    'document.submit' => ':actor submitted :object to :target',
    'document.approve' => ':actor approved :object in :target',
    'document.archive' => ':actor archived :object in :target',
]);
```

## What Publishes

| what happened | activity | verb |
|---|---|---|
| created as a draft | no | |
| saved with no status change | no | |
| draft → submitted | yes | `submit` |
| submitted → approved | yes | `approve` |
| approved → archived | yes | `archive` |

A verb names one transition. `submit`, `approve` and `archive` are three
verbs, not one `status` verb carrying the new state in `data`. The reason is
in [Repeating Activities](/cookbook/repeating-activities#what-replace-matches-on).

## The Transition from the Event

When the transition already has a domain event, the event publishes it:

```php
<?php

namespace App\Events;

class DocumentApproved implements PublishesToFeed
{
    public function __construct(public Document $document, public User $user) {}

    public function toFeedActivity(): ?PendingActivity
    {
        return PendingActivity::inline('approve')
            ->by($this->user)
            ->object($this->document)
            ->to($this->document->project);
    }
}
```

The event is the transition. A `DocumentSaved` event has no feed story to
return. See [Publishing from events](/deeper/events).

A feed that publishes every save, with the field diff attached, is an audit
log and reads as one.

## Where to Publish From

| Site | Good For |
|---|---|
| an action or service class | the common case: the fact and the record in one place |
| a domain event via `PublishesToFeed` | when several things already react to the event |
| a model observer | lifecycle facts (created, deleted) with no domain event |

All three are explicit calls. Whichever you choose, the pairs they record show
up in `storyfeed:stories`, including ones the package never wired.
