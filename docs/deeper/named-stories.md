# Named Stories

## Introduction

A named story gives a declaration a handle you can use when publishing.
The name selects the verb and checks the object's type, so a misspelt name or
an object of the wrong type throws instead of recording an activity, and
[static analysis](#checking-names-with-static-analysis) can check the names
in your code.

<script setup>
import { scene } from '../.vitepress/theme/world'
const placed = { ...scene.order, data: null, glyph_intent: null }
</script>

<a id="naming-a-story"></a>

## Naming Stories

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->name('order.place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag');
```

<a id="publishing-an-activity"></a>

## Publishing Named Stories

Publish it from an authenticated controller by name:

```php memo="app/Http/Controllers/PlaceOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PlaceOrderController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update(['status' => 'placed']);

        $activity = story('order.place', $order)
            ->by($request->user())
            ->to($order->shop)
            ->publish();

        return to_route('orders.show', $order);
    }
}
```

<FeedExample :items="[placed]" />

`story()` takes a name, just as Laravel's `route()` does.
`Storyfeed::route('order.place', $order)` is its facade equivalent, as
`URL::route()` is for `route()`.

An unknown name throws `Story [x] not defined.` A supplied object of another
morph type throws `StoryObjectMismatch`. Neither call treats its first argument
as an unnamed verb. Publish unnamed verbs with `Storyfeed::activity()` or an
enum's `Act::Place->of($order)`.

A declaration bound to a Story constructed with data still requires
`Storyfeed::publish(new OrderWasPlaced(...))`; giving it a name does not bypass
`toFeedActivity()`.

## Story Groups

<a id="prefixing-names"></a>

### Name Prefixes

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::as('billing.')->group(function () {
    Story::for(Order::class)->verb('place')
        ->name('place')
        ->headline(':actor placed :object with :target')
        ->icon('shopping-bag');
});
```

<FeedExample :items="[placed]" />

This is an alternative to the preceding declaration. The prefix is appended
exactly as written, including the dot, producing `billing.place`.

`Story::name()` is an alias for `Story::as()`, as `Route::as()` / `Route::name()`
are in Laravel. An individual declaration keeps `->name()` to set its name.

<a id="chaining-group-attributes"></a>

### Shared Attributes

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::middleware('batch:5 minutes')->as('billing.')->for(Order::class)
    ->group(function () {
        Story::verb('place')
            ->name('place')
            ->headline(':actor placed :object with :target')
            ->icon('shopping-bag');
    });
```

<FeedExample :items="[placed]" />

This alternative declaration names the story `billing.place` and gives it a
five-minute batch window. The attributes chain in any order, as
`Route::middleware()->as()->group()` does in Laravel. `for()`, `middleware()`,
`withoutMiddleware()`, `as()` / `name()` and the role constraints can each
follow any of the others.

For one declaration, omit `group()`:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->as('billing.')->middleware('batch:5 minutes')
    ->verb('place')
    ->name('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag');
```

<FeedExample :items="[placed]" />

The same direct form accepts `fallback()`, `resource()`, `resources()`,
`noun()`, `missing()` and `activityStreamsType()`.

<a id="nesting-groups"></a>

### Nested Groups

```php memo="routes/feed.php"
use App\Models\Order;
use App\Models\User;
use Storyfeed\Facades\Story;

Story::for(Order::class)->as('billing.')->middleware('batch:5 minutes')
    ->whereActor(User::class, 'party')->group(function () {
        Story::as('orders.')->whereActor(User::class)
            ->withoutMiddleware('batch:5 minutes')->group(function () {
                Story::verb('place')
                    ->name('place')
                    ->headline(':actor placed :object with :target')
                    ->icon('shopping-bag');
            });
    });
```

<FeedExample :items="[placed]" />

The name is `billing.orders.place`. The inner group allows only a user as its
actor and removes the inherited five-minute batch middleware. The built-in
`batch` middleware still applies; exclusions match resolved strings exactly.

| Attribute | Nested Behaviour |
|---|---|
| name prefix | concatenates outer and inner prefixes exactly as written |
| middleware and exclusions | append to the enclosing group's lists |
| role constraints | the inner constraint replaces the outer one for that role; a verb's own constraint wins over its groups |
| object type | one `for()` scope; nesting another throws |

[Constraining Roles](/deeper/constraining-roles) covers the allowed role types.

<a id="resource-story-names"></a>

## Naming Resource Stories

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class);
```

With `Order` mapped to the morph alias `order`, every resource verb receives
`order.{verb}` as its name. Resource names are singular: the morph alias exactly
as written.

| Resource Verb | Default Name |
|---|---|
| `create` | `order.create` |
| `update` | `order.update` |
| `confirm` declared by `OrderStory::confirm()` | `order.confirm` |

`names()` overrides them; each row below is an alternative suffix on the
resource declaration.

| Suffix | Result |
|---|---|
| `->names('checkout')` | `checkout.create`, `checkout.update`, and the other verbs under `checkout` |
| `->names(['confirm' => 'checkout.confirm'])` | only `confirm` is renamed |

A verb declared individually is unnamed until it receives `->name()`. That
also applies when the declaration binds a single-verb class or a Story
constructed with data.

## Inspecting Story Names

### Listing Stories

```bash
php artisan storyfeed:list --name=order.
```

`--name` filters names containing the supplied text. The listing includes the
name beside its declaration; `--json` includes it too.

<a id="inspecting-names"></a>

### Matching Names

```php memo="app/Http/Controllers/PlaceOrderController.php" at="__invoke()"
use Storyfeed\Facades\Story;

Story::has('order.place');         // true for the declaration above
$activity->storyName();            // 'order.place'
$activity->storyIs('order.*');     // true
$activity->storyIs('checkout.*');  // false
```

`Story::has()` also accepts an array and returns `true` only when every name
exists. `storyIs()` accepts several patterns and matches if any one matches.
These correspond to Laravel's `Route::has()` and `routeIs()`.

Names are not stored with activities. `storyName()` looks up the name from the
activity's object type and verb in the current definitions. An activity whose
declaration has no name returns `null`, and `storyIs()` returns `false` for it.

<a id="checking-names-during-deployment"></a>

## Caching Named Stories

Duplicate names fail [`storyfeed:cache`](/basics/the-feed-file#caching-definitions),
naming both declarations, as duplicate route names fail `route:cache`. At
runtime, a duplicate name resolves to the last declaration.

<a id="checking-names-with-phpstan"></a>

## Checking Names With Static Analysis

```txt memo="phpstan.neon"
# when phpstan/extension-installer is not installed
includes:
    - vendor/storyfeed/storyfeed/extension.neon
```

With `phpstan/extension-installer`, the package registers `StoryNameRule`
automatically. The rule checks literal names in `story()`, `Storyfeed::route()`
and `Story::has()` against the application's loaded definitions. Larastan must
boot the application so those names are available.

An undefined literal reports `storyfeed.storyName`. A name calculated at
runtime is not checked; the runtime lookup still throws if it is undefined.
