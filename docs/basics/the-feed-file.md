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

## Basic Definitions

<a id="loading-the-feed-file"></a>

### The Feed File

The [installer](/guide/installation#running-the-installer) creates `routes/feed.php`. Define your activity headlines in this file.

<a id="registering-a-headline"></a>

### Defining a Headline

A headline is the sentence the feed prints for an activity:

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object with :target');
```

<FeedExample context :items="[withoutIcon]" />

Storyfeed loads `routes/feed.php` once every service provider has booted, so
your morph map is already in place.

`for()` names the object's type, and `verb()` names the verb you record. This
headline is for the verb `place`, recorded about an order.

The template names roles, never models:

```php
// ✗ not tokens: these render as text
->headline(':customer placed :order with :kitchen')

// ✓
->headline(':actor placed :object with :target')
```

<a id="publishing-a-verb"></a>

### Publishing an Activity

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

## Headline Templates

<a id="tokens"></a>

### Role Tokens

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

### Optional Segments

Square brackets mark words that print only when the roles inside them are
filled:

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object[ with :target]');
```

<FeedExample :items="[placedAtCounter, scenes.order]" />

Storyfeed resolves the brackets before the template reaches the payload. An
order placed with a kitchen keeps ` with :target`; one placed without a target
drops it. Without brackets, an unfilled role leaves its token in the template. Use optional segments for roles the activity may omit.

<a id="choosing-a-headline-per-activity"></a>

### Dynamic Headlines

A closure receives the activity and returns a template:

```php
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

<FeedExample :items="[rushed, scenes.order]" />

The closure runs when the feed is read. Its tokens become links, like any other
template.

<a id="adding-an-icon"></a>

## Icons and Intents

```php
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

<FeedExample :items="[complete, scenes.order]" />

`intent()` names what the icon means, in your app's own word:

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('complete')->icon('receipt')->intent('success');
```

[Rendering](/basics/rendering#glyphs-and-intents) covers drawing it.

<a id="several-verbs-on-one-model"></a>

## Definition Groups

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->group(function () {
    Story::verb('place')->headline(':actor placed :object with :target');
    Story::verb('complete')->headline(':actor completed :object');
});
```

<FeedExample :items="[completeWithoutIcon, withoutIcon]" />

Every `Story::verb()` inside the closure is for orders.

<a id="conventional-model-verbs"></a>

## Resource Definitions

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
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::resource(Order::class)->except('update');

Story::for(Order::class)->verb('update')->headline(':actor changed :object');
```

A verb defined in both places is an error naming both lines.

## Definition Precedence

The most specific definition wins:

| Declaration | Matches |
|---|---|
| `Story::for(Order::class)->verb('place')` | that verb on that object type |
| `Story::for(Order::class)->fallback()` | every verb on that object type |
| `Story::verb('place')` | that verb on any object type |
| `Story::fallback()` | everything with no more specific entry |

The same order applies to headlines and to intents.


<a id="headlines-for-a-group"></a>

## Group Headlines

A verb inside `Story::for()` can also say how a group of its activities reads:

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->group(function () {
    Story::verb('place')
        ->headline(':actor placed :object with :target')
        ->grouped(fn ($group) => $group->repeat(':actor placed :count orders'));
});
```

<FeedExample :items="[repeated]" />

The group headline belongs to orders only. The groups a feed can form, and the
tokens their headlines may use, are in [Aggregation](/deeper/aggregation).

<a id="roles-that-determine-redundancy"></a>

## Headlines for Deleted Models

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

## Listing Definitions

List the definitions loaded by your application:

```bash
php artisan storyfeed:list
```

Use `--type=order` or `--verb=place` to filter the list. The output includes the headline, icon and declaration location. [Commands](/reference/commands) lists the inspection options.

## Caching Definitions

Cache definitions during deployment:

```bash
php artisan storyfeed:cache
```

Storyfeed loads the cached manifest instead of evaluating `routes/feed.php` at boot. Rebuild the cache after changing definitions. To remove it:

```bash
php artisan storyfeed:clear
```

Closure headlines are serialised into the cache. A closure that cannot be serialised fails the command and identifies its source location. Keep verb vocabulary registration in a service provider; the feed file contains story definitions. See [Commands](/reference/commands#manifest).
