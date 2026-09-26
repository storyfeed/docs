# Named Feeds

<script setup>
import { scene, role, logOf, liveOf } from '../.vitepress/theme/world'

const rows = scene.basics.namedFeeds.shop
const kitchen = liveOf(rows.filter(node => ['place', 'confirm', 'ready'].includes(node.verb)))
const menu = logOf(rows.filter(node => ['publish', 'reprice'].includes(node.verb)))
const customer = logOf(scene.basics.namedFeeds.shop.filter(node =>
  ['place', 'confirm', 'ready'].includes(node.verb) && node.object?.id === scene.order.object.id))
</script>

## Introduction

Most apps show their activity to more than one audience. At {{ role.shop.label }}, the
kitchen needs every order as it moves, the menu has its own change log, and a
customer should see their order and nothing about price changes or staff notes.
Written as separate reads in separate controllers, those decisions drift apart,
and the day someone records a new verb, nothing stops it appearing on the
customer's page.

A named feed declares an audience once, by name:

- **Every screen reads the same decision.** A controller, a Filament widget and
  an API endpoint that read `'customer'` all show the same verbs.
- **New verbs can't slip through.** The [doctor](/deeper/diagnosing) checks that
  every verb you record is shown or left out by some feed, so in CI a new verb
  fails the build until someone decides who may see it.
- **Each feed can link somewhere different.** An order opens its ticket on the
  kitchen's board and its status page on the customer's.
- **A feed class can't lose its subject.** The customer's feed always reads
  about their order, so no read can leave it out.

<a id="declaring-a-feed"></a>

<a id="registering-a-closure"></a>
## Defining Named Feeds

{{ role.shop.label }} has two screens that aren't about any one order: the
kitchen's order board, and the menu's change log. Each is a feed with its own
audience, so each gets a name.

Register each feed as a closure in the `boot` method of a service provider. The
closure receives the builder and declares which activities the feed shows, and
how it reads them:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Storyfeed::feeds([
    // The kitchen's order board: every order as it moves, with a customer's
    // repeated orders folded into one row.
    'kitchen' => fn (FeedBuilder $feed) => $feed
        ->only(['place', 'confirm', 'ready'])
        ->live(),

    // The menu's change log: items added and prices changed, one row each.
    'menu' => fn (FeedBuilder $feed) => $feed
        ->only(['publish', 'reprice'])
        ->log(),
]);
```

<a id="verbs-and-scope"></a>
<a id="scoping-closure-feeds"></a>

### Reading a Named Feed

Read a feed by name from the facade. The kitchen's order board:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed('kitchen')->get();
```

<FeedExample :items="kitchen" />

And the menu's change log, across every item:

```php memo="A controller, or wherever the feed is read"
Storyfeed::feed('menu')->get();
```

<FeedExample :items="menu" />

A model reads a named feed about itself the same way:
`$order->storyfeed('kitchen')` is the kitchen's view of one order.

An unknown name throws `UnknownFeed`.

<a id="feed-classes"></a>

<a id="generating-feed-classes"></a>
<a id="writing-feed-classes"></a>
## Defining Feed Classes

A customer's order page is a feed about one order: theirs. When a feed always
reads about one subject, use a feed class instead of a closure. To generate one,
use the `make:feed` Artisan command:

```bash
php artisan make:feed Customer --subject='App\Models\Order' --role=involving
```

This creates `app/Feeds/CustomerFeed.php`, with the order in its constructor:

```php memo="app/Feeds/CustomerFeed.php"
<?php

namespace App\Feeds;

use App\Models\Order;
use Storyfeed\Feed;
use Storyfeed\FeedBuilder;

class CustomerFeed extends Feed
{
    public function __construct(protected Order $order) {}

    // What a customer may see: their order being placed, confirmed and made
    // ready, one row each. Nothing about prices or staff notes.
    public function define(FeedBuilder $feed): void
    {
        $feed->only(['place', 'confirm', 'ready'])->log();
    }

    // Which order: the one this feed was made for, on every read.
    protected function scope(FeedBuilder $feed): void
    {
        $feed->involving($this->order);
    }
}
```

Read it with `make()`, passing the order:

```php memo="A controller, or wherever the feed is read"
use App\Feeds\CustomerFeed;

CustomerFeed::make($order)->get();
```

<FeedExample :items="customer" />

[Commands](/reference/commands) lists every `make:feed` option.

<a id="scoping-by-subject"></a>

<a id="defining-verbs-and-read-modes"></a>
### Defining and Scoping Hooks

`define()` describes the feed without an order. Storyfeed calls it on its own,
for example when the doctor checks which verbs each feed shows, so it can't use
the constructor's values. `scope()` runs on every read, with the order.

A read can narrow a feed class, but can't change what `scope()` set:

```php memo="A controller, or wherever the feed is read"
// throws FeedMisconfigured
CustomerFeed::make($order)->involving($other);

// fine
CustomerFeed::make($order)->only(['place'])->live();
```

A feed with no subject declares no constructor and no `scope()`. The kitchen's
closure feed, as a class:

```php memo="app/Feeds/KitchenFeed.php"
<?php

namespace App\Feeds;

use Storyfeed\Feed;
use Storyfeed\FeedBuilder;

class KitchenFeed extends Feed
{
    public function define(FeedBuilder $feed): void
    {
        $feed->only(['place', 'confirm', 'ready'])->live();
    }
}
```

<a id="registering-classes"></a>
### Registering Feed Classes

A feed class works without registering. Registering gives it a name, which the
next section puts to use. Register classes and closures in one list:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use App\Feeds\CustomerFeed;
use App\Feeds\KitchenFeed;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Storyfeed::feeds([
    'customer' => CustomerFeed::class,  // named explicitly
    KitchenFeed::class,                 // named 'kitchen', from the class
    'menu' => fn (FeedBuilder $feed) => $feed->only(['publish', 'reprice'])->log(),
]);
```

<a id="using-the-name"></a>

## What a Feed's Name Does

### Linking Each Feed Somewhere Different

A model's link resolver receives the name of the feed being read, so an order
can open its ticket on the kitchen's board and its status page on the
customer's:

```php memo="app/Models/Order.php" at="booted()"
static::feedMediaUsing(fn ($context) => match ($context->feed()) {
    'kitchen' => route('kitchen.ticket', $context->routeKey()),
    'customer' => route('orders.status', $context->routeKey()),
    default => null,
});
```

[Links for Named Feeds](/basics/feedable-models#a-link-per-feed) covers this in
full.

### Checking That Every Verb Has an Audience

Once feeds are registered, the [doctor](/deeper/diagnosing) warns about any
verb that no feed's `only()` or `except()` mentions (`feeds.unclassified`). A
verb someone records next month then fails CI until somebody decides who may
see it, instead of appearing on a customer's screen. A feed meant to show
everything says so with `->unrestricted()`.

<a id="filtering-verbs"></a>

## Narrowing a Named Feed

A read may change a named feed's mode, but not add verbs. `only()` on a named
feed can only narrow the declared list:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

// reads only 'place': 'note' is not in the declared list
Storyfeed::feed('kitchen')->only(['place', 'note'])->get();
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

For a customer-facing feed, use `only()`. `except()` and wildcards let in every
new verb as soon as it's recorded.
