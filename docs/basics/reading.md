<a id="reading-feeds"></a>

# Retrieving Feeds

<script setup>
import { scene, everything, WORLD_ANCHOR, logOf, liveOf } from '../.vitepress/theme/world'

// One week, ending at the shared clock. The same rows drive both modes.
// Parties and anonymous activities come later in the docs, so only people act here.
const rows = everything()
  .filter(node => Date.parse(node.published_at) >= WORLD_ANCHOR - 7 * 86400000)
  .filter(node => node.actor && node.actor.type !== 'storyfeed.party')
const log = logOf(rows)
const live = liveOf(rows)
const scoped = liveOf(scene.guide.usageExamples.repeatOrders)
const repeated = scoped[0]
const filterRows = logOf([
  ...scene.cookbook.transitions.timeline,
  scene.basics.activityContent.ready,
  scene.cookbook.pricing[1], scene.question, scene.basics.reading.note,
  ...scene.deeper.aggregation.contexts,
])
const same = (a, b) => a && b && a.type === b.type && a.id === b.id
const involving = entity => filterRows.filter(row =>
  ['actor', 'object', 'target', 'context', 'origin', 'result', 'instrument', 'location', 'generator'].some(role => same(row[role], entity)))
const shopRows = involving(scene.order.target)
const sinceFive = WORLD_ANCHOR - 2 * 60 * 60 * 1000
const pages = [logOf(scene.guide.usageExamples.repeatOrders).slice(0, 2), logOf(scene.guide.usageExamples.repeatOrders).slice(2)]
</script>

## Introduction

To retrieve a page of activities, call the `feed` method on the `Storyfeed`
facade, followed by the `get` method.

<a id="reading-a-feed"></a>

## Retrieving a Feed

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

The `get` method returns a Laravel collection of `Storyfeed\Support\FeedItem`
instances, so a route that returns it responds with a JSON array of items. The
rendered feed displays:

<FeedExample :items="scoped" />

<a id="groups"></a>

The three orders appear in one row. A **group** combines related activities,
such as repeated orders by one customer, while retaining its members.
See [Aggregation](/deeper/aggregation) for grouping rules and headlines.

<a id="read-modes"></a>

## Choosing a Read Mode

| Call | Returns |
|---|---|
| `->live()` | one-action bursts; the default |
| `->log()` | one item per activity, without groups |

The following feeds display the same week of activities in each mode:

<a id="summary"></a>
<a id="choosing-the-period"></a>
<a id="choosing-the-summary-period"></a>

### Live

