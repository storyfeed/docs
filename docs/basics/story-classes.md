# Story Classes

## Introduction

A Story class groups a model's verb definitions in one file. Each public verb
method defines what an activity says in the feed, in place of an inline
definition in `routes/feed.php`.

<script setup>
import { scene, activity } from '../.vitepress/theme/world'
const placed = { ...scene.order, data: null, glyph_intent: null }
</script>

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

Each choice prints the `routes/feed.php` line to add. See
[Commands](/reference/commands#stories) for all options.

<a id="generator-options"></a>

<a id="spelling-the-past-tense"></a>

Select and uncomment a generated headline before compiling the definitions.

## Writing Story Classes

### Basic Story Classes

Generate a Story class for the `Order` model and define its verbs:

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

A Story class needs no base class. Bind one public method to a verb in the feed file:

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place', [OrderStory::class, 'place']);
```

<FeedExample :items="[placed]" />

Only `place` is registered here. Bind `complete` separately when you need it.
Use explicit method bindings to select individual verbs from a class.
Each method returns the supplied `Verb` or a headline string.

The stored verb can differ from the method name:

```php memo="app/Stories/TicketStory.php"
<?php

namespace App\Stories;

class TicketStory
{
    public function reopen(): string
    {
        return ':actor reopened :object';
    }
}
```

```php memo="routes/feed.php"
use App\Models\Ticket;
use App\Stories\TicketStory;
use Storyfeed\Facades\Story;

Story::for(Ticket::class)->verb('re-open', [TicketStory::class, 'reopen']);
```

The binding keeps `re-open` as the stored verb. To apply a method to every
object type, use `Story::verb('place', [OrderStory::class, 'place'])`.
Publish with [the activity builder](/basics/recording-activities); the class defines what
those activities say.

<a id="a-single-verb"></a>

### Single-Verb Stories

#### Generating an Invokable Story

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

#### Registering an Invokable Story

Register the invokable class without a method name:

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\PlaceStory;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place', PlaceStory::class);
```

<FeedExample :items="[placed]" />

Publish the verb with [the activity builder](/basics/recording-activities). An invokable
declaration may return a `Verb` or headline string.
Registering it with `Story::verb('place', PlaceStory::class)` applies it to all
object types, so its headline must describe each supported type.

Package authors can [register Story classes in a service provider](/deeper/package-integration#registering-stories-in-a-service-provider).

## Story Middleware

Attach middleware to a verb binding or a group in `routes/feed.php`. See
[Story Middleware](/deeper/story-middleware) for
registration, exclusions, and batching.

<a id="every-activity-for-one-model"></a>

## Resource Stories

<a id="generating-a-resource-story"></a>

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class);
```

<FeedExample :items="[placed]" />

A resource registration wires the class's public verb methods in one call.
It also defines `create`, `update`, `delete`, and `restore`; see
[Conventional Verbs](/basics/the-feed-file#resource-definitions) for their headlines
and icons. A method with one of those names replaces its complete default definition.
Use this registration in place of the individual method binding.

Define verbs in the class and publish activities with
[the activity builder](/basics/recording-activities).

<a id="verbs-from-method-names"></a>

### Verbs and Return Types

The method name becomes the stored verb in snake_case:

| Method | Stored Verb |
|---|---|
| `pay()` | `pay` |
| `store()` | `store` |
| `confirmPayment()` | `confirm_payment` |
| `markAsPaid()` | `mark_as_paid` |

PHP reserved words such as `default`, `print`, `match`, and `list` are valid method names.

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

```php memo="app/Stories/OrderStory.php" at="print()"
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

Use `only()` or `except()` to filter the class methods and conventional verbs
by stored verb name:

::: code-group
```php [Only] memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class)->only('place', 'complete');

```

```php [Except] memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class)->except('restore');
```
:::

<FeedExample :items="[placed]" />

Choose one resource registration. Excluded verbs also lose their resource names.

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
resource registrations. To share middleware or [role constraints](/deeper/constraining-roles), wrap it in a
[group](/deeper/named-stories#shared-attributes).

### Supplementing Resource Stories

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderStory;
use App\Stories\PlaceStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class);
Story::for(Order::class)->verb('place', PlaceStory::class);
```

<FeedExample :items="[placed]" />

A later explicit method or invokable binding replaces the complete definition
for that object type and verb, including its name and middleware. Other resource
verbs keep their definitions. Use this to replace one resource method with a
dedicated single-verb class.

## Dependency Injection

Storyfeed resolves Story classes through Laravel's service container. Type-hint
dependencies on a verb method to receive them, including `Illuminate\Http\Request`.
Explicit method bindings, invokable classes, and resource methods use the same
injection rules.

<span id="using-the-request"></span>
<span id="request-based-actors"></span>
<span id="carrying-request-based-actors-into-jobs"></span>
<span id="tab-437"></span>
<span id="tab-438"></span>

A verb method can choose its actor from the request. See
[Request-Based Actors](/deeper/activity-scopes#request-based-actors).

## Publishing Story Classes

<span id="one-activity-published-with-its-data"></span>
<span id="publishing-an-activity"></span>
<span id="publishing-story-classes"></span>
<span id="publishing-from-a-story-class"></span>
<span id="defining-the-activity"></span>
<span id="declaring-casts-on-a-story-class"></span>
<span id="registering-the-story"></span>
<span id="publishing-the-story"></span>
<span id="queueing-a-story-class"></span>
<span id="queueing-stories"></span>
<span id="presentation-methods"></span>

A Story class can also build one activity with its data and publish it, as a
notification is sent. See [Publishing Story Classes](/deeper/publishing-story-classes).

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

New resource methods appear once definitions compile again: see
[Listing Definitions](/basics/the-feed-file#listing-definitions) and
[Caching Definitions](/basics/the-feed-file#caching-definitions).
