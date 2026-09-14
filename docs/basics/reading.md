# Reading Feeds

A read is a builder that returns a page of nodes, ready to render or to return
from a route. When you are done, one line reads the feed a surface wants.

<script setup>
import { who, where, doc, note, activity, group } from '../.vitepress/theme/samples'

const scoped = [
  group({ id: 'rd1', verb: 'upload', axis: 'repeat', count: 3, glyph: 'file-up',
    published_at: '2026-08-14T14:30:00.000000Z',
    headline_template: ':actor uploaded :count files to :target',
    actors: [who.designer], targets: [where.main],
    objects: [doc.report, doc.signage, doc.pricing],
    distinct: { actors: 1, objects: 3, targets: 1 } }),
  activity({ id: 'rd2', verb: 'comment', glyph: 'message-circle',
    published_at: '2026-08-14T14:28:00.000000Z',
    headline_template: ':actor commented on :target',
    actor: who.reviewer, object: note.second, target: doc.report }),
  activity({ id: 'rd3', verb: 'create', glyph: 'folder',
    published_at: '2026-08-12T09:00:00.000000Z',
    headline_template: ':actor created the project :object',
    actor: who.owner, object: where.main }),
]

const upload = (id, at, object) => activity({ id, verb: 'upload', glyph: 'file-up',
  published_at: at,
  headline_template: ':actor uploaded :object to :target',
  actor: who.designer, object, target: where.main })

const log = [
  upload('rd4', '2026-08-14T14:30:00.000000Z', doc.pricing),
  upload('rd5', '2026-08-14T14:29:00.000000Z', doc.signage),
  upload('rd6', '2026-08-14T14:27:00.000000Z', doc.report),
  activity({ id: 'rd7', verb: 'comment', glyph: 'message-circle',
    published_at: '2026-08-14T14:20:00.000000Z',
    headline_template: ':actor commented on :target',
    actor: who.reviewer, object: note.second, target: doc.report }),
]

const summary = [scoped[0], log[3]]
</script>

## The Builder

```php
// a controller, or wherever the feed is read
$page = Storyfeed::feed()
    ->involving($project)
    ->limit(20)
    ->get();
```

<FeedStream :items="scoped" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

`$page` is a `FeedPage`: the payload envelope, ready to return from a route.

```php
// routes/web.php
Route::get('/feed', fn () => Storyfeed::feed()->limit(20)->get());
```

```jsonc
{
  "payload_version": 1,
  "items": [ /* activity nodes and group nodes, newest first */ ],
  "next_cursor": "eyJ...",
  "sync_token": null
}
```

`FeedPage` is `Arrayable`, `JsonSerializable`, `Responsable`, and read-only
`ArrayAccess`, so `$page['items']` works the same in PHP as client-side.

## Read Modes

| Call | Also Called | Returns |
|---|---|---|
| `->log()` | timeline | one node per activity, no groups |
| `->live()` | aggregated, active window | groups as they form |
| `->summary()` | aggregated, collapsed | the best grouping of each burst. **The default** |

The same four activities as a log:

```php
// a controller, or wherever the feed is read
Storyfeed::feed()->involving($project)->log()->get();
```

<FeedStream :items="log" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

And as a summary:

```php
// a controller, or wherever the feed is read
Storyfeed::feed()->involving($project)->summary()->get();
```

<FeedStream :items="summary" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

The app-wide default is `grouping.default` in the config; a call always
overrides it. Mode names never appear in the payload: which mode a surface
uses is a server-side choice a renderer knows nothing about.

## Scoping

An entity's own page wants `involving()`: every activity that mentions it, in
any role.

```php
// a controller, or wherever the feed is read
Storyfeed::feed()->involving($project)->get();
$project->storyfeed()->get();   // the same read, from the model
```

The narrower filters answer narrower questions:

| Call | Returns |
|---|---|
| `->involving($model)` | every activity where the model is actor, object, target, context, origin, result or instrument |
| `->context($project)` | only activities recorded inside that container |
| `->actor($user)` | only what that actor did |
| `->object($doc)` / `->target($customer)` | only that exact role |
| `->verb('upload')` | one verb |

Scopes combine. Group counts are recomputed within the scope: a group of four
whose two members fall inside a project arrives as a group of two on that
project's page.

::: tip The difference between involving and context
`context()` is the container question, and it misses an entity's own
lifecycle: "project created" records the project as the **object**, so a
context-scoped project page omits it. A page a user expects is `involving()`.
:::

## Custom Constraints with `query()`

The filters above are a closed set. `query()` hands you the underlying
activity query for anything they cannot express:

```php
// everything except comments
$project->storyfeed()
    ->query(fn (ActivityBuilder $q) => $q->whereNot('verb', 'comment'))
    ->get();

// the last seven days
$project->storyfeed()
    ->query(fn (ActivityBuilder $q) => $q->where('published_at', '>=', now()->subWeek()))
    ->get();
```

<FeedStream :items="[scoped[0], scoped[2]]" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

Callbacks compose, and the constraint reaches the whole read: group children
and the counts behind a group are built from the same query.

- `limit()` or `offset()` inside the callback throws. Size the page with
  `limit()` on the builder.
- Ordering inside the callback is ignored. The read owns its ordering, because
  the cursor encodes a position in it.
- A callback narrows and never widens. Each one is wrapped in its own group,
  so a top-level `orWhere` inside it constrains that group rather than reaching
  past the scope.

## Pagination

Pass the previous page's `next_cursor` back:

```php
// Cursors are opaque: store them, never parse them.
// The end of the feed is next_cursor === null. An empty items array is not the
// end; a page can return zero items with a live cursor, so follow it while
// empty, bounded to a few hops.
$page = Storyfeed::feed()->cursor($request->query('cursor'))->get();
```

A cursor is a position in the stream **this** query produced: its scope, its
filters, its mode. Send it back with the same query, including the same
`query()` callbacks. Applied to a different query it does not error; it skips
or repeats nodes. The first page and the later pages are often built in
different places, a controller and an endpoint, and one filter's difference is
enough.

Store `sync_token` alongside the cursor and compare it on each page. When it
changes, settled history was rewritten: drop the accumulated nodes and refetch
from the head. Equality compare only; `null` to non-null counts as a change.
A client that accumulates pages needs two more rules, in
[Rendering](/basics/rendering#reconciling-updates).

## Conditional Building

`FeedBuilder` is `Conditionable`:

```php
// a controller, or wherever the feed is read
Storyfeed::feed()
    ->when($request->project, fn ($feed, $project) => $feed->involving($project))
    ->get();
```
