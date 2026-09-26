# Recording Counts

Counts recorded in activities, such as "3 replies", are not recomputed after
publication. If a count can change, leave it empty and query the current
value when retrieving the feed.

<span id="choosing-counts-to-resolve"></span>

## Choosing Fixed or Live Counts

Replies, unread items, pending photos, and members of open collections can
change after publication.

Use current counts when people can change them from the page displaying the feed.

A fixed count may suit a page that only displays past discussions. If you
add a reply box, retrieve current counts so new replies do not leave earlier
activities displaying stale totals.

<span id="recording-a-count"></span>

<script setup>
import { scene } from '../.vitepress/theme/world'
import { activity } from '../.vitepress/theme/samples'

const reply = scene.cookbook.discussion
const fixed = activity({ ...reply,
  thread: { text: reply.object.label, by: null, kind: null, replies: 3, truncated: false },
})
const withoutCount = activity({ ...fixed, thread: { ...fixed.thread, replies: null } })
const live = activity({ ...fixed, thread: { ...fixed.thread, replies: 4 } })
</script>

## Recording a Fixed Count

::: code-group
```php [Fluent Syntax]
Storyfeed::activity()
    ->by($request->user())
    ->action('reply', $discussion)
    ->thread(FeedThread::make(
        text: $comment->body,
        // evaluated now, stored forever
        replies: $discussion->comments()->count(), // [!code highlight]
    ))
    ->publish();
```

```php [Named Arguments]
Storyfeed::record(
    verb: 'reply',
    object: $discussion,
    actor: $request->user(),
    thread: FeedThread::make(
        text: $comment->body,
        // evaluated now, stored forever
        replies: $discussion->comments()->count(), // [!code highlight]
    ),
);
```
:::

<FeedExample :items="[fixed]" />

An activity recorded with three replies keeps that count when a fourth reply
publishes another activity. No Storyfeed command recomputes the earlier count.

A fixed count describes the event at publication, but becomes misleading
when the page lets people add replies.

## Resolving a Live Count

### Leaving the Stored Count Empty

```php memo="app/Http/Controllers/CommentController.php" at="store()"
use Storyfeed\FeedThread;

FeedThread::make(text: $comment->body, replies: null);
```

<FeedExample :items="[withoutCount]" />

`null` means no count was supplied. Your frontend can omit the count.

### Loading Counts for the Page

Retrieve the page, count its discussions in one query, and assign each count
to its item. This avoids an extra query for every item:

```php memo="app/Http/Controllers/DiscussionFeedController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Storyfeed\Facades\Storyfeed;

class DiscussionFeedController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $feed = Storyfeed::feed()->get()->toArray();

        $ids = collect($feed['items'])
            ->where('kind', 'activity')
            ->whereNotNull('thread')
            ->pluck('object.id');

        $counts = Comment::query()
            ->selectRaw('discussion_id, count(*) as total')
            ->whereIn('discussion_id', $ids)
            ->groupBy('discussion_id')
            ->pluck('total', 'discussion_id');

        foreach ($feed['items'] as $index => $node) {
            if ($node['kind'] !== 'activity' || $node['thread'] === null) {
                continue;
            }

            $feed['items'][$index]['thread']['replies'] = $node['verb'] === 'settle'
                ? null
                : $counts[$node['object']['id']] ?? null;
        }

        return response()->json($feed);
    }
}
```

Load counts in the controller that assembles the page, where all items are
available. An individual row renderer cannot combine queries across the page.

<FeedExample :items="[live]" />

After a fourth reply, the same activity displays four from the current count.

### Selecting Which Counts to Display

The loop sets `null` for `settle` because a settled discussion's reply count
may not be useful on this page.

Set `null` explicitly. Skipping an item could preserve a stored count added
by a backfill or manual repair, causing the frontend to display it.

<span id="healing-recorded-counts"></span>

## Handling Previously Recorded Counts

This loop also replaces counts stored by earlier activities.
