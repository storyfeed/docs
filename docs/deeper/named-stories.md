# Named Stories

## Introduction

A named story lets you publish using a registered declaration name. The name
selects the verb and checks the object's type, so a misspelling or wrong object
type throws an exception before an activity is recorded.
[Static analysis](#checking-names-with-static-analysis) can also check these
names in your code.

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

You can name declarations for a specific verb. Fallback declarations
(`fallback()` or verb `*`) supply defaults and cannot be named; calling `name`
on them throws an exception. Exclude fallbacks when testing that every
declaration has a name.

A declaration's name is used by application code; its verb is stored with
activities. Renaming a declaration does not require changing stored activities,
but you must update code that uses the name. Changing the stored verb requires
a data migration.

## Publishing Named Stories

Publish it by name:

```php memo="app/Http/Controllers/PlaceOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PlaceOrderController
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $activity = story('order.place', $order)
            ->by($request->user())
            ->to($order->shop)
            ->publish();

        return back();
    }
}
```

<FeedExample :items="[placed]" />

The `story` helper accepts a name, like Laravel's `route` helper.
You may also use `Storyfeed::route('order.place', $order)`, as you would use
Laravel's `URL::route()`.

An unknown name throws `Story [x] not defined.` An object with the wrong morph
type throws `StoryObjectMismatch`. Both methods require a registered name.
To publish an unnamed order-placement verb, use
`Storyfeed::activity('place', $order)`.

A Story that requires constructor data must still be published with
`Storyfeed::publish(new OrderWasPlaced(...))`. Naming its declaration does not
bypass the `toFeedActivity` method.

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

This is an alternative to the preceding declaration. The prefix is prepended
exactly as written, including the dot, producing `billing.place`.

The `Story::name` method is an alias for `Story::as`, following Laravel's
`Route::name` and `Route::as` methods. Use `->name()` on an individual declaration.

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

This alternative names the story `billing.place` and sets a five-minute batch
window. As with `Route::middleware()->as()->group()`, you may chain `for`,
`middleware`, `withoutMiddleware`, `as` / `name`, and role constraints in any order.

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
| name prefix | joins outer and inner prefixes exactly as written |
| middleware and exclusions | append to the enclosing group's lists |
| role constraints | the inner constraint replaces the outer one for that role; a verb's constraint takes precedence over its groups |
| object type | one `for()` scope; nesting another throws an exception |

[Constraining Roles](/deeper/constraining-roles) covers the allowed role types.

<a id="resource-story-names"></a>

## Naming Resource Stories

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class);
```

With `Order` mapped to the morph alias `order`, resource verbs receive names
such as `order.create`. The prefix uses the morph alias exactly as written.

| Resource Verb | Default Name |
|---|---|
| `create` | `order.create` |
| `update` | `order.update` |
| `confirm` declared by `OrderStory::confirm()` | `order.confirm` |

Use the `names` method to override these names. Each example below is an
alternative option on the resource declaration:

| Suffix | Result |
|---|---|
| `->names('checkout')` | `checkout.create`, `checkout.update`, and the other verbs under `checkout` |
| `->names(['confirm' => 'checkout.confirm'])` | only `confirm` is renamed |

These change only the names. The stored verb is still `confirm`, the snake_cased
name of the `OrderStory::confirm()` method.

Individually declared verbs have no name until you call `->name()`, including
verbs registered with a single-verb class or a Story that accepts constructor data.

## Inspecting Story Names

### Listing Stories

```bash
php artisan storyfeed:list --name=order.
```

The `--name` option filters names containing the supplied text. Both text and
JSON output include each definition's name.

<a id="inspecting-names"></a>

### Matching Names

Use `$activity` returned by `publish()` in the controller above:

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

Story names are resolved from current definitions rather than stored with
activities. The `storyName` method looks up the activity's object type and verb.
If its declaration is unnamed, `storyName` returns `null` and `storyIs` returns
`false`.

The `Storyfeed\Facades\Storyfeed` facade also provides these lookups:

| Method | Returns |
|---|---|
| `Storyfeed::storyNames()` | all names as `name => type.verb` |
| `Storyfeed::namedStory($name)` | the definition key, or `null` |
| `Storyfeed::storyNameFor($type, $verb)` | the name, including a wildcard type fallback |

<a id="checking-names-during-deployment"></a>

## Caching Named Stories

```bash
php artisan storyfeed:cache
```

Require this command to succeed in an isolated CI or deployment run. It checks
for duplicate names, conflicting definitions and uncacheable closures. See
[Caching Definitions](/reference/commands#caching-definitions).

Duplicate names cause [`storyfeed:cache`](/basics/the-feed-file#caching-definitions)
to fail with both declaration locations, as they do for Laravel's `route:cache`.
At runtime, the last declaration with that name is used.

## Testing Story Names

If your application requires every concrete declaration to have a name, test
the definitions returned by the public listing command:

```php memo="tests/Feature/StoryNamesTest.php"
use Illuminate\Support\Facades\Artisan;

// Run with an uncached application to check current declarations.
it('names every concrete declaration', function () {
    expect(Artisan::call('storyfeed:list', ['--json' => true]))->toBe(0);

    $rows = json_decode(Artisan::output(), true, flags: JSON_THROW_ON_ERROR);
    $concrete = array_values(array_filter(
        $rows,
        fn (array $row): bool => $row['verb'] !== '*',
    ));

    expect($concrete)->not->toBeEmpty();

    foreach ($concrete as $row) {
        expect($row['name'], $row['type'].'.'.$row['verb'])
            ->toBeString()->not->toBe('');
    }
});
```

This checks each declaration's own name. A named wildcard declaration does
not make an unnamed type-specific declaration pass.

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

An undefined literal name reports `storyfeed.storyName`. Names calculated at
runtime are skipped by static analysis, but still throw an exception if the
runtime lookup finds no matching declaration.
