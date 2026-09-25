# Reading Feeds

<script setup>
import { scene, everything, WORLD_ANCHOR, logOf, liveOf, summaryOf } from '../.vitepress/theme/world'

// One week, ending at the shared clock. The same rows drive all three modes.
const rows = everything().filter(node => Date.parse(node.published_at) >= WORLD_ANCHOR - 7 * 86400000)
const log = logOf(rows)
const live = liveOf(rows)
const summary = summaryOf(rows)
const weekly = summaryOf(rows, 'week')
const scoped = liveOf(scene.guide.usageExamples.repeatOrders)
</script>

## Introduction

`Storyfeed::feed()` starts a read, and `get()` returns a page of the feed,
ready to render or to return from a route.

## Reading a Feed

Return the feed from a route:

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function () {
    return Storyfeed::feed()->limit(20)->get();
});
```

For a feed containing three order placements, the response has this shape:

<FeedExample payload :items="scoped" />

`get()` returns a `FeedPage`, which reads like an array in PHP:
`$page['items']` holds the same nodes. Drawn, the page reads:

<FeedExample :items="scoped" />

<a id="groups"></a>

The three orders share one row. That row is a **group**: one row standing for
several activities that belong together, such as one person placing order after
order. It keeps its members, and it reads as a sentence once the verb has a
group headline. [Aggregation](/deeper/aggregation) covers which activities
group and how their headlines are declared.

<a id="read-modes"></a>

## Choosing a Read Mode

| Call | Also Called | Returns |
|---|---|---|
| `->live()` | aggregated feed | repeats, and several people at one place, as one row each. **The default** |
| `->summary()` | digest | one row per person per day, across everything they did |
| `->log()` | timeline | one node per activity, no groups |

Here is one week of activity across the apps, read three ways. Each feed below
uses the same recorded facts. Groups expand to reveal their members; day
headings keep activity on different days separate. In an application, follow
[cursors](#pagination) to read the whole range; these examples draw the range together.

### Live

Live folds one person's repeated action, and several people doing the same
thing at one place. It is the default, so `->live()` can be left out.

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Models\Builders\ActivityBuilder;

Storyfeed::feed()
    ->query(fn (ActivityBuilder $query) => $query
        ->whereBetween('published_at', [now()->subWeek(), now()]))
    ->live()
    ->get();
```

<FeedExample :items="live" days height="520" />

### Summary

Summary is a digest: one row per person per day, across verbs. A row names
the person once, then what they did, one phrase per verb: "placed 3 orders,
asked about a product and paid". After three phrases, the rest are counted.
"Show all" reveals the row’s included members (up to 25 by default). People whose whole day is one identical
thing share a row. An activity with no actor keeps its own row.

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Models\Builders\ActivityBuilder;

Storyfeed::feed()
    ->query(fn (ActivityBuilder $query) => $query
        ->whereBetween('published_at', [now()->subWeek(), now()]))
    ->summary()
    ->get();
```

<FeedExample :items="summary" days height="520" />

#### Choosing the Period

`summary()` reads one row per person per day. Pass a `Period` for a longer
digest:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Grouping\Period;

Storyfeed::feed()->summary(Period::Week)->get();
```

<FeedExample :items="weekly" />

| Period | One Row per Person per |
|---|---|
| `Period::Hour` | calendar hour |
| `Period::Day` | calendar day. **The default** |
| `Period::Week` | ISO week, starting Monday |
| `Period::Month` | calendar month |

A string works too: `->summary('week')`. Periods are calendar periods in
`app.timezone`, never sliding windows. For "the last hour", filter the read:
`->query(fn ($q) => $q->where('published_at', '>=', now()->subHour()))`.

### Log

The log keeps every activity as its own row.

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Models\Builders\ActivityBuilder;

Storyfeed::feed()
    ->query(fn (ActivityBuilder $query) => $query
        ->whereBetween('published_at', [now()->subWeek(), now()]))
    ->log()
    ->get();
```

<FeedExample :items="log" days height="520" />

The payload uses the same node shapes in every mode. Choose the mode for each surface.

## Filtering Activities

<a id="scoping"></a>

### Filtering by Entity or Role

An entity's own page uses `involving()`: every activity that mentions it, in
any role.

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->involving($order)->get();
$order->storyfeed()->get();   // the same read, from the model
```

Narrower filters:

| Call | Returns |
|---|---|
| `->involving($model)` | every activity where the model is actor, object, target, context, origin, result or instrument |
| `->context($shop)` | only activities recorded inside that container |
| `->actor($customer)` | only what that customer did |
| `->object($order)` / `->target($shop)` | only that exact role |
| `->verb('place')` | one verb |

Scopes combine. A group counts only the activities inside the scope.

> [!NOTE]
> **The difference between involving and context**
>
> `context()` returns only activities recorded inside a container. "Product put on
> the menu" records the product as the **object**, so a product's page scoped with
> `context()` misses it. `involving()` finds it.
### Custom Query Constraints

`query()` gives you the activity query, for anything the filters can't
express:

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

The constraint applies to the whole read, groups included. A callback can
only narrow the read: `orWhere` can't reach past the scope, ordering is
ignored, and `limit()` or `offset()` throws. Size the page with `limit()` on
the builder.

<a id="conditional-building"></a>

### Conditional Constraints

`FeedBuilder` is `Conditionable`:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()
    ->when($request->shop, fn ($feed, $shop) => $feed->involving($shop))
    ->get();
```

<a id="pagination"></a>

## Paginating Results

Feeds are paginated with cursors, 30 rows to a page by default. Pass the
previous page's `next_cursor` back to get the next one:

### Reading the Next Page

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

Each response carries what the next request needs:

| Key | What to Do With It |
|---|---|
| `next_cursor` | send it back as `?cursor=` for the next page; `null` on the last page |
| `items` | the page's activities |
| `sync_token` | if it changes between pages, earlier pages were rewritten: start again from the first page |

A cursor only works with the query that made it: the same scope, filters, mode
and `query()` callbacks.
