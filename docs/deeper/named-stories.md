# Named Stories

A named story gives a declaration a handle you can use when publishing.
The name selects the verb and checks the object's type.

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

This call supplies the verb directly. A named declaration lets the call site
refer to the definition instead, as a named `Route` does in Laravel.

## Naming a Story

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->name('order.place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag');
```

Publish it from the controller by name:

```php
// app/Http/Controllers/PlaceOrderController.php, __invoke()
$activity = story('order.place', $order)
    ->by($request->user())
    ->to($order->kitchen)
    ->publish();
```

<FeedExample :items="[placed]" />

`story()` takes a name, just as Laravel's `route()` does. Its facade equivalent
is `Storyfeed::route()`, corresponding to Laravel's `URL::route()`:

```php
// app/Http/Controllers/PlaceOrderController.php, __invoke()
use Storyfeed\Facades\Storyfeed;

$activity = Storyfeed::route('order.place', $order)
    ->by($request->user())
    ->to($order->kitchen)
    ->publish();
```

<FeedExample :items="[placed]" />

An unknown name throws `Story [x] not defined.` A supplied object of another
morph type throws `StoryObjectMismatch`. Neither call treats its first argument
as an unnamed verb. Publish unnamed verbs with `Storyfeed::activity()` or an
enum's `Act::Place->of($order)`.

A declaration bound to a Story constructed with data still requires
`Storyfeed::publish(new OrderWasPlaced(...))`; giving it a name does not bypass
`toFeedActivity()`.

## Prefixing Names

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::name('order.')->group(function () {
    Story::for(Order::class)->verb('place')
        ->name('place')
        ->headline(':actor placed :object with :target')
        ->icon('shopping-bag');
});
```

<FeedExample :items="[placed]" />

This is an alternative to the preceding declaration. The prefix is appended
exactly as written, including the dot, producing `order.place`.

## Resource Story Names

```php
// routes/feed.php
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class);
```

With `Order` mapped to the morph alias `order`, every resource verb receives
`order.{verb}` as its name. Resource names are singular: the morph alias exactly
as stored. The default name **is the key**: `order.confirm` is both the name and
the `order` + `confirm` declaration key.

| Resource Verb | Default Name |
|---|---|
| `create` | `order.create` |
| `update` | `order.update` |
| `confirm` declared by `OrderStory::confirm()` | `order.confirm` |

Leaving these defaults keeps the name and key the same. `names()` can override
them; each row below is an alternative suffix on the resource declaration.

| Suffix | Result |
|---|---|
| `->names('checkout')` | `checkout.create`, `checkout.update`, and the other verbs under `checkout` |
| `->names(['confirm' => 'checkout.confirm'])` | only `confirm` is renamed |

A verb declared individually is unnamed until it receives `->name()`. That
also applies when the declaration binds a single-verb class or a Story
constructed with data.

## Inspecting Names

```php
// app/Http/Controllers/PlaceOrderController.php, __invoke()
use Storyfeed\Facades\Story;

Story::has('order.place');         // true for the declaration above
$activity->storyName();            // 'order.place'
$activity->storyIs('order.*');     // true
$activity->storyIs('checkout.*');  // false
```

`Story::has()` also accepts an array and returns `true` only when every name
exists. `storyIs()` accepts several patterns and matches if any one matches.
These correspond to Laravel's `Route::has()` and `routeIs()`.

Names live in the declarations, not in activity rows. `storyName()` resolves
from the activity's object type and verb using the current definitions. An
unnamed key returns `null`; `storyIs()` returns `false` for it.

## Checking Names During Deployment

```bash
php artisan storyfeed:cache
```

Duplicate names fail caching, naming both declarations, as duplicate route
names fail `route:cache`. At runtime, a duplicate name resolves to the last
declaration. `storyfeed:cache` also runs under `php artisan optimize`.

```bash
php artisan storyfeed:list --name=order.
```

`--name` filters names containing the supplied text. The listing includes the
name beside its declaration; `--json` includes it too.

## Checking Names With PHPStan

```txt
# phpstan.neon, when phpstan/extension-installer is not installed
includes:
    - vendor/storyfeed/storyfeed/extension.neon
```

With `phpstan/extension-installer`, the package registers `StoryNameRule`
automatically. The rule checks literal names in `story()`, `Storyfeed::route()`
and `Story::has()` against the application's loaded definitions. Larastan must
boot the application so those names are available.

An undefined literal reports `storyfeed.storyName`. A name calculated at
runtime is not checked; the runtime lookup still throws if it is undefined.
