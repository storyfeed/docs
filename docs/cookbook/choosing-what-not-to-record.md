# Choosing What Not to Record

Publish an activity only when a reader of the feed would want to see it.
Most events in an app, such as drafts, saves and background work, record
nothing.

```php
// app/Events/OrderPlaced.php
public function toFeedActivity(): ?PendingActivity
{
    if ($this->order->status === 'draft') {
        return null;                                 // not an activity
    }

    return Storyfeed::activity()
        ->by($this->customer)
        ->action('place', $this->order)
        ->to($this->order->kitchen);
}
```

Returning `null` publishes nothing. See
[Publishing from Events](/deeper/events).

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::verbs([
    'place' => ActivityType::Create,
    'ask' => ActivityType::Create,
]);

Storyfeed::grammar([
    'order.place' => ':actor placed :object with :target',
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
    'note.ask' => ':actor asked about :target',   // names the dish, never the note
]);

// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($user)
    ->action('ask', $note)
    ->on($dish)
    ->publish();
```

<script setup>
import { who, dishes, notes, activity } from '../.vitepress/theme/samples'

const question = activity({
  id: 'ck7', verb: 'ask', glyph: 'message-circle',
  published_at: '2026-08-14T14:28:00.000000Z',
  headline_template: ':actor asked about :target',
  actor: who.customer4, object: notes.spice, target: dishes.chickenCurry,
})
</script>

<FeedExample context :items="[question]">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedExample>

The quote comes from the note's snapshot. Give the `Note` model this contract,
and register its `note` morph alias as in
[Feedable Models](/basics/feedable-models):

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

`component: 'Note'` names a body component your renderer supplies; here it
shows `data.excerpt` in a blockquote.

Saving the note refreshes its snapshot, so every row that references it shows
the edited text without a new activity. Without `InteractsWithFeed`, refresh
the snapshot yourself.

## A Quote Belonging to One Activity

```php
// where the fact happens: a controller, an action, a listener
use Storyfeed\FeedThread;

Storyfeed::activity()
    ->by($user)
    ->action('ask', $note)
    ->on($dish)
    ->thread(FeedThread::make(text: $note->body))
    ->publish();
```

Use this when the words should be stored on the activity rather than read
from the note. The renderer receives them as `node.thread.text`; drop the
`Note` body component so the text is not shown twice. `FeedThread` also takes
`by`, `kind` and `replies`.

When the object is the discussion itself, each activity can carry the reply it
is about:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::verbs(['reply' => ActivityType::Create]);

Storyfeed::grammar([
    'discussion.reply' => ':actor replied about :target',
]);

// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($user)
    ->action('reply', $discussion)
    ->on($dish)
    ->thread(FeedThread::make(text: $reply->body))
    ->publish();
```

Editing the note or discussion does not change a stored `FeedThread`. To keep
only the latest reply, see [Repeating Activities](/cookbook/repeating-activities).

`FeedThread` is for what a person said. A quoted passage with a source is the
[`Excerpt` form](/basics/activity-content).

## Grammar with No Publisher

`storyfeed:verbs --used` and the doctor's `verbs` check compare declared verbs
with stored ones. They read storage, not code: a verb with old rows counts as
recorded after its publisher is gone, and a grammar entry alone is not a
declared verb, so an unused one is not reported. Keeping a retired verb on
purpose is in
[Keeping Verbs and Grammar Together](/cookbook/verbs-and-grammar-together#a-verb-nothing-publishes-any-more).
