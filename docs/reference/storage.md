# How Storyfeed Stores Your Feed

## Introduction

Storyfeed stores each activity once, in `feed_activities`, and writes
everything a feed needs to read it fast at the moment it is published:
the entities' labels, the groups the activity can join, and an index of
who and what it involves. Reading a feed is then a query over those rows.
Storyfeed does not use Laravel's cache for feed data.

This page follows one publish into the database and one page of the feed
back out. [Schema](/reference/schema) describes each table on its own.

<script setup>
import { scene, logOf, liveOf } from '../.vitepress/theme/world'
const log = logOf(scene.deeper.aggregation.orders)
const repeat = liveOf(log)[0]
</script>

## The Tables

The migrations create nine tables:

<div class="er-wrap">

<svg class="er" viewBox="0 0 724 1075" role="img" aria-labelledby="er-title" xmlns="http://www.w3.org/2000/svg">
<title id="er-title">The nine tables Storyfeed creates, and how they reference each other</title>
<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="ah"/></marker></defs>
<path class="e" d="M380 117 H340 V51 H313" marker-end="url(#arr)"/>
<path class="e d" d="M380 139 H358 V503 H313" marker-end="url(#arr)"/>
<path class="e d" d="M358 363 H313" marker-end="url(#arr)"/>
<path class="e" d="M680 408 H698 V51 H683" marker-end="url(#arr)"/>
<path class="e" d="M680 638 H698 V408"/>
<path class="e d" d="M680 452 H714 V868 H683" marker-end="url(#arr)"/>
<path class="e d" d="M310 853 H350 V846 H377" marker-end="url(#arr)"/>
<text class="el" x="10" y="1045">solid: an id column Storyfeed joins on · dashed: a morph reference, or a key</text>
<text class="el" x="10" y="1063">held in another column · no foreign key constraints are declared</text>
<text class="el" x="676" y="337" text-anchor="end">batch rows: hash = feed_batches.uid</text>
<g transform="translate(380,10)">
<rect class="box" width="300" height="310" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_activities</text>
<text class="c" x="12" y="46">id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">uid</text>
<text class="n" x="288" y="68" text-anchor="end">ULID · unique</text>
<text class="c" x="12" y="90">verb</text>
<text class="n" x="288" y="90" text-anchor="end">index</text>
<text class="c" x="12" y="112">cached_{role}_id</text>
<text class="n" x="288" y="112" text-anchor="end">snapshot × 7</text>
<text class="c" x="12" y="134">{role}_type, {role}_id</text>
<text class="n" x="288" y="134" text-anchor="end">morph × 7</text>
<text class="c" x="12" y="156">data</text>
<text class="n" x="288" y="156" text-anchor="end">json</text>
<text class="c" x="12" y="178">published_at</text>
<text class="n" x="288" y="178" text-anchor="end">timestamp(6)</text>
<text class="c" x="12" y="200">created_at, updated_at</text>
<text class="c" x="12" y="222">deleted_at</text>
<text class="n" x="288" y="222" text-anchor="end">soft delete</text>
<line class="sep" x1="8" x2="292" y1="232" y2="232"/>
<text class="i" x="12" y="248" xml:space="preserve">(published_at, id)</text>
<text class="i" x="12" y="266" xml:space="preserve">({role}_type, {role}_id,</text>
<text class="i" x="12" y="284" xml:space="preserve">   published_at, id)</text>
<text class="i" x="12" y="302" xml:space="preserve">   actor, object, target, context</text>
</g>
<g transform="translate(10,10)">
<rect class="box" width="300" height="234" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_snapshots</text>
<text class="c" x="12" y="46">id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">model_type, model_id</text>
<text class="n" x="288" y="68" text-anchor="end">unique</text>
<text class="c" x="12" y="90">label</text>
<text class="c" x="12" y="112">data, body</text>
<text class="n" x="288" y="112" text-anchor="end">json</text>
<text class="c" x="12" y="134">content, media_type</text>
<text class="c" x="12" y="156">attributed_to</text>
<text class="c" x="12" y="178">shape</text>
<text class="n" x="288" y="178" text-anchor="end">index</text>
<text class="c" x="12" y="200">source_updated_at</text>
<text class="c" x="12" y="222">meta</text>
<text class="n" x="288" y="222" text-anchor="end">json</text>
</g>
<g transform="translate(10,300)">
<rect class="box" width="300" height="124" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_parties</text>
<text class="c" x="12" y="46">id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">key</text>
<text class="n" x="288" y="68" text-anchor="end">unique</text>
<text class="c" x="12" y="90">name, type</text>
<text class="c" x="12" y="112">data</text>
<text class="n" x="288" y="112" text-anchor="end">json</text>
</g>
<g transform="translate(10,440)">
<rect class="box" width="300" height="146" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_tombstones</text>
<text class="c" x="12" y="46">id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">model_type, model_id</text>
<text class="n" x="288" y="68" text-anchor="end">unique</text>
<text class="c" x="12" y="90">restorable, approximate</text>
<text class="n" x="288" y="90" text-anchor="end">bool</text>
<text class="c" x="12" y="112">deleted_at, label</text>
<text class="c" x="12" y="134">meta</text>
<text class="n" x="288" y="134" text-anchor="end">json</text>
</g>
<g transform="translate(380,345)">
<rect class="box" width="300" height="204" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_groupings</text>
<text class="c" x="12" y="46">id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">activity_id</text>
<text class="n" x="288" y="68" text-anchor="end">→ activity</text>
<text class="c" x="12" y="90">bucket</text>
<text class="n" x="288" y="90" text-anchor="end">axis name</text>
<text class="c" x="12" y="112">hash</text>
<text class="n" x="288" y="112" text-anchor="end">group key</text>
<text class="c" x="12" y="134">winner</text>
<text class="n" x="288" y="134" text-anchor="end">bool or null</text>
<line class="sep" x1="8" x2="292" y1="144" y2="144"/>
<text class="i" x="12" y="160" xml:space="preserve">unique (activity_id, bucket)</text>
<text class="i" x="12" y="178" xml:space="preserve">(bucket, hash)</text>
<text class="i" x="12" y="196" xml:space="preserve">(winner, bucket, hash)</text>
</g>
<g transform="translate(380,575)">
<rect class="box" width="300" height="204" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_participants</text>
<text class="c" x="12" y="46">id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">activity_id</text>
<text class="n" x="288" y="68" text-anchor="end">→ activity</text>
<text class="c" x="12" y="90">role</text>
<text class="c" x="12" y="112">entity_type, entity_id</text>
<text class="c" x="12" y="134">published_at</text>
<text class="n" x="288" y="134" text-anchor="end">copied</text>
<line class="sep" x1="8" x2="292" y1="144" y2="144"/>
<text class="i" x="12" y="160" xml:space="preserve">unique (activity_id, role)</text>
<text class="i" x="12" y="178" xml:space="preserve">(entity_type, entity_id,</text>
<text class="i" x="12" y="196" xml:space="preserve">   published_at, activity_id)</text>
</g>
<g transform="translate(380,805)">
<rect class="box" width="300" height="208" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_batches</text>
<text class="c" x="12" y="46">id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">uid</text>
<text class="n" x="288" y="68" text-anchor="end">ULID · unique</text>
<text class="c" x="12" y="90">actor_type, actor_id</text>
<text class="c" x="12" y="112">opened_at, closes_at</text>
<text class="c" x="12" y="134">closed_at</text>
<text class="n" x="288" y="134" text-anchor="end">null = open</text>
<text class="c" x="12" y="156">activities_count</text>
<line class="sep" x1="8" x2="292" y1="166" y2="166"/>
<text class="i" x="12" y="182" xml:space="preserve">(actor_type, actor_id, closed_at)</text>
<text class="i" x="12" y="200" xml:space="preserve">(closed_at, closes_at)</text>
</g>
<g transform="translate(10,790)">
<rect class="box" width="300" height="102" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_batch_locks</text>
<text class="c" x="12" y="46">actor_type, actor_id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">open_batches</text>
<text class="n" x="288" y="68" text-anchor="end">json</text>
<text class="c" x="12" y="90">locked_at</text>
</g>
<g transform="translate(10,640)">
<rect class="box" width="300" height="80" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_meta</text>
<text class="c" x="12" y="46">key</text>
<text class="n" x="288" y="46" text-anchor="end">unique</text>
<text class="c" x="12" y="68">value</text>
<text class="n" x="288" y="68" text-anchor="end">sync_token</text>
</g>
</svg>

