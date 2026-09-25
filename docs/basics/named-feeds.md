# Named Feeds

A named feed is a list of verbs you declare once and read by name. A
customer's order page and the kitchen's screen can each read their own.

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

Register each feed as a closure over the builder:

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Storyfeed::feeds([
    'customer' => fn (FeedBuilder $feed) => $feed
        ->only(['place', 'confirm', 'ready'])
        ->log(),
    'kitchen' => fn (FeedBuilder $feed) => $feed,
]);
```

Read it by name, from the facade or from the model:

```php
// a controller, or wherever the feed is read
use Storyfeed\Facades\Storyfeed;

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

An unknown name throws `UnknownFeed`. A call site may change the mode, but not
add verbs.

## Verbs and Scope

A name sets the **verbs**, not the **scope**. Scope each read with
`involving()`, `context()` or `query()`:

```php
// a controller, or wherever the feed is read
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed('customer')->get();                     // every order in the system
Storyfeed::feed('customer')->involving($order)->get();  // this order
```

::: danger
The first line shows a customer other people's orders.
[Feed classes](#feed-classes) put the scope in the declaration, so it can't be
forgotten.
:::

## Filtering Verbs

Both work on any read, named or not:

```php
// a controller, or wherever the feed is read
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->only(['place', 'ready'])->get();
// ready, reprice, confirm
Storyfeed::feed()->only(['re*', OrderActivity::Confirmed])->get();
Storyfeed::feed()->except(['note'])->get();
```

| | |
|---|---|
| accepts | verb strings and enum cases, mixed in one list |
| `re*` | a trailing `*` is a prefix wildcard |
| an unrecognised verb | never throws; a verb nobody records is a query matching nothing |
| `only([])` | throws |
| repeat calls | intersect: `only(A)` then `only(B)` is `A ∩ B` |

On a named feed, `only()` can only narrow the declared list:

```php
// a controller, or wherever the feed is read
use Storyfeed\Facades\Storyfeed;

// reads only 'place': 'note' is not in the declared list
Storyfeed::feed('customer')->only(['place', 'note'])->get();
```

Groups count only the verbs the filter lets through.

## Feed Classes

A closure can't know which order it's for. A feed class takes that subject in
its constructor:

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

A call site can't change what `scope()` set, but may narrow the read:

```php
// a controller, or wherever the feed is read
// throws FeedMisconfigured
CustomerFeed::make($order)->involving($other);

// fine
CustomerFeed::make($order)->only(['place'])->summary();
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
use Storyfeed\Facades\Storyfeed;

Storyfeed::feeds([
    'customer' => CustomerFeed::class,     // named explicitly
    KitchenFeed::class,                    // name derived: 'kitchen'
    'pulse' => fn (FeedBuilder $feed) => $feed->only(['place', 'ready'])->live(),
]);
```

A feed class works without registering. Registering gives it a name.

## Feeds and Access Control

A feed only filters rows.

- It doesn't know **who is asking**. Whether this customer may see this order
  is a policy check in your controller.
- It filters **verbs, not fields**. Everything in a shown activity's `data` is
  in the payload.
- The [Activity Streams controller](/deeper/activity-streams) ignores feed
  names.

For a customer-facing screen, use `only()`. `except()` and wildcards let in
every new verb as soon as it's recorded.
