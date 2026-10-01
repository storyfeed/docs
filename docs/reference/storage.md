# Storage Architecture

## Introduction

Storyfeed stores each activity once, in `feed_activities`, and writes
everything a feed needs to read it fast at the moment it is published:
the entities' labels, the groups the activity can join, and an index of
who and what it involves. Reading a feed is then a query over those rows.
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
   `cached_{role}_id` columns are set to those rows. The feed reads labels
   from here, so it never loads your models.
2. **The activity.** One row in `feed_activities`, with a new ULID `uid`. The
   `uid` becomes the payload's `id`.
3. **Groupings.** One `feed_groupings` row per axis the activity has a key
   for, written in a single insert. The `hash` is the axis key: the
   fields the axis compares, joined, ending with the day (or the verb's
   [grouping period](/deeper/grouping-periods)).
4. **Participants.** One `feed_participants` row per filled role, with
   `published_at` copied from the activity.
5. **Curation.** For each group the activity joined, Storyfeed decides which
   one it reads under in `live()` and sets `winner` on that row.

Storyfeed then dispatches `ActivityPublished`, after the outermost transaction
commits. On the way back out of the middleware, the `batch` middleware adds
the activity to the actor's current batch in a transaction of its own.

### The Rows One Publish Writes

For the order above, with a customer, an order and a shop, all Feedable:

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

Each copy lets a read use one index instead of computing something per row.

| Copy | What it saves the read |
|---|---|
| `cached_{role}_id` | resolving labels from your models; one `whereIn` per role on `feed_snapshots` |
| `feed_groupings.hash` | computing group keys over history; a group is every row sharing `(bucket, hash)` |
| `feed_groupings.winner` | deciding each activity's group on every read |
| `feed_participants` | an `OR` across seven morph pairs, which no index can serve |
| `feed_participants.published_at` | joining `feed_activities` to sort an `involving()` read |

## Reading a Page

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->get();
```

Grouping is decided when activities are written. The read selects groups
that already exist. A page of a `live()` feed takes two phases.

**Phase one selects the page.** Two queries return feed items, newest
first:

- The **group stream** joins each published activity to its winning
  `feed_groupings` row and groups by `(bucket, hash)`. Each group's latest
  `published_at` places it in the feed. Storyfeed runs this aggregate over
  the newest `16 × limit` activities first, then `256 × limit`, and over the
  whole history only when a window yields less than a page.
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

### Read Modes

| Mode | Reads |
|---|---|
| `live()` | the `winner` grouping row of each activity, or `repeat` when none is stamped |
| `summary()` | the `summary.{period}` row: one group per actor per period |
| `log()` | `feed_activities` alone, one query plus snapshot loads, no groupings |

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
| a snapshot | the model is saved, the model appears in a publish, `storyfeed:trickle` finds it stale, or `storyfeed:rebuild` runs |
| a stale snapshot | `toFeed()` changes shape: each snapshot stores a `shape` fingerprint, and the trickle refreshes rows whose fingerprint differs |
| `winner` | an activity is published into the group, or deleted from it; `storyfeed:curate` repairs the last two days hourly |
| `hash` | `storyfeed:curate --rehash` |
| role columns, snapshots, participants, groupings | a model is deleted: its activities are repointed to a tombstone, in chunks of 500 |
| a batch's `closed_at` | the actor's next publish arrives after `closes_at`, or `storyfeed:close-batches` runs |

A snapshot update writes only when the model's `updated_at` is not older
than the one already stored, so a late write does not overwrite a newer
label.

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

Per activity with an actor, a verb, an object and a target, expect 1 activity
row, 9 grouping rows, and 3 participant rows. `feed_groupings` is the
largest table, at up to nine times `feed_activities`. `feed_snapshots`
grows with your entities, not your activities.

The indexes each read uses (every index is listed in [Schema](/reference/schema)):

| Read | Index |
|---|---|
| `log()`, and the solo stream | `feed_activities (published_at, id)` |
| `->actor()`, `->object()`, `->target()`, `->context()` | `feed_activities ({role}_type, {role}_id, published_at, id)` |
| `->involving()` | `feed_participants (entity_type, entity_id, published_at, activity_id)` |
| a group's members | `feed_groupings (bucket, hash)` |
| winning rows | `feed_groupings (winner, bucket, hash)` |
| the solo stream's checks, per activity | `feed_groupings unique (activity_id, bucket)` |
| an actor's open batch | `feed_batches (actor_type, actor_id, closed_at)` |

[Retention](/deeper/retention) removes old activities with their grouping
and participant rows.

## Comparison With a Single Log Table

A single table with one row per event can render `log()`. The questions a
feed asks next are the ones a single table cannot answer from an index:

| Question | One table | Storyfeed |
|---|---|---|
| "What should this row say?" | load each model, per row | the snapshot, eager-loaded |
| "Placed 4 orders" | group by expressions over history, on every read | rows already share a `hash` |
| "Which group does this activity belong to?" | decided on every read | decided once, at publish |
| "Everything involving this order" | `OR` across every role column | one indexed lookup |
| "The order was deleted" | the label is gone | a tombstone keeps the story readable |

The extra rows are written once, when the activity is published. Every read
after that uses them.
