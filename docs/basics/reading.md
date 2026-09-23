# Reading Feeds

`Storyfeed::feed()` starts a read. You narrow it, choose a mode, and `get()`
returns a page of nodes, ready to render or to return from a route.

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
Route::get('/', function () {
    return Storyfeed::feed()->limit(20)->get();
});
```

The response is the following JSON:

<FeedExample payload :items="scoped" />

`get()` returns a `FeedPage`. It is `Arrayable`, `JsonSerializable`,
`Responsable` and read-only `ArrayAccess`, so in PHP `$page['items']` holds
the same nodes as `items` in the JSON. Drawn, the same page reads:

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
Storyfeed::feed()->involving($kitchen)->log()->get();
```

<FeedExample :items="log" />

And as a summary:

```php
// a controller, or wherever the feed is read
Storyfeed::feed()->involving($kitchen)->summary()->get();
```

<FeedExample :items="summary" />

The app-wide default is `grouping.default` in the config, and a call
overrides it. The payload does not name the mode, so a renderer draws every
mode the same way.

**A mode is chosen per surface, not per app.** One app often uses all three:

| Surface | Mode | Why |
|---|---|---|
| an audit or support view | `log()` | every row is evidence |
| a screen someone watches while working | `live()` | bursts collapse as they form, and nothing reshuffles under the reader |
| a page opened once, days later | `summary()` | the reader wants the shape of what happened |

## Scoping

An entity's own page wants `involving()`: every activity that mentions it, in
any role.

```php
// a controller, or wherever the feed is read
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

Scopes combine. Group counts are recomputed within the scope: a group of four
whose two members fall inside the kitchen arrives as a group of two on that
kitchen's page.

::: tip The difference between involving and context
`context()` returns only activities recorded inside a container. "Dish put on
the menu" records the dish as the **object**, so a page scoped with `context()`
misses it. An entity's own page uses `involving()`.
:::

## Custom Constraints with `query()`

`query()` hands you the underlying activity query, for anything the filters
cannot express:

```php
// a controller, or wherever the feed is read
// everything except notes
$kitchen->storyfeed()
    ->query(fn (ActivityBuilder $q) => $q->whereNot('verb', 'note'))
    ->get();

// tonight's service
$kitchen->storyfeed()
    ->query(fn (ActivityBuilder $q) => $q->where('published_at', '>=', today()->setHour(17)))
    ->get();
```

<FeedExample :items="[repeat]" />

Callbacks compose, and the constraint applies to the whole read, including
group children and group counts.

- `limit()` or `offset()` inside the callback throws. Size the page with
  `limit()` on the builder.
- Ordering inside the callback is ignored. The read owns its ordering, because
  the cursor encodes a position in it.
- A callback only narrows. Each one is wrapped in its own `where` group, so an
  `orWhere` inside it cannot reach past the scope.

## Pagination

Pass the previous page's `next_cursor` back:

```php
// a controller, or wherever the feed is read
// Cursors are opaque: store them, never parse them.
// The end of the feed is next_cursor === null. An empty items array is not the
// end; a page can return zero items with a live cursor, so follow it while
// empty, bounded to a few hops.
$page = Storyfeed::feed()->cursor($request->query('cursor'))->get();
```

A cursor is a position in the stream **this** query produced: its scope, its
filters, its mode. Send it back with the same query, including the same
`query()` callbacks. Applied to a different query it does not error; it skips
or repeats nodes.

## Conditional Building

`FeedBuilder` is `Conditionable`:

```php
// a controller, or wherever the feed is read
Storyfeed::feed()
    ->when($request->kitchen, fn ($feed, $kitchen) => $feed->involving($kitchen))
    ->get();
```
