# Counts That Keep Changing

A count you record in an activity, such as "3 replies", is stored as it was at
publish and never recomputed. If the count can still change, store nothing and
look it up when the feed is read.

## Recording It

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommentRequest;
use App\Models\Discussion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
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

        $excerpt = Str::limit($comment->body, 140);

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

```php [Named Arguments]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommentRequest;
use App\Models\Discussion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
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

        $excerpt = Str::limit($comment->body, 140);

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

A row recorded at three replies says three. A fourth reply publishes a new
activity with a new count, and the older row beside it still says three.
Nothing recomputes it: not `storyfeed:rebuild`, not `curate --rehash`, not the
trickle.

That is right for something finished, and wrong on a surface where the reader
can add a reply.

## Resolving It Instead

**1. Store nothing.**

```php
// app/Http/Controllers/CommentController.php, store()
FeedThread::make(text: $excerpt, replies: null)
```

`null` means nobody counted. It renders as an excerpt with no count, not as
"0 replies".

**2. Count the whole page in one query.** One query per row is an N+1:

```php
// where the page is assembled: a controller, before the nodes are rendered
$counts = Comment::query()
    ->selectRaw('discussion_id, count(*) as total')
    ->whereIn('discussion_id', $ids)      // every discussion on the page
    ->groupBy('discussion_id')
    ->pluck('total', 'discussion_id');
```

Do this where the page is assembled, not inside a row's renderer, which cannot
see the other rows.

**3. Decide which verbs show no count.** A settled discussion's reply count is
not news:

```php
// where the page is assembled, for each node
$node['thread']['replies'] = $node['verb'] === 'settle'
    ? null
    : $counts[$subjectId] ?? null;
```

Set `null` explicitly. A backfill or a hand-repaired row can put a stored
count back, and it would show in place of the live one.

## Which Counts This Covers

Any count about something that keeps changing after the activity: replies,
unread items, "3 photos waiting", members of an open collection. Ask:

> **Can anything on the surface this renders on change it?**

If yes, resolve it when the feed is read. A feed that only displays
discussions can record the count, but the day it gains a reply box every
stored count goes stale.

## Healing Recorded Counts

A healer can correct a recorded count only by replacing the activity, which
bumps the feed's `sync_token` and makes every reader resync. It would also
find a difference on every pass and rewrite the same story forever. Storing
`null` avoids both.
