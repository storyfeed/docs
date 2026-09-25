# Counts That Keep Changing

A count you record in an activity, such as "3 replies", is stored as it was at
publish and never recomputed. If the count can still change, store nothing and
look it up when the feed is read.

<span id="choosing-counts-to-resolve"></span>

## Choosing Fixed or Live Counts

Any count about something that keeps changing after the activity: replies,
unread items, "3 photos waiting", members of an open collection. Ask:

> **Can anything on the surface this renders on change it?**

If yes, resolve it when the feed is read. A feed that only displays
discussions can record the count, but the day it gains a reply box every
stored count goes stale.

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
```php [Fluent Syntax] memo="app/Http/Controllers/CommentController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommentRequest;
use App\Models\Discussion;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedThread;

class CommentController extends Controller
{
    public function store(
        StoreCommentRequest $request,
        Discussion $discussion,
    ): RedirectResponse {
        $comment = $discussion->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $request->validated('body'),
        ]);

        $excerpt = $comment->body;

        Storyfeed::activity()
            ->by($request->user())
            ->action('reply', $discussion)
            ->thread(FeedThread::make(
                text: $excerpt,
                // evaluated now, stored forever
                replies: $discussion->comments()->count(),
            ))
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/CommentController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommentRequest;
use App\Models\Discussion;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedThread;

class CommentController extends Controller
{
    public function store(
        StoreCommentRequest $request,
        Discussion $discussion,
    ): RedirectResponse {
        $comment = $discussion->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $request->validated('body'),
        ]);

        $excerpt = $comment->body;

        Storyfeed::record(
            verb: 'reply',
            object: $discussion,
            actor: $request->user(),
            thread: FeedThread::make(
                text: $excerpt,
                // evaluated now, stored forever
                replies: $discussion->comments()->count(),
            ),
        );

        return back();
    }
}
```
:::

<FeedExample :items="[fixed]" />

A row recorded at three replies says three. A fourth reply publishes a new
activity with a new count, and the older row beside it still says three.
No Storyfeed command recomputes it.

That is right for something finished, and wrong on a surface where the reader
can add a reply.

## Resolving a Live Count

### Leaving the Stored Count Empty

```php memo="app/Http/Controllers/CommentController.php" at="store()"
use Storyfeed\FeedThread;

FeedThread::make(text: $excerpt, replies: null);
```

<FeedExample :items="[withoutCount]" />

`null` means no count was supplied. Your frontend can omit the count.

### Loading Counts for the Page

Read the page, count every discussion on it in one query, and write each count
into its node. One query per row is an N+1:

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

Do this where the page is assembled, not inside a row's renderer, which cannot
see the other rows.

<FeedExample :items="[live]" />

After a fourth reply, the page-wide lookup supplies four for the same activity.

### Selecting Which Counts to Display

A settled discussion's reply count may not be useful on this surface, so the
loop sets `null` for the `settle` verb.

Set `null` explicitly rather than skipping the node. A backfill or a
hand-repaired row can put a stored count back, and it would show in place of
the live one.

<span id="healing-recorded-counts"></span>

## Handling Previously Recorded Counts

The same loop overrides counts that older activities stored at publish.
