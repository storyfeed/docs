# The Feed File

`routes/feed.php` declares what each verb's activities say: the headline, the
icon, and how a group of them reads, the way `routes/web.php` declares your
routes.

<script setup>
import { who, where, orders, activity, group, scenes } from '../.vitepress/theme/samples'

const at = '2026-08-14T14:30:00.000000Z'
const withoutIcon = activity({ ...scenes.order, id: 'hl1', glyph: null })

const complete = activity({ id: 'hl2', verb: 'complete', glyph: 'receipt',
  published_at: '2026-08-14T14:35:00.000000Z',
  headline_template: ':actor completed :object',
  actor: who.cook, object: orders.first })

const completeWithoutIcon = activity({ ...complete, id: 'hl8', glyph: null })

const placedAtCounter = activity({ id: 'hl3', verb: 'place', glyph: 'shopping-bag',
  published_at: '2026-08-14T14:32:00.000000Z',
  headline_template: ':actor placed :object',
  actor: who.customer2, object: orders.second })

const rushed = activity({ id: 'hl5', verb: 'place', glyph: 'shopping-bag',
  published_at: '2026-08-14T14:32:00.000000Z',
  headline_template: ':actor rushed :object to :target',
  actor: who.customer2, object: orders.second, target: where.kitchen,
  data: { rush: true } })

const created = activity({ id: 'hl6', verb: 'create', glyph: 'plus',
  published_at: '2026-08-14T14:40:00.000000Z',
  headline_template: ':actor created :object',
  actor: who.owner, object: orders.third })

const repeated = group({ id: 'hl7', verb: 'place', axis: 'repeat', count: 3, glyph: 'shopping-bag',
  published_at: at,
  headline_template: ':actor placed :count orders',
  actors: [who.regular], objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 1, objects: 3 } })
</script>

## Registering a Headline

A headline is the sentence the feed prints for an activity:

::: code-group

```php [Fluent Syntax]
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object with :target');
```

```php [Array]
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;

Storyfeed::grammar([
    // morph alias, a dot, the verb
    'order.place' => ':actor placed :object with :target',
]);
```

:::

<FeedExample context :items="[withoutIcon]" />

`for()` names the object's type, and `verb()` names the verb you record. This
headline is for the verb `place`, recorded about an order.

The template names roles, never models:

```php
// ✗ not tokens: these render as text
->headline(':customer placed :order with :kitchen')

// ✓
->headline(':actor placed :object with :target')
```

## Tokens

| Token | Substitutes |
|---|---|
| `:actor` | who acted |
| `:object` | what the activity acted on |
| `:target` | what the activity was directed at |
| `:context` | the surrounding container |
| `:origin` | the source |
| `:result` | the produced entity |
| `:instrument` | the tool or service used |

Each token becomes the label of the entity in that role, linked where it has a
link.

## Optional Segments

Square brackets mark words that print only when the roles inside them are
filled:

```php
// routes/feed.php
Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object[ with :target]');
```

<FeedExample :items="[placedAtCounter, scenes.order]" />

Storyfeed resolves the brackets before the template reaches the payload. An
order placed with a kitchen keeps ` with :target`; one placed without a target
drops it. Without brackets, a role the activity did not record renders as your
renderer's placeholder, so a template without them names only the roles the
verb always carries.

## Several Verbs On One Model

::: code-group

```php [Fluent Syntax]
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->group(function () {
    Story::verb('place')->headline(':actor placed :object with :target');
    Story::verb('complete')->headline(':actor completed :object');
});
```

```php [Array]
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;

Storyfeed::grammar([
    'order.place' => ':actor placed :object with :target',
    'order.complete' => ':actor completed :object',
]);
```

:::

<FeedExample :items="[completeWithoutIcon, withoutIcon]" />

Every `Story::verb()` inside the closure is for orders.

## Adding an Icon

::: code-group

```php [Fluent Syntax]
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->group(function () {
    Story::verb('place')
        ->headline(':actor placed :object with :target')
        ->icon('shopping-bag');

    Story::verb('complete')
        ->headline(':actor completed :object')
        ->icon('receipt');
});

Story::verb('publish')->icon('chef-hat');   // any object type
```

```php [Array]
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;

Storyfeed::icons([
    'order.place' => 'shopping-bag',
    'order.complete' => 'receipt',
    '*.publish' => 'chef-hat',          // any object type
]);
```

:::

<FeedExample :items="[complete, scenes.order]" />

