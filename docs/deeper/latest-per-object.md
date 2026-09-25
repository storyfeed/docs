# Latest Activity per Object

## Introduction

`latestPer('object')` shows one row per object in a feed: the latest thing
that happened to it. Every activity stays stored, so other feeds still show
all of them.

<script setup>
import { scene, logOf, liveOf } from '../.vitepress/theme/world'
const timeline = logOf(scene.deeper.latestPerObject.timeline)
const board = logOf(scene.deeper.latestPerObject.board)
const confirmed = liveOf(scene.deeper.latestPerObject.confirmations)[0]
</script>

<a id="showing-the-latest-activity-per-object"></a>

## Reading the Latest Activity

An order is placed, confirmed, marked ready and paid. Its own page shows each
step:

```php memo="A controller, or wherever the feed is read"
$order->storyfeed()->log()->get();
```

<FeedExample :items="timeline" />

The shop's board shows each order once, at its latest step:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()
    ->involving($shop)
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

Storyfeed::feed('board')->involving($shop)->get();
```

<FeedExample :items="board" />

<a id="grouping-the-latest-activities"></a>

## Aggregating Latest Activities

Groups are formed from the activities the feed shows. A staff member who confirmed three orders several times each:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()
    ->verb('confirm')
    ->latestPer('object')
    ->live()
    ->get();
```

<FeedExample :items="[confirmed]" />

The group holds the latest confirmation of each order, so it counts three. A
group left with one activity shows as that activity.
