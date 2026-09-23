# Named Feeds

A named feed is a list of verbs you declare once and read by name. A
customer's order page and the kitchen's screen each read their own feed, and
each shows only the verbs declared for it.

<script setup>
import { who, where, orders, dishes, notes, activity } from '../.vitepress/theme/samples'

const kitchen = [
  activity({ id: 'nf1', verb: 'ready', glyph: 'utensils',
    published_at: '2026-08-14T14:50:00.000000Z',
    headline_template: ':actor marked :object ready',
    actor: who.cook, object: orders.first }),
  activity({ id: 'nf2', verb: 'ask', glyph: 'message-circle',
    published_at: '2026-08-14T14:40:00.000000Z',
    headline_template: ':actor asked about :target',
    actor: who.customer4, object: notes.spice, target: dishes.chickenCurry }),
  activity({ id: 'nf3', verb: 'confirm', glyph: 'circle-check',
    published_at: '2026-08-14T14:35:00.000000Z',
    headline_template: ':actor confirmed :object',
    actor: who.cook, object: orders.first }),
  activity({ id: 'nf4', verb: 'place', glyph: 'shopping-bag',
    published_at: '2026-08-14T14:30:00.000000Z',
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.first, target: where.kitchen }),
  activity({ id: 'nf5', verb: 'reprice', glyph: 'tag',
    published_at: '2026-08-14T09:10:00.000000Z',
    headline_template: ':actor changed the price of :object',
    actor: who.cook, object: dishes.kottu }),
]

const customer = kitchen.filter(node => ['place', 'confirm', 'ready'].includes(node.verb))
</script>

## Declaring a Feed

A feed is a closure over the builder, registered at boot:

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Storyfeed::feeds([
    'customer' => fn (FeedBuilder $feed) => $feed->only(['place', 'confirm', 'ready'])->log(),
    'kitchen' => fn (FeedBuilder $feed) => $feed,
]);
```

Enter it by name, from the facade or from the model:

```php
// a controller, or wherever the feed is read
Storyfeed::feed('kitchen')->involving($kitchen)->get();
```

<FeedExample context :items="kitchen">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedExample>

```php
// a controller, or wherever the feed is read
$order->storyfeed('customer')->get();
```

<FeedExample :items="customer" />

An unknown name throws `UnknownFeed`. The verb list is fixed, but the mode is
not: `->log()` in a declaration is a default any call site may override.

## Verbs and Scope

A name carries the **verbs**, not the **scope**. Which rows a surface reads is
still set by `involving()`, `context()` or `query()`:

```php
// a controller, or wherever the feed is read
Storyfeed::feed('customer')->get();                     // every order in the system
Storyfeed::feed('customer')->involving($order)->get();  // this order
```

::: danger
The first line returns a correct-looking customer timeline built from other
people's orders. [Feed classes](#feed-classes) put the scope in the
declaration, so the unscoped line cannot be written.
:::

## `only()` and `except()`

Both work on any builder, with or without a name:

```php
// a controller, or wherever the feed is read
Storyfeed::feed()->only(['place', 'ready'])->get();
Storyfeed::feed()->only(['re*', OrderActivity::Confirmed])->get();   // ready, reprice, confirm
Storyfeed::feed()->except(['note'])->get();
```

| | |
|---|---|
| accepts | verb strings and enum cases, mixed in one list |
| `re*` | a trailing `*` is a prefix wildcard |
| an unrecognised verb | never throws; a verb nobody records is a query matching nothing |
| `only([])` | throws |
| repeat calls | intersect: `only(A)` then `only(B)` is `A ∩ B` |

A call site can only narrow a declared list:

```php
// reads only 'place': 'note' is not in the declared list
Storyfeed::feed('customer')->only(['place', 'note'])->get();
```

Group counts only count the verbs the filter admits, and a group whose
members are all excluded produces no node.

## Feed Classes

A closure runs at boot, before any order exists, so it can carry verbs but
not a subject. A feed class takes its subject in the constructor:

```php
<?php

namespace App\Feeds;

use App\Models\Order;
use Storyfeed\Feed;
use Storyfeed\FeedBuilder;

class CustomerFeed extends Feed
{
    public function __construct(protected Order $order) {}

    public function define(FeedBuilder $feed): void
    {
        $feed->only(['place', 'confirm', 'ready'])->log();
    }

    protected function scope(FeedBuilder $feed): void
    {
        $feed->involving($this->order);
    }
}
```

```php
// a controller, or wherever the feed is read
CustomerFeed::make($order)->get();
```

<FeedExample :items="customer" />

Generate one with `php artisan make:feed Customer --subject=App\Models\Order`.

| Hook | Declares | May Read Constructor State |
|---|---|---|
| `define()` | what the feed is about: verbs, mode, limit | no |
| `scope()` | the values only a request supplies | yes |

`CustomerFeed::make()` without its subject throws `ArgumentCountError`. A call
site cannot rebind what `scope()` set, but may narrow:

```php
// a controller, or wherever the feed is read
CustomerFeed::make($order)->involving($other);            // throws FeedMisconfigured
CustomerFeed::make($order)->only(['place'])->summary();   // fine
```

A feed with no subject declares no constructor and no `scope()`:

```php
<?php

namespace App\Feeds;

use Storyfeed\Feed;
use Storyfeed\FeedBuilder;

class KitchenFeed extends Feed
{
    public function define(FeedBuilder $feed): void
    {
        $feed->except(['note'])->summary();
    }
}
```

```php
// a controller, or wherever the feed is read
KitchenFeed::make()->get();
```

Register classes and closures in one list:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::feeds([
    'customer' => CustomerFeed::class,     // named explicitly
    KitchenFeed::class,                    // name derived: 'kitchen'
    'pulse' => fn (FeedBuilder $feed) => $feed->only(['order.*'])->live(),
]);
```

`CustomerFeed::make($order)` works without registering; registering lets the
package inspect the feed.

## Feeds and Access Control

A feed is a query filter. It selects rows; there is no visibility layer under
it.

- It does not know **who is asking**. Whether *this* customer may see *this*
  order is a policy check in your controller.
- It filters **verbs, not fields**. Anything in an admitted verb's `data` is in
  the payload.
- It does not restrict **recording**. Any verb can still be recorded.
- A list that admits a composite's member verbs but not its own verb drops the
  parent node, and the members read as single rows.
- The [Activity Streams controller](/deeper/activity-streams) is not filtered
  by a name.

For a customer-facing surface, use `only()`: `except()` and wildcards admit
every new verb as soon as it is recorded.