`intent()` names what the icon means, in your app's own word:

::: code-group

```php [Fluent Syntax]
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('complete')->icon('receipt')->intent('success');
```

```php [Array]
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;

Storyfeed::glyphIntents(['order.complete' => 'success']);
```

:::

[Rendering](/basics/rendering#glyphs-and-intents) covers drawing it.

The most specific definition wins:

| Fluent Syntax | Array Key | Matches |
|---|---|---|
| `Story::for(Order::class)->verb('place')` | `order.place` | that verb on that object type |
| `Story::for(Order::class)->fallback()` | `order.*` | every verb on that object type |
| `Story::verb('place')` | `*.place` | that verb on any object type |
| `Story::fallback()` | `*.*` | everything with no more specific entry |

The same order applies to headlines and to intents.

::: headless
:::

## Conventional Model Verbs

`Story::resource()` defines `create`, `update`, `delete` and `restore` for a
model in one line:

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::resource(Order::class);
```

<FeedExample :items="[created]" />

| Verb | Headline | Without an actor | Icon |
|---|---|---|---|
| `create` | `:actor created :object` | `:object was created` | `plus` |
| `update` | `:actor updated :object` | `:object was updated` | `pencil` |
| `delete` | `:actor deleted :object` | `:object was deleted` | `trash` |
| `restore` | `:actor restored :object` | `:object was restored` | `rotate-ccw` |

Narrow it with `only()` or `except()`, and define a verb yourself to say
something else:

```php
// routes/feed.php
Story::resource(Order::class)->except('update');

Story::for(Order::class)->verb('update')->headline(':actor changed :object');
```

A verb defined in both places is an error naming both lines.

## Headlines for a Group

A verb inside `Story::for()` can also say how a group of its activities reads:

::: code-group

```php [Fluent Syntax]
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->group(function () {
    Story::verb('place')
        ->headline(':actor placed :object with :target')
        ->grouped(fn ($group) => $group->repeat(':actor placed :count orders'));
});
```

```php [Array]
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;

Storyfeed::aggregateGrammar([
    'repeat.order.place' => ':actor placed :count orders',
]);
```

:::

<FeedExample :items="[repeated]" />

The group headline belongs to orders only. The groups a feed can form, and the
tokens their headlines may use, are in [Aggregation](/deeper/aggregation).

## Roles That Determine Redundancy

When a model is deleted, its activities stay. `->missing()` names the roles an
activity is about, so the payload can say when one of them is gone:

```php
// routes/feed.php
use App\Models\Question;
use Storyfeed\Facades\Story;

Story::for(Question::class)
    ->verb('turn_into')
    ->headline(':actor turned :object into :result')
    ->missing('object', 'result');
```

With no call, a verb is about its object. [Deleted Models](/deeper/deleted-models)
covers what the feed does when a model goes.

## Choosing a Headline Per Activity

A closure receives the activity and returns a template:

::: code-group

```php [Fluent Syntax]
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\Models\Activity;

Story::for(Order::class)
    ->verb('place')
    ->headline(fn (Activity $activity) => ($activity->data['rush'] ?? false)
        ? ':actor rushed :object to :target'
        : ':actor placed :object with :target');
```

```php [Array]
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Models\Activity;

Storyfeed::grammar([
    'order.place' => fn (Activity $activity) => ($activity->data['rush'] ?? false)
        ? ':actor rushed :object to :target'
        : ':actor placed :object with :target',
]);
```

:::

<FeedExample :items="[rushed, scenes.order]" />

The closure runs when the feed is read. Its tokens become links, like any other
template.

## Publishing a Verb

Publish the verb and object with `Storyfeed::activity()`:

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class CheckoutController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update(['status' => 'placed']);

        Storyfeed::activity()
            ->by($request->user())
            ->action('place', $order)
            ->to($order->kitchen)
            ->publish();

        return to_route('orders.show', $order);
    }
}
```

```php [Named Arguments]
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class CheckoutController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update(['status' => 'placed']);

        Storyfeed::record(
            verb: 'place',
            object: $order,
            actor: $request->user(),
            target: $order->kitchen,
        );

        return to_route('orders.show', $order);
    }
}
```
:::

<FeedExample context :items="[scenes.order]" />

## Loading the Feed File

```sh
# creates routes/feed.php; never overwrites one you have
php artisan storyfeed:install
```

Storyfeed loads `routes/feed.php` once every service provider has booted, so
your morph map is already in place.
