# Publishing Story Classes

<script setup>
import { scene } from '../.vitepress/theme/world'
const placed = { ...scene.order, data: null, glyph_intent: null }
</script>

## Introduction

A Story class that extends `Storyfeed\Stories\Story` builds one activity with
its data and publishes it.

## Defining the Activity

```shell
php artisan make:story OrderWasPlaced --verb=place --object=Order
```

```php memo="app/Stories/OrderWasPlaced.php"
<?php

namespace App\Stories;

use App\Models\Order;
use App\Models\User;
use Storyfeed\PendingActivity;
use Storyfeed\Stories\Story;

class OrderWasPlaced extends Story
{
    public function __construct(
        public Order $order,
        public User $customer,
    ) {}

    public function toFeedActivity(): ?PendingActivity
    {
        return $this->activity($this->order)
            ->by($this->customer)
            ->to($this->order->shop);
    }

    public function headline(): string
    {
        // Presentation methods cannot read constructor data.
        return ':actor placed :object with :target';
    }

    public function icon(): ?string
    {
        return 'shopping-bag';
    }
}
```

<FeedExample :items="[placed]" />

The `toFeedActivity` method builds the activity. The inherited `activity`
method sets the verb registered for this class. Return `null` to skip publishing.

An [event implementing `PublishesToFeed`](/deeper/publishing-from-events#publishing-from-an-event)
uses the same `toFeedActivity` method and publishes when dispatched. A Story
can be published independently, like a notification, so use it when the
activity has no corresponding application event.

## Declaring Casts on a Story Class

A Story class declares its casts in a `casts` method, as a model does. This
alternative order-placement class records a channel and promised time:

```php memo="app/Stories/OrderPlaced.php"
<?php

namespace App\Stories;

use App\Enums\Channel;
use App\Models\Order;
use Storyfeed\PendingActivity;
use Storyfeed\Stories\Story;

class OrderPlaced extends Story
{
    public string|array|null $objectType = Order::class;

    public function __construct(public Order $order) {}

    public function toFeedActivity(): ?PendingActivity
    {
        return $this->activity($this->order)->data([
            'channel' => $this->order->channel,
            'promised_at' => $this->order->promised_at,
        ]);
    }

    public function headline(): string
    {
        return ':actor placed :object';
    }

    public function casts(): array // [!code highlight]
    {
        return [
            'channel' => Channel::class,
            'promised_at' => 'immutable_datetime',
        ];
    }
}
```

To use this class instead of `OrderWasPlaced`, bind it to the order's verb:

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderPlaced;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place', OrderPlaced::class);
```

## Registering the Story

Register the class for its object type and verb in the feed file:

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderWasPlaced;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place', OrderWasPlaced::class);
```

## Publishing the Story

Construct the Story with its data and publish it:

```php memo="Where the order is placed: a controller, an action, a listener"
use App\Stories\OrderWasPlaced;
use Storyfeed\Facades\Storyfeed;

Storyfeed::publish(new OrderWasPlaced($order, $request->user()));
```

<FeedExample :items="[placed]" />

`Storyfeed::publish()` returns the activity, or `null` when `toFeedActivity()`
returns `null` or the Story is queued.

<a id="queueing-a-story-class"></a>

<span id="queueing-a-story-class"></span>

## Queueing Stories

Implement `ShouldQueue` and use `Queueable`, as a queued notification does:

```php memo="app/Stories/OrderWasPlaced.php"
<?php

namespace App\Stories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Storyfeed\PendingActivity;
use Storyfeed\Stories\Story;

class OrderWasPlaced extends Story implements ShouldQueue // [!code highlight]
{
    use Queueable;

    // ...
}
```

The `Storyfeed::publish` method queues a Story that implements `ShouldQueue`. Use the `Queueable`
trait's methods to select the connection and queue:

```php memo="app/Http/Controllers/PlaceOrderController.php" at="__invoke()"
use App\Stories\OrderWasPlaced;
use Storyfeed\Facades\Storyfeed;

Storyfeed::publish(
    (new OrderWasPlaced($order, $request->user()))->onQueue('feed'),
);
```

After the worker calls `toFeedActivity()` and publishes its result:

<FeedExample :items="[placed]" />

Queued publishing returns `null`. Use `Storyfeed::publishNow()` to publish
synchronously, as you would use `sendNow()` for a notification. Model properties
are serialized by their identifiers. The publication time is captured when
`Storyfeed::publish()` is called, unless `toFeedActivity()` sets it explicitly.

A queued Story may implement `ShouldBeUnique` and define a `uniqueId` method.
Its `middleware` method declares
[story middleware](/deeper/story-middleware-and-batching), while the `Queueable`
trait's `through` method sets job middleware. See [Queued Publishing](/deeper/queued-publishing)
for connections, transactions, and missing models.

## Presentation Methods

Storyfeed calls `headline` and `icon` without running the constructor, so these
methods cannot use constructor data. Use that data in `toFeedActivity` instead.
The same restriction applies to all definition methods:

| Method | Declares |
|---|---|
| `intent()` | the [icon's intent](/basics/the-feed-file#icons-and-intents) |
| `groups()` | [group headlines](/deeper/aggregation) |
| `missing()` | the [roles that make it redundant](/deeper/deleted-models#redundant-roles) once deleted |
| `keepFor()`, `keepForever()` | its [retention](/deeper/retention) |
| `keepLatest()` | [keeping the latest activity](/deeper/keeping-the-latest-activity) |
| `bursts()` | its [burst window](/deeper/live-burst-windows) |
| `period()` | the calendar period for custom axes whose keys include `d` |
| `middleware()` | its [story middleware](/deeper/story-middleware-and-batching) |
