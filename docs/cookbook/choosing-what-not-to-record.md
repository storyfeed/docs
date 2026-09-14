# Choosing What Not to Record

A publish site only where a reader would want the row. A feed with fewer
verbs than your app has events.

```php
// app/Events/OrderPlaced.php
public function toFeedActivity(): ?PendingActivity
{
    if ($this->order->status === 'draft') {
        return null;                                 // not an activity
    }

    return Storyfeed::activity()
        ->by($this->customer)
        ->action('placed', $this->order)
        ->to($this->order->kitchen);
}
```

Returning `null` publishes nothing. See
[Publishing from Events](/deeper/events).

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::verbs([
    'placed' => ActivityType::Create,
    'discussion.asked' => ActivityType::Create,
]);

Storyfeed::grammar([
    'order.placed' => ':actor placed :object with :target',
]);
```

## What Stays Out

| What Happened | Activity | Because |
|---|---|---|
| a model created as a draft | no | see [Choosing when to publish](/cookbook/choosing-when-to-publish) |
| a save with no status change | no | see [Choosing when to publish](/cookbook/choosing-when-to-publish) |
| the text of a note edited | no | the note is the story; its edit is not |
| a background index, a cache rebuild, a dirty flag set | no | no reader did anything |
| a field-level audit row | no | an audit log is its own surface |
| a status transition | yes | see [Choosing when to publish](/cookbook/choosing-when-to-publish) |
| a question asked about a dish | yes | the sentence names what was asked about |
| an order placed | yes | |

## A Note Is an Activity About Its Target

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    '*.discussion.asked' => ':actor asked about :target',   // names the dish, never the note
]);

Storyfeed::activity()
    ->by($user)
    ->action('discussion.asked', $note)
    ->on($dish)
    ->publish();
```

<script setup>
import { who, dishes, notes, activity } from '../.vitepress/theme/samples'

const question = activity({
  id: 'ck7', verb: 'discussion.asked', glyph: 'message-circle',
  published_at: '2026-08-14T14:28:00.000000Z',
  headline_template: ':actor asked about :target',
  actor: who.customer4, object: notes.spice, target: dishes.chickenCurry,
})
</script>

<FeedStream :items="[question]" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

The quote above comes from the note's snapshot. Give the Note model
this contract (and register its `note` morph alias as in
[Feedable models](/basics/feedable-models)):

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Note extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->body,
            data: ['excerpt' => $this->body], // full text, not a shortened preview
            component: 'Note',
        );
    }
}
```

`Note` is an app-owned body component. The renderer above resolves
`node.object.component` and passes it `node.object`; `Note` displays
`entity.data.excerpt` as escaped text in a blockquote. Core carries the hint
and data; your renderer supplies the component.

Saving this model with recording enabled refreshes its shared snapshot through
`InteractsWithFeed`. All rows referencing the note then show its edited
text, without publishing another activity. Implementing `Feedable` without
the trait requires an explicit snapshot refresh.

## A Quote Belonging to One Activity

```php
// where the fact happens: a controller, an action, a listener
use Storyfeed\FeedThread;

Storyfeed::activity()
    ->by($user)
    ->action('discussion.asked', $note)
    ->on($dish)
    ->thread(FeedThread::make(text: $note->body))
    ->publish();
```

Use this instead of the snapshot body when the utterance should be captured
on the activity. The reader receives it as `node.thread.text`; this site's feed component renders that quote. Omit the `Note`
body slot for this version so the text is not displayed twice. `FeedThread`
also accepts `by`, `kind`, and `replies` when attribution and a conversation
count are needed; an uncounted conversation uses `replies: null`.

When the object is the discussion itself, each activity can still carry the
particular reply it is about:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    'discussion.reply' => ':actor replied about :target',
]);
Storyfeed::verbs(['reply' => ActivityType::Create]);

// $discussion is Feedable and registered under the discussion morph alias.
Storyfeed::activity()
    ->by($user)
    ->action('reply', $discussion)
    ->on($dish)
    ->thread(FeedThread::make(text: $reply->body))
    ->publish();
```

Editing a note or discussion snapshot does not refresh an existing
`FeedThread`: its text is stored on that activity. Choose whether your app
keeps the captured words or explicitly updates the activity when speech is
edited. A latest-reply pulse can replace by discussion and verb; that retention
choice is in [Repeating activities](/cookbook/repeating-activities).

Supporting machine evidence belongs in activity `data` or an entity detail
rendered with its provenance. It is not the human utterance in `FeedThread`.
For a non-conversational passage attached to an entity, the
[`Excerpt` form](/basics/activity-content) carries the passage and its
source.

## Grammar with No Publisher

`storyfeed:verbs --used` and doctor's `verbs` check compare declared verbs
with distinct stored verbs. A declared verb absent from storage is reported;
a verb with historical rows still counts as recorded even if its publisher
has been removed. Neither command searches for publish sites. A grammar
entry alone does not declare a verb, so these checks do not report an unused
grammar entry. `storyfeed:stories` inventories registered definitions and
recorded pairs, but cannot find an unregistered publisher that has never run.
The case for keeping a retired verb on purpose is in
[Keeping verbs and grammar together](/cookbook/verbs-and-grammar-together#a-verb-nothing-publishes-any-more).
