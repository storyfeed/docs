# Named Feeds

<script setup>
import { scene, role, logOf, liveOf } from '../.vitepress/theme/world'

const rows = scene.basics.namedFeeds.shop
const kitchen = liveOf(rows.filter(node => ['place', 'confirm', 'ready'].includes(node.verb)))
// A price change draws no card: the item's details would show today's price, not the change.
const menu = logOf(rows.filter(node => ['publish', 'reprice'].includes(node.verb))
  .map(node => node.verb === 'reprice' ? { ...node, object: { ...node.object, body: null } } : node))
const customer = logOf(scene.basics.namedFeeds.shop.filter(node =>
  ['place', 'confirm', 'ready'].includes(node.verb) && node.object?.id === scene.order.object.id))
// One order, linked on the kitchen's feed and unlinked on a feed with no name.
const linked = [scene.order]
const unlinked = [{ ...scene.order, object: { ...scene.order.object, url: null } }]
</script>

## Introduction

Named feeds let you reuse activity filters for different audiences. For
example, {{ role.shop.label }} may display orders in the kitchen, menu changes
to staff, and individual orders to customers.

A named feed lets you:

- Reuse verb filters in controllers, widgets, and API endpoints.
- Check verb coverage with the [doctor](/deeper/diagnosing).
- Resolve different links for each feed.
- Require a subject, such as an order, through a feed class.

<a id="declaring-a-feed"></a>

<a id="registering-a-closure"></a>
## Defining Named Feeds

Define separate feeds for the kitchen's order board and the menu's change log:

Register each feed as a closure in a service provider's `boot` method. The
closure receives the feed builder and configures its filters and mode:

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

Pass the feed name to the `feed` method on the `Storyfeed` facade:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed('kitchen')->get();
```

<FeedExample :items="kitchen" />

To retrieve the menu's change log:

```php memo="A controller, or wherever the feed is read"
Storyfeed::feed('menu')->get();
```

<FeedExample :items="menu" />

To retrieve a named feed for one model, pass the name to its `storyfeed` method.
For example, `$order->storyfeed('kitchen')` applies the kitchen feed to that order.

An unknown feed name throws an `UnknownFeed` exception.

<a id="feed-classes"></a>

<a id="generating-feed-classes"></a>
<a id="writing-feed-classes"></a>
## Defining Feed Classes

Use a feed class when a feed requires a subject, such as an order. Generate it
with the `make:feed` Artisan command:

```bash
php artisan make:feed Customer --subject='App\Models\Order' --role=involving
```

The command creates `app/Feeds/CustomerFeed.php` with an order constructor parameter:

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

Pass the order to the feed class's `make` method:

```php memo="A controller, or wherever the feed is read"
use App\Feeds\CustomerFeed;

CustomerFeed::make($order)->get();
```

<FeedExample :items="customer" />

See [Commands](/reference/commands) for all `make:feed` options.

<a id="scoping-by-subject"></a>

<a id="defining-verbs-and-read-modes"></a>
### Defining and Scoping Hooks

The `define` method configures the feed without constructor values, including
when the doctor checks verb coverage. The `scope` method applies the subject
constraint whenever you retrieve the feed.

Additional query filters may narrow the results but cannot replace the
constraints set by `scope`:

```php memo="A controller, or wherever the feed is read"
// throws FeedMisconfigured
CustomerFeed::make($order)->involving($other);

// fine
CustomerFeed::make($order)->only(['place'])->live();
```

For a feed without a subject, omit the constructor and `scope` method:

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

Register a feed class to access it by name. You may register classes and
closures together:

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

<a id="what-a-feed-s-name-does"></a>

## Using a Feed's Name

<a id="linking-each-feed-somewhere-different"></a>

### Linking Per Feed

A model's [link resolver](/basics/feedable-models#the-link) can call the
context's `feed` method to get the registered feed name. Use it to return a
kitchen ticket URL, customer status URL, or no link:

```php memo="app/Models/Order.php" at="booted()"
static::feedMediaUsing(fn ($context) => match ($context->feed()) {
    'kitchen' => route('kitchen.ticket', $context->routeKey()),
    'customer' => route('orders.status', $context->routeKey()),
    // an ad-hoc feed reports no name; without this arm the match throws
    default => null,
});
```

On the `kitchen` feed:

<FeedExample :items="linked" />

On a feed with no name:

<FeedExample :items="unlinked" />

<a id="checking-that-every-verb-has-an-audience"></a>

### Checking Verb Coverage

The [doctor](/deeper/diagnosing) reports `feeds.unclassified` when no restricted
feed includes or excludes a registered or recorded verb. Run it with
`--fail-on=warning` in CI to fail on these findings. Use `->unrestricted()` to
declare that a feed includes every verb.

<a id="filtering-verbs"></a>

## Narrowing a Named Feed

You may change a named feed's mode or narrow its verb filters. The `only`
method cannot add verbs excluded by its definition:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

// reads only 'place': 'note' is not in the declared list
Storyfeed::feed('kitchen')->only(['place', 'note'])->get();
```

See [Filtering by Verb](/basics/reading#filtering-by-verb) for the `only` and
`except` methods.

<a id="feeds-and-access-control"></a>

## Authorizing Feed Access

A named feed filters activities. Your application must authorize access:

- Check a policy in your controller to determine whether the customer may
  access the order.
- Each included activity returns its complete `data` payload. Store only values
  that the feed's audience may access.

For customer-facing feeds, use the `only` method with explicit verb names.
The `except` method allows new verbs unless excluded, and wildcards allow new
verbs that match.
