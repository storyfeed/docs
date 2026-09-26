# Reading Feeds

<script setup>
import { scene, everything, WORLD_ANCHOR, logOf, liveOf, summaryOf } from '../.vitepress/theme/world'

// One week, ending at the shared clock. The same rows drive all three modes.
// Parties and anonymous activities come later in the docs, so only people act here.
const rows = everything()
  .filter(node => Date.parse(node.published_at) >= WORLD_ANCHOR - 7 * 86400000)
  .filter(node => node.actor && node.actor.type !== 'storyfeed.party')
const log = logOf(rows)
const live = liveOf(rows)
const summary = summaryOf(rows)
const weekly = summaryOf(rows, 'week')
const scoped = liveOf(scene.guide.usageExamples.repeatOrders)
</script>

## Introduction

To retrieve a page of activities, call the `feed` method on the `Storyfeed`
facade, followed by the `get` method.

## Reading a Feed

You may return the feed from a route:

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function () {
    return Storyfeed::feed()->limit(20)->get();
});
```

For three order placements, the response contains:

<FeedExample payload :items="scoped" />

The `get` method returns a `FeedPage`. Access its items with `$page['items']`
using PHP array syntax. The rendered feed displays:

<FeedExample :items="scoped" />

<a id="groups"></a>

The three orders appear in one row. A **group** combines related activities,
such as repeated orders by one customer, while retaining its members.
See [Aggregation](/deeper/aggregation) for grouping rules and headlines.

<a id="read-modes"></a>

## Choosing a Read Mode

| Call | Returns |
|---|---|
| `->live()` | groups of repeated actions or activities from several actors with the same target; the default |
| `->summary()` | activities grouped by actor and calendar period, summarized by verb |
| `->log()` | one item per activity, without groups |

The following feeds display the same week of activities in each mode:

### Live

Live mode groups repeated actions and activities from several actors with the
same target. It is the default, so you may omit the `live` method.

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->live()->get();
```

<FeedExample :items="live" days height="520" />

### Summary

Summary mode groups activities by actor and day, with phrases such as
"placed 3 orders, asked about a product and paid". Actors with the same single
activity may share a row. See [Summary Rows](/reference/payload#digest-rows)
for the payload fields.

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->summary()->get();
```

<FeedExample :items="summary" days height="520" />

### Log

Log mode displays each activity in a separate row.

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->log()->get();
```

<FeedExample :items="log" days height="520" />

All modes use the same payload structures.

<a id="choosing-the-period"></a>

### Choosing the Summary Period

The `summary` method groups by day by default. Pass a `Period` to select
another calendar period:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Grouping\Period;

Storyfeed::feed()->summary(Period::Week)->get();
```

<FeedExample :items="weekly" />

| Period | Calendar Period |
|---|---|
| `Period::Hour` | hour |
| `Period::Day` | day; the default |
| `Period::Week` | ISO week, starting Monday |
| `Period::Month` | month |

You may also pass a string, such as `->summary('week')`. Periods use calendar
boundaries in `app.timezone`. To retrieve activities from the last hour, apply a
constraint with the [`query` method](#custom-query-constraints):
`->query(fn ($q) => $q->where('published_at', '>=', now()->subHour()))`.

This period applies only to summary mode. Configure each verb's grouping
period separately; see [Grouping Periods](/deeper/grouping-periods).

## Filtering Activities

<a id="scoping"></a>

### Filtering by Entity or Role

Use the `involving` method to retrieve activities that reference an entity in
any role:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->involving($order)->get();
$order->storyfeed()->get();   // the same read, from the model
```

You may also filter by a specific role:

| Call | Returns |
|---|---|
| `->involving($model)` | activities where the model is actor, object, target, context, origin, result, or instrument |
| `->context($shop)` | activities with the shop in the `context` role |
| `->actor($customer)` | activities performed by the customer |
| `->object($order)` / `->target($shop)` | activities matching the specified role |

Activities must match all applied filters. Group counts include only matching
activities.

> [!NOTE]
> **The difference between involving and context**
>
> The `context` method matches only the context role. An activity that adds a
> product to a menu assigns the product to the object role, so use `involving`
> to include it in the product's feed. See [Containers & Context](/deeper/context).

<a id="filtering-verbs"></a>

### Filtering by Verb

Use the `verb` method to filter by one verb. The `only` and `except` methods
accept lists:

```php memo="A controller, or wherever the feed is read"
use App\Enums\OrderActivity;
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->verb('place')->get();
Storyfeed::feed()->only(['place', 'ready'])->get();
Storyfeed::feed()->only(['re*', OrderActivity::Confirmed])->get(); // matches ready, reprice and confirm
Storyfeed::feed()->except(['note'])->get();
```

| Input | Behaviour |
|---|---|
| a list | accepts verb strings and enum cases together |
| `re*` | matches verbs starting with `re` |
| an unrecognised verb | matches no activities unless that verb has been recorded; does not throw |
| `only([])` or `except([])` | throws an exception |
| repeated calls | activities must match every filter |

Groups include only activities whose verbs match the filter.

### Custom Query Constraints

Use the `query` method to apply custom constraints to the activity query:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Models\Builders\ActivityBuilder;

// everything except notes
$shop->storyfeed()
    ->query(fn (ActivityBuilder $q) => $q->whereNot('verb', 'note'))
    ->get();

// tonight's service
$shop->storyfeed()
    ->query(fn (ActivityBuilder $q) => $q
        ->where('published_at', '>=', today()->setHour(17)))
    ->get();
```

Constraints apply to activities and groups. The callback can only narrow the
results: `orWhere` cannot bypass existing filters, ordering is ignored, and
`limit()` or `offset()` throws an exception. Set the page size with the feed
builder's `limit` method.

<a id="conditional-building"></a>

### Conditional Constraints

Use the `when` method to apply a filter only when a value is present:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()
    ->when($request->shop, fn ($feed, $shop) => $feed->involving($shop))
    ->get();
```

<a id="pagination"></a>

## Paginating Results

Feeds use cursor pagination with 30 items per page by default. Pass the
previous page's `next_cursor` to retrieve the next page:

<a id="reading-the-next-page"></a>

```php memo="routes/web.php"
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function (Request $request) {
    return Storyfeed::feed()
        ->limit(20)
        ->cursor($request->query('cursor'))
        ->get();
});
```

### Handling a Changed Feed

Use these response fields for subsequent requests:

| Key | Usage |
|---|---|
| `next_cursor` | pass as `?cursor=` to retrieve the next page; `null` on the last page |
| `sync_token` | if it changes, discard previously loaded items and request the first page again |

Use a cursor with the same feed constraints, filters, mode, and `query`
callbacks that produced it.
