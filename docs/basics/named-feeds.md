# Named Feeds

<script setup>
import { scene, logOf, liveOf } from '../.vitepress/theme/world'

const shop = liveOf(scene.basics.namedFeeds.shop)
const customer = logOf(scene.basics.namedFeeds.shop.filter(node =>
  ['place', 'confirm', 'ready'].includes(node.verb) && node.object?.id === scene.order.object.id))
</script>

## Introduction

A named feed is a list of verbs you declare once and read by name. A
customer's order page and the shop's screen can each read their own.

## Defining Named Feeds

<a id="declaring-a-feed"></a>

### Registering a Closure

Register each feed as a closure over the builder:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Storyfeed::feeds([
    'customer' => fn (FeedBuilder $feed) => $feed
        ->only(['place', 'confirm', 'ready'])
        ->log(),
    'shop' => fn (FeedBuilder $feed) => $feed,
]);
```

### Reading a Named Feed

Read it by name, from the facade or from the model:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed('shop')->involving($shop)->get();
```

<FeedExample :items="shop" />

```php memo="A controller, or wherever the feed is read"
$order->storyfeed('customer')->get();
```

<FeedExample :items="customer" />

An unknown name throws `UnknownFeed`. A call site may change the mode, but not
add verbs.

<a id="verbs-and-scope"></a>

### Scoping Closure Feeds

A name sets the **verbs**, not the **scope**. Scope each read with
`involving()`, `context()` or `query()`:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed('customer')->get();                     // every order in the system
Storyfeed::feed('customer')->involving($order)->get();  // this order
```

> [!WARNING]
> The first line shows a customer other people's orders.
> [Feed classes](#feed-classes) put the scope in the declaration, so it can't be
> forgotten.

## Generating Feed Classes

Generate a feed class when each read needs a subject, such as an order:

```bash
php artisan make:feed Customer --subject='App\Models\Order' --role=involving --only=place,confirm,ready --mode=log
```

This creates `app/Feeds/CustomerFeed.php` with a typed constructor and a scope. `--role=involving` includes the order in any role; the generator's default role is `context`.

<a id="feed-classes"></a>

## Writing Feed Classes

A feed class takes its subject in the constructor. Its `scope()` method uses that subject when reading:

```php memo="app/Feeds/CustomerFeed.php"
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

```php memo="A controller, or wherever the feed is read"
use App\Feeds\CustomerFeed;

CustomerFeed::make($order)->get();
```

<FeedExample :items="customer" />

### Defining Verbs and Read Modes

`define()` sets the vocabulary and read mode without reading constructor state. A feed with no subject declares no constructor and no `scope()`:

```php memo="app/Feeds/ShopFeed.php"
<?php

namespace App\Feeds;

use Storyfeed\Feed;
use Storyfeed\FeedBuilder;

class ShopFeed extends Feed
{
    public function define(FeedBuilder $feed): void
    {
        $feed->except(['note'])->summary();
    }
}
```

```php memo="A controller, or wherever the feed is read"
use App\Feeds\ShopFeed;

ShopFeed::make()->get();
```

### Scoping by Subject

| Hook | Declares | May Read Constructor State |
|---|---|---|
| `define()` | what the feed is about: verbs, mode, limit | no |
| `scope()` | the values only a request supplies | yes |

A call site can't change what `scope()` set, but may narrow the read:

```php memo="A controller, or wherever the feed is read"
// throws FeedMisconfigured
CustomerFeed::make($order)->involving($other);

// fine
CustomerFeed::make($order)->only(['place'])->summary();
```

### Registering Classes

Register classes and closures in one list:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use App\Feeds\CustomerFeed;
use App\Feeds\ShopFeed;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Storyfeed::feeds([
    'customer' => CustomerFeed::class,     // named explicitly
    ShopFeed::class,                    // name derived: 'shop'
    'pulse' => fn (FeedBuilder $feed) => $feed->only(['place', 'ready'])->live(),
]);
```

A feed class works without registering. Registering gives it a name.

## Filtering Verbs

Both work on any read, named or not:

```php memo="A controller, or wherever the feed is read"
use App\Enums\OrderActivity;
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

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

// reads only 'place': 'note' is not in the declared list
Storyfeed::feed('pulse')->only(['place', 'note'])->get();
```

Groups count only the verbs the filter lets through.

<a id="feeds-and-access-control"></a>

## Authorizing Feed Access

A feed only filters rows.

- It doesn't know **who is asking**. Whether this customer may see this order
  is a policy check in your controller.
- It filters **verbs, not fields**. Everything in a shown activity's `data` is
  in the payload.
- The [Activity Streams controller](/deeper/activity-streams) ignores feed
  names.

For a customer-facing screen, use `only()`. `except()` and wildcards let in
every new verb as soon as it's recorded.
