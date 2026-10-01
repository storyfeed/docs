# Storage Architecture

## Introduction

Storyfeed stores each activity once, in `feed_activities`, and writes
the supporting rows used to retrieve it efficiently at publication:
the entities' labels, the groups the activity can join, and an index of
who and what it involves. Retrieving a feed queries those rows.
Storyfeed does not use Laravel's cache for feed data.

This page follows one publish into the database and one page of the feed
back out. [Schema](/reference/schema) has the diagram of the tables and every
column.

<script setup>
import { scene, logOf, liveOf } from '../.vitepress/theme/world'
const log = logOf(scene.deeper.aggregation.orders)
const repeat = liveOf(log)[0]
</script>

## Writing an Activity

A customer places an order:

```php memo="Where the order is placed: a controller, an action, a listener"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($customer)
    ->action('place', $order)
    ->to($shop)
    ->publish();
```

`publish()` stamps `published_at` and runs the verb's story middleware. The
innermost step stores the activity in one database transaction:

1. **Snapshots.** Each Feedable entity's `toFeed()` output is upserted into
   `feed_snapshots`, one row per entity, and the activity's
   `cached_{role}_id` columns are set to those rows. By default, the feed
   gets labels from these snapshots without loading your models. Presentation
   resolvers can explicitly call [`FeedContext::model()`](/reference/feedable#loading-the-model)
   to hydrate live models, relations, or counts, adding those queries to the
   retrieval cost.
2. **The activity.** One row in `feed_activities`, with a new ULID `uid`. The
   `uid` becomes the payload's `id`.
3. **Groupings.** One `feed_groupings` row per axis the activity has a key
   for, written in a single insert. The `hash` is the axis key: the
   fields the axis compares, joined, ending with the day (or the verb's
   [grouping period](/deeper/grouping-periods)).
4. **Participants.** One `feed_participants` row per filled role, with
   `published_at` copied from the activity.
5. **Curation.** For each group the activity joined, Storyfeed decides which
   one it appears under in `live()` and sets `winner` on that row.

Storyfeed then dispatches `ActivityPublished`, after the outermost transaction
commits. On the way back out of the middleware, the `batch` middleware adds
the activity to the actor's current batch in a transaction of its own.

### The Rows One Publish Writes

For the order above, with a customer, an order and a shop, all Feedable,
and the default axes and middleware:

| Table | Rows | Notes |
|---|---|---|
| `feed_activities` | 1 | |
| `feed_snapshots` | 3 upserted | shared: the customer's row serves every activity that names the customer |
| `feed_groupings` | 9 | `actors`, `targets`, `object`, `repeat`; `summary.hour`, `summary.day`, `summary.week`, `summary.month`; `batch` |
| `feed_participants` | 3 | actor, object, target |
| `feed_batches` | 0 or 1 | a new row only when the customer has no open batch; otherwise one update |
| `feed_batch_locks` | 1 upserted | one per customer, reused |

An activity with fewer roles writes fewer rows. An activity with no actor has
no `summary.*` rows and joins no batch.

### Denormalized Columns

These copies avoid repeated lookups and computations during retrieval.

| Copy | Purpose during retrieval |
|---|---|
| `cached_{role}_id` | resolving labels from your models; one `whereIn` per role on `feed_snapshots` |
| `feed_groupings.hash` | computing group keys over history; a group is every row sharing `(bucket, hash)` |
| `feed_groupings.winner` | deciding each activity's group on every retrieval |
| `feed_participants` | one entity lookup instead of an `OR` across role pairs; individual role indexes can serve OR branches, but the plan and ordering cost depend on the database planner |
| `feed_participants.published_at` | carries activity time in the entity index; `involving()` selects matching activity IDs here, while the outer activity query orders the results |

<a id="reading-a-page"></a>

## Retrieving a Page

```php memo="A controller, or wherever the feed is retrieved"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->get();
```

Grouping is decided when activities are written. Retrieval selects groups
that already exist. A page of a `live()` feed takes two phases.

**Phase one selects the page.** Two logical streams return feed items,
newest first; they can require more than two SQL queries:

- The **group stream** joins each published activity to its winning
  `feed_groupings` row and groups by `(bucket, hash)`. Each group's latest
  `published_at` places it in the feed. Storyfeed runs this aggregate over
  the newest `16 × limit` activities first, then `256 × limit`, and finally
  the whole eligible history. Each bounded attempt probes a window floor and
  runs the aggregate. It stops widening when it finds more than `limit`
  candidates (the `limit + 1` lookahead), or reaches an unbounded attempt.
  A windowed result also recounts its selected groups across eligible history.
- The **solo stream** returns activities that have no winning grouping row.

Storyfeed merges the two, takes `limit` items (30 by default), and encodes
the position of the last one as `next_cursor`.

**Phase two fills in the selected groups.** For the groups on this page
only, Storyfeed fetches up to `grouping.children_limit` members each (25 by
default), counts distinct entities per role, and eager-loads the members'
snapshots. A group with one member is shown as a single activity.

### From Three Orders to One Row

The customer places three orders, minutes apart. Each order writes the rows in
the table above. In `log()`, they are three rows:

<FeedExample :items="log" />

Their `repeat` rows share one hash: same actor, same verb, same type of
object, same shop, same day. No other axis qualifies (one actor, one shop,
three different orders), so curation sets `winner` on `repeat` for each. The
group stream returns one group with `count: 3`, and its headline comes from
the verb's `repeat` headline in `routes/feed.php`:

<FeedExample :items="[repeat]" />

Curation checks the axes in order: `actors` (3 different actors by default),
`targets`, `object`, then `repeat` when none qualifies. The thresholds are
in [Aggregation](/deeper/aggregation#thresholds).

<a id="read-modes"></a>

### Feed Modes

| Mode | Retrieves |
|---|---|
| `live()` | the `winner` grouping row of each activity, or `repeat` when none is stamped |
| `summary()` | the `summary.{period}` row: one group per actor per period |
| `log()` | atomic activities without aggregation; one main SELECT checks composite claims in `feed_groupings` with `NOT EXISTS` to suppress parent stories, plus snapshot loads |

### Pagination

Cursors are keyset positions, not offsets. A `log()` cursor holds the last
row's `published_at` and `id`; a grouped cursor also holds the group's axis
and hash. A page deep in the feed costs what the first page costs in
`log()`. Treat the cursor as opaque, and use it only with the mode that
produced it.

## Keeping Stored Rows Current

Storyfeed keeps its copies current by writing them again. These are the
rules:

| Copy | Rewritten when |
|---|---|
| a snapshot | the model is saved, the model appears in a publish, `storyfeed:trickle` finds it stale, `storyfeed:rebuild` runs, or `php artisan optimize` invokes `storyfeed:cache-snapshots` for a bounded recent refresh (skipped when the database is unavailable) |
| a stale snapshot | `toFeed()` changes shape: each snapshot stores a `shape` fingerprint, and the trickle refreshes rows whose fingerprint differs |
| `winner` | an activity is published into the group, or deleted from it; scheduled `storyfeed:curate` runs hourly, with a configurable lookback |
| `hash` | `storyfeed:curate --rehash` |
| role columns, snapshots, participants, groupings | a model is deleted: its activities are repointed to a tombstone, in chunks of 500 |
| a batch's `closed_at` | the actor's next publish arrives after `closes_at`, or `storyfeed:close-batches` runs |

Scheduled curation defaults to the last two days (`storyfeed.curate.window`).
Weekly and monthly verb grouping widens that window for the affected
activities. A null or nonpositive configured window removes the time bound.

When both the stored and incoming source timestamps are known, a snapshot
update rejects an older model timestamp. Without a usable incoming timestamp,
the update is accepted and clears the watermark. A missing stored timestamp
also prevents an ordering comparison.

When stored history changes in a way a client cannot reconcile, Storyfeed
writes a new `sync_token` to `feed_meta`. Every page carries it. These write
one:

| Change | When |
|---|---|
| `storyfeed:bundle`, `storyfeed:curate --rehash`, `storyfeed:heal` | each run that rewrites history |
| deleting or restoring a model | when any activity is repointed |
| releasing a composite | when a composite is released |
| pruning or purging | when a group loses members |

See [Handling a Changed Feed](/basics/reading#handling-a-changed-feed).

`storyfeed:cache` caches your definitions from `routes/feed.php`, not feed
data. See [Caching Definitions](/reference/commands#caching-definitions).

## Costs at Scale

The default example above writes 1 activity row, 9 grouping rows, and 3
participant rows. Nine is not a ceiling: custom axes can add or replace keys,
and each emitted hash produces a grouping row. Table sizes depend on your
roles, axes, entities, and retention policy. `feed_snapshots` grows with
Feedable entities, including those saved without publishing an activity.

The table lists indexes available to these query shapes. Plans were checked
with 50,000 activities on MariaDB 10.11, PostgreSQL 18, and SQLite 3.45;
MySQL 8.x was not tested. The planner can choose a different index or a scan
as data distribution and query constraints change.
[Schema](/reference/schema) lists every index.

| Query | Available Index |
|---|---|
| `log()`, and the solo stream | `feed_activities (published_at, id)` |
| `->actor()`, `->object()`, `->target()`, `->context()` | `feed_activities ({role}_type, {role}_id, published_at, id)` |
| `->involving()` | `feed_participants (entity_type, entity_id, published_at, activity_id)` |
| each activity's winning row in `live()` | `feed_groupings (activity_id)` |
| each activity's period row in `summary()` | `feed_groupings unique (activity_id, bucket)` |
| a group's members | `feed_groupings (bucket, hash)` |
| the solo stream's `repeat` and `composite` checks, per activity | `feed_groupings unique (activity_id, bucket)` |

Two indexes serve work other than feed retrieval. Publishing finds an actor's open
batches through the `feed_batch_locks` primary key, `(actor_type, actor_id)`.
The `aggregates` check in `storyfeed:doctor` uses
`feed_groupings (winner, bucket, hash)`.

The solo stream's winner check can scan much of the stored history even when
it returns no items. In the measured fixture, it dominated `live()` retrieval
cost on MariaDB and PostgreSQL. Composite checks also varied: some plans used
`(bucket, hash)` instead of the unique `(activity_id, bucket)` index. Treat the
table as available access paths, not a promise that every listed index is
chosen for every request.

[Retention](/deeper/retention) removes old activities with their grouping
and participant rows.

## Comparison With a Single Log Table

A single table with one row per event can render `log()`. The questions a
feed asks next are the ones a single table cannot answer from an index:

| Question | One table | Storyfeed |
|---|---|---|
| "What should this row say?" | load each model, per row | the snapshot, eager-loaded |
| "Placed 4 orders" | group by expressions over history, on every retrieval | rows already share a `hash` |
| "Which group does this activity belong to?" | decided on every retrieval | decided once, at publish |
| "Everything involving this order" | `OR` across every role column | one indexed lookup |
| "The order was deleted" | the label is gone | a tombstone keeps the story readable |

The extra rows are written once, when the activity is published. Subsequent retrieval uses them.
