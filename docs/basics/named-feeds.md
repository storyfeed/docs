# Named Feeds

A feed shown to a customer and a feed shown to the kitchen are not the same
feed. Declare each one once, by name, and enter it by that name. When you are
done, every surface reads exactly the verbs it should, and nothing else.

<script setup>
import { who, where, orders, dishes, notes, activity } from '../.vitepress/theme/samples'

const kitchen = [
  activity({ id: 'nf1', verb: 'ready', glyph: 'utensils',
    published_at: '2026-08-14T14:50:00.000000Z',
    headline_template: ':actor marked :object ready',
    actor: who.cook, object: orders.first }),
  activity({ id: 'nf2', verb: 'discussion.asked', glyph: 'message-circle',
    published_at: '2026-08-14T14:40:00.000000Z',
    headline_template: ':actor asked about :target',
    actor: who.customer4, object: notes.spice, target: dishes.chickenCurry }),
  activity({ id: 'nf3', verb: 'confirmed', glyph: 'circle-check',
    published_at: '2026-08-14T14:35:00.000000Z',
    headline_template: ':actor confirmed :object',
    actor: who.cook, object: orders.first }),
  activity({ id: 'nf4', verb: 'placed', glyph: 'shopping-bag',
    published_at: '2026-08-14T14:30:00.000000Z',
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.first, target: where.kitchen }),
  activity({ id: 'nf5', verb: 'menu.price_changed', glyph: 'tag',
    published_at: '2026-08-14T09:10:00.000000Z',
    headline_template: ':actor changed the price of :object',
    actor: who.cook, object: dishes.kottu }),
]

const customer = kitchen.filter(node => ['placed', 'confirmed', 'ready'].includes(node.verb))
</script>

## Declaring a Feed

A feed is a closure over the builder, registered at boot:

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Storyfeed::feeds([
    'customer' => fn (FeedBuilder $feed) => $feed->only(['placed', 'confirmed', 'ready'])->log(),
    'kitchen' => fn (FeedBuilder $feed) => $feed,
]);
```

Enter it by name, from the facade or from the model:

```php
// a controller, or wherever the feed is read
Storyfeed::feed('kitchen')->involving($kitchen)->get();
```

<FeedExample :items="kitchen">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedExample>

```php
// a controller, or wherever the feed is read
$order->storyfeed('customer')->get();
```

<FeedExample :items="customer" />

An unknown name throws `UnknownFeed`. A typo does not fall back to the
unfiltered feed. The verb list binds; the mode does not: `->log()` in a
declaration is a default any call site may override.

## Verbs and Scope

A name carries the **verbs**. It does not carry the **scope**: which rows the
surface may read is still `involving()`, `context()` or `query()`, as on any
builder.

```php
// a controller, or wherever the feed is read
Storyfeed::feed('customer')->get();                     // every order in the system
Storyfeed::feed('customer')->involving($order)->get();  // this order
```

::: danger The scope is the half with no symptom
The first line returns a complete, correct-looking customer timeline built
from other people's orders. [Feed classes](#feed-classes) move the scope into
the declaration, so the unscoped line cannot be written.
:::

## `only()` and `except()`

Both work on any builder, with or without a name:

```php
// a controller, or wherever the feed is read
Storyfeed::feed()->only(['placed', 'ready'])->get();
Storyfeed::feed()->only(['order.*', OrderActivity::PaymentReceived])->get();
Storyfeed::feed()->except(['noted'])->get();
```

| | |
|---|---|
| accepts | verb strings and enum cases, mixed in one list |
| `order.*` | a trailing `*` is a prefix wildcard |
| an unrecognised verb | never throws; a verb nobody records is a query matching nothing |
| `only([])` | throws |
| repeat calls | intersect: `only(A)` then `only(B)` is `A ∩ B` |

Intersection means a call site can only ever cut further:

```php
// still just placed orders: the declared list is a floor
Storyfeed::feed('customer')->only(['placed', 'noted'])->get();
```

Excluded verbs leave the query the whole read is built from, so group counts
recompute inside the filter, and a group whose members are all excluded
produces no node.

## Feed Classes

A closure runs at boot, before any order exists, so it can carry verbs but
not a subject. A class takes its subject as a constructor argument:

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
        $feed->only(['placed', 'confirmed', 'ready'])->log();
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

`CustomerFeed::make()` without its subject is an `ArgumentCountError`, and the
role `scope()` binds cannot be rebound at a call site:

```php
CustomerFeed::make($order)->involving($other);                   // throws FeedMisconfigured
CustomerFeed::make($order)->only(['placed'])->summary();   // fine: narrowing
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
        $feed->except(['noted'])->summary();
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

`CustomerFeed::make($order)` works with an empty registry; registering is
what lets the package inspect the feed.

## What a Feed Does Not Do

A feed is a query filter you route a surface through. It selects rows; it
never hides an activity, and the read path has no visibility layer underneath
it.

- It does not know **who is asking**. `CustomerFeed::make($order)` is the same
  feed whichever customer requests it. That *this* customer may see *this*
  order is a policy question, in the controller where it always was.
- **It filters events, not fields.** An internal detail in a customer-visible
  verb's `data` is still in the payload. What keeps it out is what you record.
- **The write path is untouched.** Recording an internal verb stays legal.
- **Composite parents are not special-cased.** A list admitting a story's
  member verbs but not its own verb drops the parent node, and the members
  read as solo items.
- **The [Activity Streams controller](/deeper/activity-streams) builds its own
  query** and is not filtered by a name.

Prefer `only()` for a customer-facing surface: `except()` admits tomorrow's
verb unless someone adds it, and a wildcard admits a verb the day someone
records it.
