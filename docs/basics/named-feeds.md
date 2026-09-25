# Named Feeds

<script setup>
import { scene, logOf, liveOf } from '../.vitepress/theme/world'

const shop = liveOf(scene.basics.namedFeeds.shop)
const customer = logOf(scene.basics.namedFeeds.shop.filter(node =>
  ['place', 'confirm', 'ready'].includes(node.verb) && node.object?.id === scene.order.object.id))
</script>

## Introduction

A named feed is a read you declare once and read by name: its verbs and its
mode, and for a feed class its scope. A customer's order page and the shop's
screen can each read their own.

## Defining Named Feeds

<a id="declaring-a-feed"></a>

### Registering a Closure

Register each feed as a closure over the builder, in a service provider:

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

Named feeds don't go in `routes/feed.php`: once `storyfeed:cache` has run, that
file isn't loaded, and the cache holds only definitions.

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

An unknown name throws `UnknownFeed`.

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

This creates `app/Feeds/CustomerFeed.php` with a typed constructor and a scope. `--role=involving` includes the order in any role. [Commands](/reference/commands) lists every option.

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

<a id="scoping-by-subject"></a>

### Defining and Scoping Hooks

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

<a id="filtering-verbs"></a>

## Narrowing a Named Feed

A call site may change a named feed's mode, but not add verbs. `only()` on a
named feed can only narrow the declared list:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

// reads only 'place': 'note' is not in the declared list
Storyfeed::feed('pulse')->only(['place', 'note'])->get();
```

[Filtering by Verb](/basics/reading#filtering-by-verb) covers `only()` and
`except()` on any read.

<a id="feeds-and-access-control"></a>

## Authorizing Feed Access

A feed only filters rows.

- It doesn't know **who is asking**. Whether this customer may see this order
  is a policy check in your controller.
- It filters **verbs, not fields**. Everything in a shown activity's `data` is
  in the payload.

For a customer-facing screen, use `only()`. `except()` and wildcards let in
every new verb as soon as it's recorded.
