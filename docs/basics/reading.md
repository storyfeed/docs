# Reading Feeds

`Storyfeed::feed()` starts a read, and `get()` returns a page of the feed,
ready to render or to return from a route.

<script setup>
import { who, where, orders, dishes, notes, activity, group } from '../.vitepress/theme/samples'

const placed = (id, at, actor, object) => activity({ id, verb: 'place', glyph: 'shopping-bag',
  published_at: at, headline_template: ':actor placed :object with :target',
  actor, object, target: where.kitchen })

const log = [
  placed('rd4', '2026-08-14T14:30:00.000000Z', who.regular, orders.third),
  placed('rd5', '2026-08-14T14:29:00.000000Z', who.regular, orders.second),
  placed('rd6', '2026-08-14T14:27:00.000000Z', who.regular, orders.first),
  activity({ id: 'rd7', verb: 'publish', glyph: 'chef-hat',
    published_at: '2026-08-14T09:00:00.000000Z',
    headline_template: ':actor put :object on the menu',
    actor: who.cook, object: dishes.kottu }),
]

const repeat = group({ id: 'rd1', verb: 'place', axis: 'repeat', count: 3, glyph: 'shopping-bag',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor placed :count orders with :target',
  actors: [who.regular], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 1, objects: 3, targets: 1 } })

const summary = [repeat, log[3]]

const scoped = [repeat, log[3]]
</script>

## Reading a Feed

Return the feed from a route:

```php
// routes/web.php
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function () {
    return Storyfeed::feed()->limit(20)->get();
});
```

The response is the following JSON:

<FeedExample payload :items="scoped" />

`get()` returns a `FeedPage`, which reads like an array in PHP:
`$page['items']` holds the same nodes. Drawn, the page reads:

<FeedExample context :items="scoped" />

## Read Modes

| Call | Also Called | Returns |
|---|---|---|
| `->log()` | timeline | one node per activity, no groups |
| `->live()` | aggregated, active window | groups as they form |
| `->summary()` | aggregated, collapsed | the best grouping of each burst. **The default** |

The same four activities as a log:

```php
// a controller, or wherever the feed is read
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->involving($kitchen)->log()->get();
```

<FeedExample :items="log" />

And as a summary:

```php
// a controller, or wherever the feed is read
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->involving($kitchen)->summary()->get();
```

<FeedExample :items="summary" />

The payload uses the same node shapes in every mode. A read chooses its mode:

## Scoping

An entity's own page uses `involving()`: every activity that mentions it, in
any role.

```php
// a controller, or wherever the feed is read
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->involving($order)->get();
$order->storyfeed()->get();   // the same read, from the model
```

Narrower filters:

| Call | Returns |
|---|---|
| `->involving($model)` | every activity where the model is actor, object, target, context, origin, result or instrument |
| `->context($kitchen)` | only activities recorded inside that container |
| `->actor($customer)` | only what that customer did |
| `->object($order)` / `->target($kitchen)` | only that exact role |
| `->verb('place')` | one verb |

Scopes combine. A group counts only the activities inside the scope.

::: tip The difference between involving and context
`context()` returns only activities recorded inside a container. "Dish put on
the menu" records the dish as the **object**, so a dish's page scoped with
`context()` misses it. `involving()` finds it.
:::

## Custom Query Constraints

`query()` gives you the activity query, for anything the filters can't
express:

```php
// a controller, or wherever the feed is read
// everything except notes
$kitchen->storyfeed()
    ->query(fn (ActivityBuilder $q) => $q->whereNot('verb', 'note'))
    ->get();

// tonight's service
$kitchen->storyfeed()
    ->query(fn (ActivityBuilder $q) => $q
        ->where('published_at', '>=', today()->setHour(17)))
    ->get();
```

<FeedExample :items="[repeat]" />

The constraint applies to the whole read, groups included. A callback can
only narrow the read: `orWhere` can't reach past the scope, ordering is
ignored, and `limit()` or `offset()` throws. Size the page with `limit()` on
the builder.

## Pagination

Feeds are paginated with cursors, 30 activities to a page by default. Pass the
previous page's `next_cursor` back to get the next one:

```php
// routes/web.php
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function (Request $request) {
    return Storyfeed::feed()
        ->limit(20)
        ->cursor($request->query('cursor'))
        ->get();
});
```

Each response carries what the next request needs:

| Key | What to Do With It |
|---|---|
| `next_cursor` | send it back as `?cursor=` for the next page; `null` on the last page |
| `items` | the page's activities |
| `sync_token` | if it changes between pages, earlier pages were rewritten: start again from the first page |

A cursor only works with the query that made it: the same scope, filters, mode
and `query()` callbacks.

## Conditional Building

`FeedBuilder` is `Conditionable`:

```php
// a controller, or wherever the feed is read
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()
    ->when($request->kitchen, fn ($feed, $kitchen) => $feed->involving($kitchen))
    ->get();
```
