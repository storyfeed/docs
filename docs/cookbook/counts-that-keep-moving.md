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

Three parts. All three are load-bearing.

**One — store nothing.**

```php
FeedThread::make($excerpt)->replies(null)   // "nobody counted"
```

`replies(null)` means *nobody counted*, which is a different claim from zero and
renders as an excerpt with no count rather than as "0 replies".

**Two — resolve the whole page in one query, not one per node.** This is not an
optimisation. It is what makes read-time resolution viable at all; without it
the rule amounts to an N+1 per page and you will go back to recording counts.

```php
$counts = Comment::query()
    ->selectRaw('discussion_id, count(*) as total')
    ->whereIn('discussion_id', $ids)      // every subject on the page, one query
    ->groupBy('discussion_id')
    ->pluck('total', 'discussion_id');
```

Do it where the page is assembled, keyed by each node's subject id — not inside
a node renderer, which cannot see its siblings.

**Three — decide which verbs show no count at all, even after resolving.** A
resolved count is available everywhere; that does not make it wanted everywhere.
A settled discussion is the case to think about: its reply count is not news, and
quoting a number on a closed conversation invites a reader to reopen it.

```php
$node['thread']['replies'] = $node['verb'] === 'discussion.settled'
    ? null
    : $counts[$subjectId] ?? null;
```

Set it back to `null` explicitly rather than assuming storage was empty. A
backfill, a hand-repaired row, or a future writer can put a value back, and a
stale recorded count silently outranks your live one.

::: warning This is the part that gets dropped
Parts one and two are mechanical and people get them right. Part three is a
product decision wearing implementation clothes, and skipping it produces a
surface that resolves counts perfectly and then shows them where they do not
belong.
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

## Where this came from

Not a design. The rule was written by a consumer solving a different problem
entirely: a recorded count made a **healer** replace stories that had not
changed, every pass, forever, because the stored count and the live one always
disagreed. Storing `null` was what made healing idempotent.

Months later that same app gave one of its feed surfaces an inline reply box —
and the rule already protected it from a trap nobody had considered when it was
written. Nothing on that screen could make a recorded count stale, because no
count was recorded.

That is the argument for the rule, better than any clean design story: **it held
against a case its author never saw.** Which is what you want from a rule about
facts that keep moving.
