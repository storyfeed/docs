# Counts that keep moving

A node quoting "3 replies" is stating a fact about the moment it was recorded.
Nothing recomputes it — not `storyfeed:rebuild`, not `curate --rehash`, not the
trickle. It lives in `data`, and core hands `data` back exactly as you wrote it.

That is correct for a count of something finished, and wrong for a count of
something still happening.

## The rule

**A count in a payload is recorded at publish time. If anything on the surface
can change it, do not record it — resolve it on read.**

## Recording it

```php
Storyfeed::activity()
    ->by($user)
    ->action('discussion.replied', $discussion)
    ->data(['$thread' => FeedThread::make($excerpt)
        ->replies($discussion->comments()->count())   // ← evaluated now, stored forever
        ->toArray()])
    ->publish();
```

A row recorded when the discussion had three replies says three. A fourth reply
publishes a **new** activity with a current count; the older node beside it on
the same page still says three, permanently.

On a read-only surface nobody notices. On a surface with a reply box, the node
starts lying the moment somebody uses it — including the node directly above the
box they just typed into.

## Resolving it instead

Store nothing, and supply the count when the page is built:

```php
FeedThread::make($excerpt)->replies(null)   // "nobody counted"
```

Then fill it in one batched lookup as the page is presented, keyed by each
node's subject:

```php
$counts = Comment::query()
    ->selectRaw('discussion_id, count(*) as total')
    ->whereIn('discussion_id', $ids)      // every subject on the page, one query
    ->groupBy('discussion_id')
    ->pluck('total', 'discussion_id');
```

`replies(null)` means *nobody counted*, which is a different claim from zero and
renders as an excerpt with no count rather than as "0 replies".

::: tip Keep settled counts null on purpose
Set the count back to `null` when presenting, rather than assuming storage is
empty. A backfill, a hand-repaired row, or a future writer can put one back, and
a stale recorded count silently outranks your live one.
:::

## Which counts this covers

Any aggregate a node quotes about something that keeps living after the node was
written: replies, unread items, "3 photos waiting", members of an open
collection.

The test is one question, and it does not require knowing what the count is
about:

> **Can anything on the surface this renders on change it?**

If yes, resolve on read.

## Why the answer changes without the code changing

A recorded count is correct until someone adds an affordance the node's author
never saw. A feed that only displayed discussions is right to record the count;
the day it gains a reply box, every stored count in it becomes wrong, and nobody
reviewing that change will connect a new button to an old number.

Resolving on read survives that. Recording does not.

## What a healer can and cannot do here

A healer re-derives stories from their sources, so it can correct a recorded
count — but only by **replacing** the activity, which supersedes the row and
bumps the feed's `sync_token`. Making every reader resync because a number moved
is the wrong trade.

Worse, it fights itself: a healer comparing a recorded count against a live one
finds a difference on every pass, and rewrites the same story forever. Storing
`null` is what keeps a healer idempotent here.