Live groups the same action into one row until a quiet gap closes the burst.
It is the default, so you may omit `live()`. See
[Aggregation](/deeper/aggregation#built-in-axes) for which activities share a row
and [Live Burst Windows](/deeper/grouping-periods) to set the window.
Which activities share a row, and when, is experimental and keeps improving
behind the [payload contract](/reference/payload#group-nodes).

```php memo="A controller, or wherever the feed is retrieved"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->live()->get();
```

<FeedExample :items="live" days height="520" />

See [Choosing What to Group](/cookbook/choosing-what-to-group) when deciding
which events belong in an overview and which need individual rows.

### Log

Log mode returns one item per activity.

```php memo="A controller, or wherever the feed is retrieved"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->log()->get();
```

<FeedExample :items="log" days height="520" />

Both modes return the same payload shape.

## Filtering Activities

The filtering examples use this set of activities:

<FeedExample :items="filterRows" days height="420" />

<a id="scoping"></a>

### Filtering by Entity or Role

Use the `involving` method to retrieve activities that reference an entity in
any role:

```php memo="routes/web.php"
use App\Models\Order;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/orders/{order}/feed', function (Order $order) {
    return Storyfeed::feed()->involving($order)->get();
});
```

For the order in the sample, the filter keeps its placements, confirmation and readiness activity:

<FeedExample :items="liveOf(involving(scene.order.object))" />

Inside that route, the model provides the same query:

```php memo="routes/web.php" at="order feed route"
// Retrieve the same activities through the model.
return $order->storyfeed()->get();
```

<FeedExample :items="liveOf(involving(scene.order.object))" />

`involving($ancestor)` also includes activity anywhere beneath an ancestor's
recorded parent hierarchy: task → list → folder → project → workspace → tenant
is retrieved with `involving($tenant)`. Use `involvingDirectly($tenant)` to
exclude that hierarchy. See [Distant Relations](/deeper/distant-relations)
for parent declarations and depth limits.

You may also filter by a specific role:

| Call | Returns |
|---|---|
| `->involving($model)` | activities where the model holds any role, or is a recorded ancestor |
| `->involvingDirectly($model)` | the same, without recorded ancestors; also written `->involving($model, deep: false)` |
| `->context($shop)` | activities with the shop in the `context` role |
| `->actor($customer)` | activities performed by the customer |
| `->object($order)` / `->target($shop)` | activities matching the specified role; `origin()`, `result()`, `instrument()`, `location()` and `generator()` filter the remaining roles the same way |
| `->objectType(Order::class)` | activities whose object is any order; every role has a `…Type()` method that accepts a model class, a model, a morph alias, or a list of them |
| `->involvingType(Order::class)` | activities involving any order, as `involving()` does for one model; `deep: false` excludes recorded ancestors |

Filters on different roles apply together. Group counts include only matching
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

```php memo="A controller, or wherever the feed is retrieved"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->verb('place')->get();
```

<FeedExample :items="liveOf(filterRows.filter(row => row.verb === 'place'))" />

```php memo="A controller, or wherever the feed is retrieved"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->only(['place', 'ready'])->get();
```

<FeedExample :items="liveOf(filterRows.filter(row => ['place', 'ready'].includes(row.verb)))" />

```php memo="A controller, or wherever the feed is retrieved"
use App\Enums\OrderActivity;
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->only(['re*', OrderActivity::Confirmed])->get();
```

This matches `ready`, `reprice` and `confirm` in the sample:

<FeedExample :items="liveOf(filterRows.filter(row => row.verb.startsWith('re') || row.verb === 'confirm'))" />

```php memo="A controller, or wherever the feed is retrieved"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->except(['note'])->get();
```

The note is omitted; the other activities remain:

<FeedExample :items="liveOf(filterRows.filter(row => row.verb !== 'note'))" />

| Input | Behaviour |
|---|---|
| a list | accepts verb strings and enum cases together |
| `re*` | matches verbs starting with `re` |
| an unrecognised verb | matches no activities unless that verb has been recorded; does not throw |
| `only([])` or `except([])` | throws an exception |
| repeated `only()` / `except()` calls | activities must match every accumulated filter |
| repeated `verb()` calls | the last value replaces the previous verb |

Groups include only activities whose verbs match the filter.

### Custom Query Constraints

Use the `query` method to apply custom constraints to the activity query:

```php memo="routes/web.php"
use App\Models\Shop;
use Illuminate\Support\Facades\Route;
use Storyfeed\Models\Builders\ActivityBuilder;

Route::get('/shops/{shop}/feed', function (Shop $shop) {
    return $shop->storyfeed()
        ->query(fn (ActivityBuilder $query) => $query->whereNot('verb', 'note'))
        ->get();
});
```

For the sample shop, this excludes notes while retaining its other activities:

<FeedExample :items="liveOf(shopRows.filter(row => row.verb !== 'note'))" />

To limit that route to activities published since 5 pm, replace its return
expression with:

```php memo="routes/web.php" at="shop feed route"
use Storyfeed\Models\Builders\ActivityBuilder;

// Activities published since 5 pm today.
return $shop->storyfeed()
    ->query(fn (ActivityBuilder $query) => $query
        ->where('published_at', '>=', today()->setHour(17)))
    ->get();
```

In the sample, only the questions after 5 pm remain:

<FeedExample :items="liveOf(shopRows.filter(row => Date.parse(row.published_at) >= sinceFive))" />

Constraints apply to activities and groups. The callback can only narrow the
results: `orWhere` cannot bypass existing filters, ordering is ignored, and
`limit()` or `offset()` throws an exception. Set the page size with the feed
builder's `limit` method.

<a id="conditional-building"></a>

### Conditional Constraints

Use the `when` method to apply a filter only when a value is present:

```php memo="routes/web.php"
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Route::get('/feed', function (Request $request) {
    $input = $request->validate(['shop' => ['nullable', 'integer', 'exists:shops,id']]);
    $shop = isset($input['shop']) ? Shop::find($input['shop']) : null;

    return Storyfeed::feed()
        ->when($shop, fn (FeedBuilder $feed, Shop $shop) => $feed->involving($shop))
        ->get();
});
```

With the sample shop selected, only activities involving it remain:

<FeedExample :items="liveOf(shopRows)" />

Without `shop`, the query returns the whole sample:

<FeedExample :items="liveOf(filterRows)" />

<a id="pagination"></a>

## Paginating Results

To paginate a feed, call the `cursorPaginate` method. It returns a
`Storyfeed\FeedPaginator`, Laravel's cursor paginator, and retrieves the cursor
from the current request:

<a id="reading-the-next-page"></a>

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function () {
    return view('feed', [
        'page' => Storyfeed::feed()->log()->cursorPaginate(2),
    ]);
});
```

The argument specifies the number of items per page. If you omit it, the
paginator uses the builder's limit, which defaults to 30. Iterating over the
paginator returns `Storyfeed\Support\FeedItem` instances.

To display pagination links in Blade, call the `links` method:

```blade memo="resources/views/feed.blade.php"
@foreach ($page as $item)
    {{ $item->headline() }}
@endforeach

{{ $page->links() }}
```

With a page size of two in log mode, the three placements split across two
pages. Page one contains the newest two:

<FeedExample :items="pages[0]" />

Follow `$page->nextPageUrl()` to retrieve the remaining placement:

<FeedExample :items="pages[1]" />

The paginator uses Laravel's simple pagination views, including any views you
have customized in your application. Feeds paginate forward only, so the
previous-page link is disabled: `previousPageUrl` returns `null`, and
`nextPageUrl` returns `null` on the last page. See
[Storage Architecture](/reference/storage#pagination) for what a cursor holds.

### Customizing Pagination URLs

To use a different query string parameter, pass its name as the second argument:

```php
use Storyfeed\Facades\Storyfeed;

$page = Storyfeed::feed()->cursorPaginate(15, 'feed_cursor');
```

Use the `withQueryString` method to include the current request's query string
in pagination links. You may also append specific values or a URL fragment:

```php
use Storyfeed\Facades\Storyfeed;

$page = Storyfeed::feed()->cursorPaginate(15)->withQueryString();

$page->appends(['filter' => 'mine'])->fragment('activity');
```

### Simple Pagination

The `simplePaginate` method returns numbered pages with no total, as Laravel's
`simplePaginate` does. It reads the page number from the `page` query string
parameter:

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function () {
    return view('feed', [
        'page' => Storyfeed::feed()->simplePaginate(15),
    ]);
});
```

New activities arrive at the top of a feed, so a numbered page shifts while a
reader moves through it, and an item can appear on two pages. A cursor does
not shift, so prefer `cursorPaginate`.

There is no `paginate` method. A total would mean counting the whole grouped
feed, so calling it throws an exception that says so and names
`cursorPaginate` and `simplePaginate`.

### Returning JSON

Returning the paginator from a route responds with Laravel's cursor paginator
JSON: the items in `data`, then `path`, `per_page`, `next_cursor`,
`next_page_url`, `prev_cursor`, and `prev_page_url`. Two keys follow, the way
an API resource's `additional` method adds them: `payload_version` and
`sync_token`.

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/feed', function () {
    return Storyfeed::feed()->cursorPaginate(2);
});
```

For the three placements, page one responds with:

<FeedExample payload paginated :items="pages[0]" />

| Key | Page One | Next Page |
|---|---|---|
| `data` | the two newest placements | the remaining placement |
| `next_cursor` | an opaque string | `null` |
| `next_page_url` | the URL containing that cursor | `null` |
| `prev_cursor`, `prev_page_url` | `null` | `null` |
| `payload_version` | `1` | `1` |
| `sync_token` | the feed's token, or `null` | the same token while the feed's history is unchanged |

`simplePaginate` responds with Laravel's simple paginator JSON, the items in
`data`, followed by the same two keys.

Cursor strings are opaque. Pass them back unchanged without decoding or
constructing them. In PHP, the paginator's `nextCursor` method returns a
Laravel cursor object, its `encode` method returns the string, and the
`syncToken` method returns the sync token.

### Paginating Without a Request

For jobs and commands, pass the cursor as the third argument. The paginator's
`nextCursor` method returns the cursor for the next page, or `null` on the last
page:

```php memo="A job or a command"
use Storyfeed\Facades\Storyfeed;

