# Story Middleware & Batching

## Introduction

Story middleware runs around publishing an activity. Use it to add shared
data, supply roles, or decide whether to publish. Built-in batch middleware
collects an actor's activities into a sitting.

<script setup>
import { scene } from '../.vitepress/theme/world'
const placed = { ...scene.order, data: null, glyph_intent: null }
const marked = { ...placed, data: { reviewed: true } }
</script>

<a id="writing-story-middleware"></a>

## Defining Story Middleware

```php memo="app/StoryMiddleware/MarkReviewed.php"
<?php

namespace App\StoryMiddleware;

use Closure;
use Storyfeed\PendingActivity;

class MarkReviewed
{
    public function handle(PendingActivity $activity, Closure $next): mixed
    {
        $activity->data([
            ...($activity->activity->data ?? []),
            'reviewed' => true,
        ]);

        return $next($activity);
    }
}
```

Middleware receives the `PendingActivity`
and passes it to `$next`. Code after `$next($activity)` can inspect the returned
activity; check its `exists` property before work that requires a stored row.

Return `null` without calling `$next` to publish nothing. The builder's
`publish()` then returns an unsaved activity (`exists === false`). Return the
result of `$next` on the normal path. Middleware cannot change the activity's
verb or object type.

### Closure Middleware

A closure works as middleware too:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag')
    ->middleware(
    // Leave type hints off closures that storyfeed:cache will serialize.
    static function ($activity, $next) {
        return $next($activity->data([
            ...($activity->activity->data ?? []),
            'reviewed' => true,
        ]));
    },
);
```

<FeedExample :items="[marked]" expanded />

`Storyfeed::fake()` runs the same middleware pipeline.

<a id="registering-aliases-and-groups"></a>

## Registering Middleware

### Aliases

Register aliases and named groups in a service provider:

```php memo="app/Providers/AppServiceProvider.php"
<?php

namespace App\Providers;

use App\StoryMiddleware\MarkReviewed;
use Illuminate\Support\ServiceProvider;
use Storyfeed\Facades\Story;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Register here: cached stories do not load routes/feed.php.
        Story::aliasMiddleware('reviewed', MarkReviewed::class);
        Story::middlewareGroup('review', ['reviewed']);
    }
}
```

### Groups

`middlewareGroup()` gives a list of middleware a shared name. The `review`
group above contains the `reviewed` alias; either name may be assigned to a story.

## Assigning Middleware to Stories

Attach the class to the verb:

```php memo="routes/feed.php"
use App\Models\Order;
use App\StoryMiddleware\MarkReviewed;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag')
    ->middleware(MarkReviewed::class);
```

<FeedExample :items="[marked]" expanded />

Use the group in the feed file:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::middleware('review')->group(function () {
    Story::for(Order::class)->verb('place')
        ->headline(':actor placed :object with :target')
        ->icon('shopping-bag');
    Story::for(Order::class)->verb('complete')
        ->headline(':actor completed :object')
        ->withoutMiddleware('reviewed');
});
```

<FeedExample :items="[marked]" expanded />

### Execution Order

The `place` activity receives the review data; `complete` skips that middleware.
The built-in `default` group runs first, followed by enclosing groups and the
verb's own middleware. Identical resolved strings run once. The `default` group
holds the `batch` middleware; redefine it to run your own middleware for every
verb:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Story;

Story::middlewareGroup('default', ['batch', 'reviewed']);
```

A queued activity runs its story middleware on the worker.

### Excluding Middleware

Exclusions match resolved strings exactly: `withoutMiddleware('batch')` leaves
`batch:5 minutes` in place. Use `unbatched()` to remove batching altogether.

### Parameters

A string may name a class, an alias, or a group. Append arguments after a colon,
as in `batch:5 minutes`; a custom class receives them after `$next` in `handle()`.
A constructed Story may declare its middleware in `middleware(): array`; that
method is read without constructor data.

## Batching Activities

<a id="setting-a-batch-window"></a>

### Batch Windows

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag')
    ->batched(within: '5 minutes');
```

<FeedExample :items="[placed]" />

The activity joins the actor's open batch. Its headline stays the same. A batch
collects what one actor did in one sitting; a feed batch is not a `Bus::batch()`
job batch.

Each batched activity extends the closing time to its `published_at` plus its
verb's window, if that is later. An activity before that closing time joins the
open sitting. One at or after it starts another. Anonymous activities have no actor's sitting to join.

| Declaration | Batch Behaviour |
|---|---|
| nothing | the built-in `batch` middleware uses `grouping.batch.quiet_minutes` |
| `batched()` | uses the configured window |
| `batched(within: '5 minutes')` | uses a five-minute window |
| `unbatched()` | does not join, extend or close a sitting |

`within` accepts a positive interval string or a `DateInterval`.
`storyfeed.grouping.batch.enabled = false` disables batching.

The examples below are alternative declarations for `place`. Replace its
existing declaration when trying one.

### Publishing Outside a Batch

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag')
    ->unbatched();
```

<FeedExample :items="[placed]" />

The activity remains in the feed. It does not affect the actor's open batch.
`unbatched()` removes batch middleware, including a window inherited from a group.

<a id="preserving-an-actor-or-context"></a>
<a id="preserving-actor-and-context-values"></a>

## Supplying Default Roles

```php memo="app/StoryMiddleware/UseServiceActor.php"
<?php

namespace App\StoryMiddleware;

use Closure;
use Storyfeed\PendingActivity;

class UseServiceActor
{
    public function handle(PendingActivity $activity, Closure $next): mixed
    {
        if (! $activity->hasActor()) {
            $activity->by('System'); // A declared party.
        }

        return $next($activity);
    }
}
```

Use `hasActor()` before supplying an actor. It also returns `true` for an
explicitly anonymous activity. Use `has('context')` before supplying context.
These checks preserve the [actor and context precedence](/deeper/activity-scopes#actor-and-context-precedence).
Declare the party name in the [party list](/deeper/parties#declaring-parties);
`->by()` does not check that list.

<a id="caching-closure-middleware"></a>
<a id="inspecting-middleware"></a>

## Caching and Inspecting Middleware

[`storyfeed:cache`](/basics/the-feed-file#caching-definitions) keeps middleware
declarations, closures included. Keep aliases and named groups in a service
provider so they also exist when the feed file is cached. `storyfeed:list -v`
shows each verb's resolved middleware classes and arguments.