</div>

| Table | Rows | Holds |
|---|---|---|
| `feed_activities` | one per activity | the verb, up to seven roles, `data`, and `published_at` |
| `feed_snapshots` | one per entity | the entity's label, data and body, as `toFeed()` returned them |
| `feed_groupings` | several per activity | one row per group the activity can join |
| `feed_participants` | one per filled role | the index `involving()` and `$model->storyfeed()` read |
| `feed_batches` | one per sitting | an actor's activities published close together |
| `feed_batch_locks` | one per batched actor | a row to lock, so concurrent publishes join one batch |
| `feed_parties` | one per party | [named participants](/deeper/parties) with no model |
| `feed_tombstones` | one per deleted entity | what a [deleted model](/deeper/deleted-models)'s activities point to |
| `feed_meta` | a few | the feed's `sync_token` |

Each role is stored as a morph pair, `{role}_type` and `{role}_id`, holding
the model's morph alias and key. Next to it, `cached_{role}_id` points at the
entity's snapshot. The migrations declare no foreign key constraints; the
arrows above are the keys Storyfeed joins on.

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

### Why the Rows Are Copied

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

When stored history changes in a way a client cannot reconcile
(`storyfeed:bundle`, `storyfeed:curate --rehash`, `storyfeed:heal`, a
deletion that repoints activities), Storyfeed writes a new `sync_token` to
`feed_meta`. Every page carries it. See
[Handling a Changed Feed](/basics/reading#handling-a-changed-feed).

`storyfeed:cache` caches your definitions from `routes/feed.php`, not feed
data. See [Caching Definitions](/reference/commands#caching-definitions).

## Costs at Scale

Per activity with an actor, a verb, an object and a target, expect 1 activity
row, 9 grouping rows, and 3 participant rows. `feed_groupings` is the
largest table, at up to nine times `feed_activities`. `feed_snapshots`
grows with your entities, not your activities.

The indexes each read uses:

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

## Why Not a Single Activity Log Table?

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

<style scoped>
.er-wrap { margin: 24px 0; overflow-x: auto; }
.er { display: block; width: 100%; max-width: 724px; margin: 0 auto; height: auto; font-family: var(--vp-font-family-mono); }
.er .box { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-divider); stroke-width: 1.5; }
.er .head { fill: var(--vp-c-brand-soft); }
.er .tn { fill: var(--vp-c-brand-1); font-size: 15px; font-weight: 700; }
.er .c { fill: var(--vp-c-text-1); font-size: 13px; }
.er .n { fill: var(--vp-c-text-2); font-size: 12px; }
.er .i { fill: var(--vp-c-text-2); font-size: 11.5px; }
.er .sep { stroke: var(--vp-c-divider); }
.er .e { fill: none; stroke: var(--vp-c-text-2); stroke-width: 1.5; }
.er .e.d { stroke-dasharray: 5 4; }
.er .ah { fill: var(--vp-c-text-2); }
.er .el { fill: var(--vp-c-text-2); font-size: 12px; font-style: italic; }
</style>