$cursor = null;

do {
    $page = Storyfeed::feed()->cursorPaginate(100, cursor: $cursor);

    foreach ($page as $item) {
        // ...
    }
} while ($cursor = $page->nextCursor());
```

### Handling a Changed Feed

Use these response keys for subsequent requests:

| Key | Usage |
|---|---|
| `next_cursor` | pass as `?cursor=` to retrieve the next page; `null` on the last page |
| `sync_token` | if it changes, discard previously loaded items and request the first page again |

Use a cursor with the same feed constraints, filters, mode, and `query`
callbacks that produced it.

<a id="group-members"></a>

## Paginating a Group's Members

A group node carries its newest members in `children`, up to
`grouping.children_limit`. When `children_truncated` is `true`, pass the
group's `id` to the `members` method to page through all of them:

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/feed/groups/{group}', function (string $group) {
    return Storyfeed::feed()->members($group, 50);
});
```

The `members` method returns a `FeedPaginator`, as `cursorPaginate` does, with
the members as activity nodes, newest first. It accepts the same per-page,
cursor name and cursor arguments. Members are read through the feed you call it
on, with its filters and scope, so a reader never sees a member that feed would
not show. A member whose model was deleted is still listed, as a tombstone.

## The Payload

The feed payload is a JSON document containing activity and group items,
ordered newest first. See [The Payload Contract](/reference/payload) for all fields.

