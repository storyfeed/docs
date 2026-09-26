# Story Classes

## Introduction

A Story class can build an activity from the data you give it. You may also
keep verb definitions in `routes/feed.php` or separate declaration classes.

<script setup>
import { scene, activity } from '../.vitepress/theme/world'
const placed = { ...scene.order, data: null, glyph_intent: null }
const paid = activity({ ...scene.deeper.latestPerObject.timeline.find(row => row.verb === 'pay'),
  verb: 'confirm_payment', headline_template: ':actor confirmed payment for :object', data: null })
</script>

<a id="publishing-an-activity"></a>

<a id="generating-a-story-class"></a>

## Generating Story Classes

```bash
php artisan make:story
```

The command asks for the class name, then **What will this story describe?**

| Choice | Laravel Analogy | What the Class Contains |
|---|---|---|
| One activity, published with its data | like a notification | constructor data and `toFeedActivity()` |
| Every activity for one model | like a resource controller | one declaration method per verb |
| A single verb | like a single action controller | that verb's headlines in their own class |

Each choice prints a registration to add to `routes/feed.php` without editing
that file. The sections below show the command for each class type. See
[Commands](/reference/commands#stories) for all options.

<a id="generator-options"></a>

<a id="spelling-the-past-tense"></a>

A name containing `Was` supplies the headline's past tense. Otherwise, the
command derives it from the verb and asks when the spelling is uncertain.
Choosing **None of these**, or running without a terminal, leaves those
headline lines commented out. Select and uncomment a line before compiling
the definitions.

<a id="one-activity-published-with-its-data"></a>

## Publishing Story Classes

### Defining the Activity

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

An [event implementing `PublishesToFeed`](/deeper/events#publishing-from-an-event)
uses the same `toFeedActivity` method and publishes when dispatched. A Story
can be published independently, like a notification, so use it when the
activity has no corresponding application event.

### Registering the Story

Register the class for its object type and verb in the feed file:

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderWasPlaced;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place', OrderWasPlaced::class);
```

### Publishing the Story

Construct the Story with its data and publish it:

```php
Storyfeed::publish(new OrderWasPlaced($order, $request->user()));
```

<FeedExample :items="[placed]" />

`Storyfeed::publish()` returns the activity, or `null` when `toFeedActivity()`
returns `null` or the Story is queued.

<a id="queueing-a-story-class"></a>

### Queueing Stories

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

The `Storyfeed::publish` method now queues the Story. Use the `Queueable`
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
trait's `through` method sets job middleware. See [Queued Publishing](/deeper/queues)
for connections, transactions, and missing models.

### Presentation Methods

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
| `period()` | its [grouping period](/deeper/grouping-periods) |
| `middleware()` | its [story middleware](/deeper/story-middleware-and-batching) |

<a id="a-single-verb"></a>

## Single-Verb Stories

### Generating an Invokable Story

```shell
php artisan make:story PlaceStory --invokable --verb=place --object=Order
```

```php memo="app/Stories/PlaceStory.php"
<?php

namespace App\Stories;

use Storyfeed\Stories\Verb;

class PlaceStory
{
    public function __invoke(Verb $verb): Verb
    {
        return $verb
            ->headline(':actor placed :object with :target')
            ->icon('shopping-bag');
    }
}
```

### Registering an Invokable Story

When `routes/feed.php` becomes difficult to maintain, move a verb's headlines
to a single-verb declaration class. It does not require a base class. Register
it in place of the inline definition:

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\PlaceStory;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place', PlaceStory::class);
```

<FeedExample :items="[placed]" />

Publish the verb with [the activity builder](/basics/recording). An invokable
declaration may return a `Verb` or headline string, as a resource method does.
Registering it with `Story::verb('place', PlaceStory::class)` applies it to all
object types, so its headline must describe each supported type.

<a id="every-activity-for-one-model"></a>

## Resource Stories

### Generating a Resource Story

```shell
php artisan make:story OrderStory --model=Order
```

```php memo="app/Stories/OrderStory.php"
<?php

namespace App\Stories;

use Storyfeed\Stories\Verb;

class OrderStory
{
    public function place(Verb $verb): Verb
    {
        return $verb
            ->headline(':actor placed :object with :target')
            ->icon('shopping-bag');
    }

    public function complete(): string
    {
        return ':actor completed :object';
    }
}
```

Each public method declares a verb. The class requires no base class or order
instance. Register it in place of the other `place` definitions:

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class);
```

<FeedExample :items="[placed]" />

Use the resource class to define verbs and
[the activity builder](/basics/recording) to publish activities.

<a id="verbs-from-method-names"></a>

### Verbs and Return Types

The method name becomes the stored verb in snake_case:

| Method | Stored Verb |
|---|---|
| `pay()` | `pay` |
| `store()` | `store` |
| `confirmPayment()` | `confirm_payment` |
| `markAsPaid()` | `mark_as_paid` |

No other name conversion applies: `store()` records `store`, and `create()`
records `create`.

<a id="action-return-types"></a>

Each method declares its return type:

| Return Type | The Method Returns |
|---|---|
| `Storyfeed\Stories\Verb` | the supplied definition with its options set |
| `string` | the headline |

Use `Verb` when setting several options, or `string` for a headline alone.
Keep helpers protected or private, because public methods declare verbs.

<a id="keeping-definitions-for-stored-activities"></a>

Keep a verb's method while stored activities still use it. Storyfeed resolves
headlines from the current definitions when retrieving the feed, so removing
the method leaves those activities without a headline:

```php memo="app/Stories/OrderStory.php"
// Nothing publishes `print` any more; old rows still read.
public function print(): string
{
    return ':actor printed :object';
}
```

<a id="headlines-for-deleted-objects"></a>
<a id="deleted-object-headlines"></a>

The supplied `Verb` supports every definition method, including
`missingHeadline()` for deleted objects. See
[Deleted Models](/deeper/deleted-models#missing-headlines).

<a id="conventional-verbs"></a>
<a id="selecting-resource-verbs"></a>

### Selecting Verbs

A resource class adds its verbs to the
[conventional verbs](/basics/the-feed-file#resource-definitions) defined by
`Story::resource()`. A method with a conventional verb's name replaces its
complete default definition. Use `only()` or `except()` to filter both sets
by stored verb name:

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class)->only('place', 'complete');
```

<FeedExample :items="[placed]" />

Replace the unfiltered resource registration with this example. Excluded
verbs also lose their resource names.

<a id="registering-several-resources"></a>

### Registering Multiple Resources

```php memo="routes/feed.php"
use App\Models\MenuItem;
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resources([
    Order::class => OrderStory::class,
    MenuItem::class => null,
], ['except' => ['restore']]);
```

<FeedExample :items="[placed]" />

The `Story::resources` method registers several models with shared options,
as `Route::resources` does. A `null` class defines the four conventional verbs.
The options accept `only` and `except`. Use this example in place of individual
resource registrations. To share middleware or role constraints, wrap it in a
[group](/deeper/named-stories#shared-attributes).

<a id="using-the-request"></a>

### Request-Based Actors

```php memo="app/Stories/OrderStory.php" at="Add this method and the Request import"
use Illuminate\Http\Request;

public function confirmPayment(Verb $verb, Request $request): Verb
{
    return $verb
        ->headline(':actor confirmed payment for :object')
        ->icon('credit-card')
        ->actor($request->hasHeader('Paddle-Signature') ? 'Paddle' : 'Stripe');
}
```

The same webhook can choose between two [declared parties](/deeper/parties#declaring-parties).
Its controller publishes `confirm_payment` without naming an actor:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/PaymentWebhookController.php" at="__invoke(), after loading $order"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity('confirm_payment', $order)->publish();
```

```php [Named Arguments] memo="app/Http/Controllers/PaymentWebhookController.php" at="__invoke(), after loading $order"
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(verb: 'confirm_payment', object: $order);
```
:::

For a request without the signature header:

<FeedExample :items="[paid]" />

The verb's actor applies when no actor is assigned explicitly or through a
`Storyfeed::actor()` scope. Only the `actor` setting may depend on the request;
headlines, icons, intents, grouping, and other settings must remain consistent.
A request-dependent headline throws an exception when `grammar.strict` is
enabled, as it is by default in local and testing environments. Dispatched
jobs retain the selected actor; see
[Carrying Roles Into Queued Jobs](/deeper/activity-scopes#request-based-actors).

<a id="generating-from-doctor-findings"></a>

## Generating From Existing Activities

```bash
php artisan make:story --from-doctor
```

The command generates an activity class for each recorded type and verb without
a headline, using a name such as `OrderWasPlaced`. It prompts for uncertain
past tenses. Without an interactive terminal, it skips those pairs and prints
commands for the possible spellings. Run the command with the correct spelling.

<a id="listing-verbs"></a>

## Listing and Caching Stories

New resource methods become available when definitions are compiled again.
If definitions are cached, run `storyfeed:cache` to include the new verbs.
Use `storyfeed:list` to inspect them; see
[Listing Definitions](/basics/the-feed-file#listing-definitions) and
[Caching Definitions](/basics/the-feed-file#caching-definitions).
