# Choosing what not to record

A publish site only where a reader would want the row. A feed with fewer
verbs than your app has events.

```php
public function toFeedStory(): ?PendingStory
{
    if ($this->document->status === 'draft') {
        return null;                                 // not an activity
    }

    return PendingStory::inline('submit')
        ->by($this->user)
        ->object($this->document)
        ->to($this->document->project);
}
```

Returning `null` publishes nothing. See
[Publishing from events](/deeper/events).

```php
// AppServiceProvider::boot()
Storyfeed::verbs([
    'submit' => ActivityType::Offer,
    'comment' => ActivityType::Create,
]);

Storyfeed::grammar([
    'document.submit' => ':actor submitted :object to :target',
]);
```

## What stays out

| what happened | activity | because |
|---|---|---|
| a model created as a draft | no | a draft is not news |
| a save with no status change | no | a save is not news |
| the text of a comment edited | no | the comment is the story; its edit is not |
| a background index, a cache rebuild, a dirty flag set | no | no reader did anything |
| a field-level audit row | no | an audit log is its own surface |
| a status transition | yes | see [A save is not news](/cookbook/choosing-when-to-publish) |
| a comment posted | yes | the sentence names what was commented on |
| a document uploaded | yes | |

## A comment is an activity about its target

```php
Storyfeed::grammar([
    'comment.comment' => ':actor commented on :target',   // names the document, never the comment
]);

Storyfeed::activity()
    ->by($user)
    ->action('comment', $comment)
    ->on($document)
    ->publish();
```

<script setup>
import { who, doc, note, activity } from '../.vitepress/theme/samples'

const reply = activity({
  id: 'ck7', verb: 'comment', icon: 'message-circle',
  published_at: '2026-08-14T14:28:00.000000Z',
  headline_template: ':actor commented on :target',
  actor: who.priya, object: note.overflow, target: doc.annualReportV3,
})
</script>

<FeedStream :items="[reply]" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

The comment is the object and its text is the body. Editing that text later
changes the snapshot and publishes nothing.

## Grammar with no publisher

A verb declared by a Story or by `Storyfeed::verbs()` and never published is
listed by `storyfeed:verbs --used` and by doctor's `verbs` check. A grammar
entry for a verb nothing declares is reported by neither. The one case a
retired verb is kept on purpose is in
[One thing owns the verb](/cookbook/verbs-and-grammar-together#a-verb-nothing-publishes-any-more).
