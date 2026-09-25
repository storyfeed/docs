# Story Classes

## Introduction

A Story class can build an activity from the data you give it.
Declarations can also stay in `routes/feed.php` or live in their own classes.

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
| One activity, published with its data | like an event | constructor data and `toFeedActivity()` |
| Every activity for one model | like a resource controller | one declaration method per verb |
| A single verb | like a single action controller | that verb's headlines in their own class |

Each choice prints a binding to add to `routes/feed.php`. The command does not
edit that file.

<a id="generator-options"></a>

| Command | Result |
|---|---|
| `php artisan make:story OrderWasPlaced --verb=place --object=Order` | an activity constructed with its data |
| `php artisan make:story OrderStory --model=Order` | every activity for `Order`; `--model` implies `--resource` |
| `php artisan make:story PlaceStory --invokable --verb=place --object=Order` | the `place` declaration in `__invoke()` |

`--object` names the object of one verb. `--model` selects a resource class and
takes precedence over `--invokable`. An invokable class accepts `--object='*'`
for a verb shared by every type.

<a id="spelling-the-past-tense"></a>

A name containing `Was` supplies the headline's past tense. Otherwise the
command derives it from the verb and asks when the spelling is uncertain.
Choosing **None of these**, or running without a terminal, leaves uncertain
headline lines commented out. Choose a line before compiling the definitions.

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

`toFeedActivity()` builds the activity. The inherited `$this->activity()` fills
in the verb bound to this class. Return `null` to publish nothing.

### Registering the Story

Bind the class to its object type and verb in the feed file:

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderWasPlaced;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place', OrderWasPlaced::class);
```

### Publishing the Story

An authenticated controller gives the Story its data:

```php memo="app/Http/Controllers/PlaceOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Stories\OrderWasPlaced;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PlaceOrderController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update(['status' => 'placed']);

        Storyfeed::publish(new OrderWasPlaced($order, $request->user()));

        return to_route('orders.show', $order);
    }
}
```

<FeedExample :items="[placed]" />

`Storyfeed::publish()` returns the activity, or `null` when `toFeedActivity()`
returns `null` or the Story implements `ShouldQueue`. `Storyfeed::publishNow()`
publishes synchronously. See [Queued Publishing](/deeper/queues#queueing-story-classes)
for queued Story classes. Construct the Story when publishing this verb; a named
lookup cannot bypass its `toFeedActivity()` method.

### Presentation Methods

Presentation methods are read without calling the constructor. `headline()`,
`icon()`, `intent()`, `groups()`, `missing()`, `keepFor()`, `keepForever()`,
`keepLatest()`, `period()` and `middleware()` must be independent of constructor data.
The data belongs in `toFeedActivity()`.

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

When `routes/feed.php` gets long, a single-verb class puts that verb's headlines
in their own class. It extends nothing. Bind it instead of the inline declaration:

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\PlaceStory;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place', PlaceStory::class);
```

<FeedExample :items="[placed]" />

Publish this verb with [the activity builder](/basics/recording). An invokable declaration can return a
`Verb` or a headline string, just like a resource method.
`Story::verb('place', PlaceStory::class)` binds it across types;
its headline then needs to make sense for every type it covers.

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

