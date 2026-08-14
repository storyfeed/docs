# Reading feeds

```php
$page = Storyfeed::feed()
    ->context($project)
    ->limit(20)
    ->get();
```

`$page` is a `FeedPage` — the payload envelope, ready to return from a route:

```php
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
`ArrayAccess` — `$page['items']` works the same in PHP as client-side.

## Read modes

| call | industry name | returns |
|---|---|---|
| `->log()` | timeline | one node per activity, no groups |
| `->live()` | aggregated (active window) | groups as they form |
| `->summary()` | aggregated (collapsed) | the best-axis view — **the default** |

The app-wide default is `grouping.default` in the config; per-view calls
always override. Mode names never appear in the payload — which mode a view
uses is a server-side choice renderers know nothing about.

## Scoping

An entity's own page wants `involving()` — every activity that mentions it, in
any role:

```php
// a project page: uploads INTO it, plus its own creation and archival
Storyfeed::feed()->involving($project)->get();
```

A [feedable model](/basics/feedable-models) has the same thing on it, with the
argument already filled in:

```php
$project->storyfeed()->get();
```

Same builder, so everything below applies to both.

The narrower filters answer narrower questions:

| call | returns |
|---|---|
| `->involving($model)` | every activity where the model is actor, object, target **or** context |
| `->context($project)` | only activities recorded *inside* that container |
| `->actor($user)` | only what that actor did |
| `->object($doc)` / `->target($customer)` | only that exact role |
| `->verb('upload')` | one verb |

Scopes combine.

::: tip Involving vs context
`context()` is the container question, and it misses an entity's own lifecycle:
"project created" records the project as the **object**, so a context-scoped
project page omits it. If you want the page a user expects, use `involving()`.

`context()` is still the right filter for a genuine container query, and it is
what context-pinned [axes](/deeper/aggregation#custom-axes) group on.
:::

`involving()` reads a materialized index (`feed_participants`), maintained at
publish time — so it is an indexed semi-join, not a scan across four morph
columns. An install upgrading into it runs
`php artisan storyfeed:participants` once; `storyfeed:doctor` tells you if you
haven't.

Its cost scales with **the queried entity's own share of history**, not the size
of the feed — the candidate set is the entity's activities, and the database
orders them. That is sub-millisecond for entities with thousands of activities;
if a single entity accumulates tens of thousands, measure before assuming, since
engines differ in how they plan it.

Group counts are recomputed **within** the scope: a group of four whose two
members fall inside a project arrives as a group of two on that project's page.

## Anything else: `query()`

The filters above are a closed set. `query()` hands you the underlying activity
query, for the conditions they cannot express:

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

Several actors, an object type, a `data->` key and your own scopes all work the
same way. Callbacks compose, and the closure's return value is ignored — it
receives the query to constrain, not a predicate to satisfy.

The constraint reaches the **whole** read, not just the page: group children and
the counts behind `:actors and 3 others` are built from the same query. Exclude
one member of a group of four and you get a group of three whose children match.

Two rules:

- **Do not `limit()` or `offset()` inside the callback** — it throws. That would
  cut the candidate set before grouping and curation ran, producing a page that
  looks right and is not. Size the page with `limit()` on the builder.
- **Ordering is ignored.** The read owns its own ordering, because that is what
  the cursor encodes a position in.

Pass the same callback on every page of a paginated feed. Changing it mid-feed
moves the ground the cursor is standing on, exactly as changing `verb()` would.

## Pagination

Pass the previous page's `next_cursor` back:

```php
// Cursors are opaque — store them, don't parse them.
// End of feed is next_cursor === null. An empty items array is NOT the end: a
// page can return zero items with a live cursor, so follow it while empty,
// bounded to a few hops.
$page = Storyfeed::feed()->cursor($request->query('cursor'))->get();
```

Store `sync_token` alongside the cursor and compare it on each page. When it
changes, settled history was rewritten: drop all accumulated nodes and refetch
from the head. Equality compare only — `null → non-null` counts as a change.

A client that accumulates pages needs two more rules with it — see
[Reconciling updates](/basics/rendering#reconciling-updates).

## Conditional building

`FeedBuilder` is `Conditionable`:

```php
Storyfeed::feed()
    ->when($request->project, fn ($feed, $project) => $feed->context($project))
    ->get();
```
