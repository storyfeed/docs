# Keeping a Pulse Per Record

Keep every view and download in your own table, and publish one activity per
document that moves to the top of the feed each time someone opens it.

## Storing Each Interaction

Each view is a row in your own `document_interactions` table. That table is
the full history: show it on the document's own page, and never delete it.
The feed shows only the latest interaction.

## Declaring the Pulse

Publish the interaction as the object and the document as the target, and
keep the latest per target:

```php memo="routes/feed.php"
use App\Models\DocumentInteraction;
use Storyfeed\Facades\Story;

Story::for(DocumentInteraction::class)->verb('engage')
    ->headline(':actor opened :target')
    ->keepLatest(per: 'target');
```

Without `per: 'target'`, the key is the object. Every interaction is a new
object, so nothing would be replaced.

Declare the story on the interaction's class, because the declaration is
found through the object.

## Publishing an Interaction

```php memo="app/Actions/RecordDocumentInteraction.php"
<?php

namespace App\Actions;

use App\Models\Document;
use App\Models\User;
use Storyfeed\Facades\Storyfeed;

class RecordDocumentInteraction
{
    public function handle(Document $document, ?User $viewer, string $kind): void
    {
        $interaction = $document->interactions()->create(['kind' => $kind]);

        // Staff previews and automated requests stay in the table only.
        if ($viewer?->is_staff) {
            return;
        }

        Storyfeed::activity()
            ->by($viewer)
            ->action('engage', $interaction)
            ->to($document)
            ->publish();
    }
}
```

The earlier pulse for the document is soft-deleted in the same transaction.
Milestones such as `send` and `accept` are separate verbs, so they stay.

Link the activity to the document's interaction page, not to the single
interaction.

## Things to Check

- **Notifications.** Every publish dispatches `ActivityPublished`. A listener
  that notifies on it sends one notification per view.
- **Matching roles.** An activity replaces nothing if the target is empty.
- **Existing rows.** Rows recorded under an earlier verb are not replaced.
  Soft-delete them once, after the new verb ships.
- **Backfills.** The latest `published_at` wins, so a backfill can publish
  past interactions in any order.

See [Keeping the Latest Activity](/shaping/keeping-the-latest-activity).