<a id="the-envelope"></a>

### Paginated Responses

A paginated page containing one activity has this payload:

<FeedExample payload paginated :items="[scene.order]" />

The items are in `data`. Pass `next_cursor` to retrieve the next page. See
[Paginating Results](#pagination) and
[Response Envelope](/reference/payload#response-envelope) for all response keys.

<a id="one-activity"></a>

### Activity Items {#activity-nodes}

The following item represents a customer placing an order:

<FeedExample expanded :items="[scene.order]" />

<a id="entity-fields"></a>
<a id="activities-by-a-payment-provider"></a>
<a id="parties-and-missing-actors"></a>

Each role contains an entity with fields such as `type`, `id`, `label`, and
`link`. See [Entities](/reference/payload#entities) for the complete structure.
An empty role is `null`.

<a id="group-nodes"></a>

### Group Items {#group-nodes}

A [group](/basics/reading#groups) represents several activities in one item.
This example groups three orders placed by one customer:

<FeedExample expanded :items="[repeated]" />

<a id="repeated-activities"></a>
<a id="activities-by-several-people"></a>
<a id="activities-by-several-actors"></a>
<a id="digest-rows"></a>

The `count` field contains the activity count. The `distinct` field counts
entities in each role, while `sample` contains a limited selection. `children`
holds the newest members; [`members`](#group-members) pages through the rest.
[Live](/basics/reading#live) combines one action within a burst. See
[Group Items](/reference/payload#group-nodes) for the fields.

<a id="activity-content"></a>
<a id="quoted-text"></a>
<a id="entity-bodies"></a>
<a id="a-photograph"></a>
<a id="media"></a>
<a id="data-and-presentation"></a>
<a id="presentation-values"></a>

These items also contain quoted text, bodies, and images. See
[Activity Content](/basics/activity-content) for their payloads and
[Blade](/ui/blade), [Vue](/ui/vue), or [React](/ui/react) to display them.
