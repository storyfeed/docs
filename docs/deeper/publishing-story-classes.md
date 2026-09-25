# Publishing Story Classes

A Story class can build an activity from the data you give it.
Declarations can also stay in `routes/feed.php` or live in their own classes.

<script setup>
import { scenes } from '../.vitepress/theme/samples'
const placed = { ...scenes.order, data: null, glyph_intent: null }
</script>

## Publishing an Activity

::: code-group
<<< @/snippets/place-order.php [Fluent Syntax]
<<< @/snippets/place-order.named-arguments.php [Named Arguments]
:::

<FeedExample :items="[placed]" />

The controller records the placed order. Its headline is declared separately:

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag');
```

<FeedExample :items="[placed]" />

A line in the feed file is enough for this activity. Classes give the activity's
construction or its declarations a home of their own.

## Generating a Story Class

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

## One Activity, Published With Its Data

```php
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
            ->to($this->order->kitchen);
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

Use this binding in place of the inline declaration:

```php
// routes/feed.php
use App\Models\Order;
use App\Stories\OrderWasPlaced;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place', OrderWasPlaced::class);
```

The authenticated controller now gives the Story its data:

```php
// app/Http/Controllers/PlaceOrderController.php, __invoke()
use App\Stories\OrderWasPlaced;
use Storyfeed\Facades\Storyfeed;

Storyfeed::publish(new OrderWasPlaced($order, $request->user()));
```

<FeedExample :items="[placed]" />

`Storyfeed::publish()` returns the activity, or `null` when `toFeedActivity()`
returns `null`. `Storyfeed::publishNow()` publishes immediately. Construct the
Story when publishing this verb; `story('place', $order)` cannot bypass its
`toFeedActivity()` method.

Presentation methods are read without calling the constructor. `headline()`,
`icon()`, `intent()`, `groups()`, `missing()`, `keepFor()`, `keepForever()`,
`keepLatest()` and `middleware()` must be independent of constructor data.
The data belongs in `toFeedActivity()`.

## Every Activity for One Model

```php
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

```php
// routes/feed.php
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class);
```

<FeedExample :items="[placed]" />

The original controller still publishes the activity. The resource class holds
the declarations. [Story Classes](/deeper/stories) covers the resource methods.

## A Single Verb

```php
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

When `routes/feed.php` gets long, a single-verb class puts that verb's headlines
in their own class. It extends nothing. Bind it instead of the inline declaration:

```php
// routes/feed.php
use App\Models\Order;
use App\Stories\PlaceStory;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place', PlaceStory::class);
```

<FeedExample :items="[placed]" />

The original controller still works. An invokable declaration can return a
`Verb`, a headline string, or an array of definition settings, just like a
resource method. `Story::verb('place', PlaceStory::class)` binds it across types;
its headline then needs to make sense for every type it covers.

## Generator Options

| Command | Result |
|---|---|
| `php artisan make:story OrderWasPlaced --verb=place --object=Order` | an activity constructed with its data |
| `php artisan make:story OrderStory --model=Order` | every activity for `Order`; `--model` implies `--resource` |
| `php artisan make:story PlaceStory --invokable --verb=place --object=Order` | the `place` declaration in `__invoke()` |

`--object` names the object of one verb. `--model` selects a resource class and
takes precedence over `--invokable`. An invokable class accepts `--object='*'`
for a verb shared by every type.