Each public method declares a verb. The class extends nothing and receives no
order to publish. Bind it instead of the other `place` declarations:

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class);
```

<FeedExample :items="[placed]" />

Publish the activity with [the activity builder](/basics/recording). The resource class holds
the declarations. Keep helpers protected or private; public methods declare verbs.

<a id="verbs-from-method-names"></a>

### Verbs and Return Types

The method name is the verb, snake-cased when it has more than one word:

| Method | Stored Verb |
|---|---|
| `pay()` | `pay` |
| `store()` | `store` |
| `confirmPayment()` | `confirm_payment` |
| `markAsPaid()` | `mark_as_paid` |

Nothing else is mapped: `store()` records `store`, and `create()` records
`create`.

<a id="action-return-types"></a>

Each method declares its return type:

| Return Type | The Method Returns |
|---|---|
| `Storyfeed\Stories\Verb` | the definition it received, filled in |
| `string` | the headline, and nothing else |

Use `Verb` when setting several options, or `string` for a headline alone.
Make helpers protected or private.

<a id="keeping-definitions-for-stored-activities"></a>

Keep a method after nothing publishes its verb. A stored activity reads its
headline from the verb's declaration when the feed is read, so removing the
method leaves old rows without a headline:

```php memo="app/Stories/OrderStory.php"
// Nothing publishes `print` any more; old rows still read.
public function print(): string
{
    return ':actor printed :object';
}
```

<a id="headlines-for-deleted-objects"></a>
<a id="deleted-object-headlines"></a>

A resource method's `Verb` takes every definition method, including
`missingHeadline()` for once its object is deleted:
[Deleted Models](/deeper/deleted-models#missing-headlines) covers it.

### Conventional Verbs

`Story::resource()` always defines `create`, `update`, `delete` and
`restore`. A method named for one of them replaces its default whole; the
others keep theirs. `only()` and `except()` name verbs as they are stored:

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class)
    ->except('restore', 'complete');
```

<a id="selecting-resource-verbs"></a>

### Selecting Verbs

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class)->only('place', 'complete');
```

<FeedExample :items="[placed]" />

Use this in place of the unfiltered resource binding. `only()` and `except()`
filter both conventional verbs and the class's public methods, as Laravel's
resource routes do. Excluded verbs lose their resource names too.

| Filter | Definitions Kept |
|---|---|
| `->only('place', 'complete')` | only these two verbs |
| `->except('restore', 'complete')` | all except these stored verb names |

Both methods accept an array instead of separate arguments.

<a id="registering-several-resources"></a>

### Registering Multiple Resources

```php memo="routes/feed.php"
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resources([
    Order::class => OrderStory::class,
    MenuItem::class => null,
], [
    'except' => ['restore'],
    'middleware' => 'batch:5 minutes',
    'wheres' => ['actor' => [User::class, 'party']],
]);
```

<FeedExample :items="[placed]" />

`Story::resources()` registers each model with the same options, as
`Route::resources()` does. A `null` class supplies the four conventional verbs.
The call returns nothing; put shared settings in its options or on an enclosing
group. This example replaces the individual resource bindings.

| Option | Applied to Each Resource |
|---|---|
| `only` | keeps the named verbs |
| `except` | removes the named verbs |
| `middleware` | appends story middleware |
| `excluded_middleware` | removes matching middleware |
| `wheres` | sets [role constraints](/deeper/constraining-roles), keyed by role |

An unknown option throws.

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

The verb's actor applies when the call site names none and no `Storyfeed::actor()`
scope is open. Only `->actor()` may depend on the request: the headline, icon,
intent, grouping and every other setting must be the same for every request.
Changing a headline with the request throws when `grammar.strict` is on,
including the default local and testing environments. Jobs dispatched during
the request publish with the chosen actor; see [Request-Based Actors](/deeper/queues#request-based-actors).

<a id="generating-from-doctor-findings"></a>

## Generating From Existing Activities

```bash
php artisan make:story --from-doctor
```

The command writes an activity class for each recorded type/verb pair without
a headline, named from the pair, such as `OrderWasPlaced`. It asks about
uncertain past tenses. Without a terminal it skips those pairs and prints
commands for the possible spellings; run the command with the correct one.

<a id="listing-verbs"></a>

## Listing and Caching Stories

A new resource method becomes a verb when definitions compile again: it
appears in `storyfeed:list`, and a cached manifest needs `storyfeed:cache`
again, as The Feed File's [Listing Definitions](/basics/the-feed-file#listing-definitions)
and [Caching Definitions](/basics/the-feed-file#caching-definitions) describe.
