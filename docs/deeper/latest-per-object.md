# Latest Activity per Object

## Introduction

`latestPer('object')` shows one row per object in a feed: the latest thing
that happened to it. Every activity stays stored, so other feeds still show
all of them.

<script setup>
import { who, where, orders, dishes, party, activity, group } from '../.vitepress/theme/samples'

const placed = (id, at, actor, object) => activity({ id, verb: 'place', glyph: 'shopping-bag',
  published_at: at, headline_template: ':actor placed :object with :target',
  actor, object, target: where.kitchen })

const confirmed = (id, at, object) => activity({ id, verb: 'confirm', glyph: 'circle-check',
  published_at: at, headline_template: ':actor confirmed :object',
  actor: who.cook, object })

const paid = activity({ id: 'lp7', verb: 'pay', glyph: 'credit-card',
  published_at: '2026-08-14T14:52:00.000000Z', headline_template: ':actor marked :object paid',
  actor: party.service, object: orders.first })

const ready = activity({ id: 'lp6', verb: 'ready', glyph: 'utensils',
  published_at: '2026-08-14T14:48:00.000000Z', headline_template: ':actor marked :object ready',
  actor: who.cook, object: orders.first })

const timeline = [
  paid,
  ready,
  confirmed('lp4', '2026-08-14T14:36:00.000000Z', orders.first),
  placed('lp1', '2026-08-14T14:30:00.000000Z', who.regular, orders.first),
]

const board = [
  paid,
  confirmed('lp5', '2026-08-14T14:41:00.000000Z', orders.second),
  placed('lp3', '2026-08-14T14:33:00.000000Z', who.customer4, orders.third),
]

const repriced = group({ id: 'lp8', verb: 'reprice', axis: 'repeat', count: 3, glyph: 'tag',
  published_at: '2026-08-14T11:20:00.000000Z',
  headline_template: ':actor changed the prices of :count dishes',
  actors: [who.cook], objects: [dishes.chickenCurry, dishes.kottu, dishes.roti],
  distinct: { actors: 1, objects: 3 } })
</script>

<a id="showing-the-latest-activity-per-object"></a>

## Reading the Latest Activity

An order is placed, confirmed, marked ready and paid. Its own page shows each
step:

```php memo="A controller, or wherever the feed is read"
$order->storyfeed()->log()->get();
```

<FeedExample :items="timeline" />

The kitchen's board shows each order once, at its latest step:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()
    ->involving($kitchen)
    ->latestPer('object')
    ->log()
    ->get();
```

<FeedExample :items="board" />

Both read the same rows. The board leaves out an order's earlier activities,
and the order's page still shows them.

> [!NOTE]
> **The difference between keepLatest and latestPer**
>
> [`keepLatest()`](/deeper/keeping-the-latest-activity) on a verb decides what is stored, so the earlier activities
> leave every feed. `latestPer()` on a feed decides what that feed shows, and
> the earlier activities stay for every other feed.

<a id="choosing-the-key"></a>

## Choosing Grouping Keys

`latestPer()` takes one role, or several:

| Call | The Feed Shows |
|---|---|
| `latestPer('object')` | the latest activity about each object, whatever its verb |
| `latestPer(['object', 'verb'])` | the latest activity of each verb about each object |
| `latestPer(['object', 'actor'])` | the latest activity by each person about each object |
| `latestPer('target')` | the latest activity about each target |

A key can name any role (`actor`, `object`, `target`, `context`, `origin`,
`result`, `instrument`) and `verb`. An activity with no value in a role the
key names is always shown.

<a id="which-activity-is-the-latest"></a>

## Ordering and Filtering Results

As with Eloquent's `latestOfMany()`, the latest activity is the first one in
the feed's own order: the newest `published_at`, then the highest id.

| When | The Feed Shows |
|---|---|
| a newer activity about the object is published | the newer one, at its own time |
| a newer activity is scheduled for later | the one before it, until the newer one is published |
| the latest activity is deleted | the one before it |
| the feed's other filters leave out the newest activity | the latest one the filters let through |

The key is checked after the feed's other filters. `only(['place', 'ready'])`
with `latestPer('object')` shows each order's latest placing or marking ready,
even when it was paid afterwards.

Pagination works as it does on any feed. A cursor only works with the query
that made it, `latestPer()` included.

<a id="declaring-it-on-a-named-feed"></a>

## Defining a Named Feed

A feed that always shows the latest activity per object says so once:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Storyfeed::feeds([
    'board' => fn (FeedBuilder $feed) => $feed
        ->latestPer('object')
        ->log(),
]);
```

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed('board')->involving($kitchen)->get();
```

<FeedExample :items="board" />

<a id="grouping-the-latest-activities"></a>

## Aggregating Latest Activities

Groups are formed from the activities the feed shows. A cook who changed the
price of three dishes several times each this morning:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()
    ->verb('reprice')
    ->latestPer('object')
    ->live()
    ->get();
```

<FeedExample :items="[repriced]" />

The group holds the latest price change of each dish, so it counts three. A
group left with one activity shows as that activity.
