# Choosing when to publish

A publish site that fires when a status changes and stays silent on every
other save. A feed that reads as what happened, not as what was edited.

```php
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
  id: 'ck2', verb: 'submit', icon: 'file-check',
  published_at: '2026-08-14T15:02:00.000000Z',
  headline_template: ':actor submitted :object to :target',
  actor: who.ines, object: doc.annualReportV3, target: where.passwordCrackdown,
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
    'document.approve' => ':actor approved :object to :target',
    'document.archive' => ':actor archived :object in :target',
]);
```

## What publishes

| what happened | activity | verb |
|---|---|---|
| created as a draft | no | |
| saved with no status change | no | |
| draft → submitted | yes | `submit` |
| submitted → approved | yes | `approve` |
| approved → archived | yes | `archive` |

A verb names one transition. `submit`, `approve` and `archive` are three
verbs, not one `status` verb carrying the new state in `data`. The reason is
in [Recording](/basics/recording#what-replace-matches-on).

## The transition from the event

When the transition already has a domain event, the event publishes it:

```php
class DocumentApproved implements PublishesToFeed
{
    public function __construct(public Document $document, public User $user) {}

    public function toFeedStory(): ?PendingStory
    {
        return PendingStory::inline('approve')
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
