# Story Middleware & Batching

A verb can set its batch window or stay outside batches.
Story middleware runs around publishing an activity.

<script setup>
import { scenes } from '../.vitepress/theme/samples'
const placed = { ...scenes.order, data: null, glyph_intent: null }
const marked = { ...placed, data: { reviewed: true } }
</script>

## Setting a Batch Window

```php
// routes/feed.php
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
open sitting. One at or after it starts another. Anonymous activities have no
actor's sitting to join.

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

## Publishing Outside a Batch

```php
// routes/feed.php
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

## Writing Story Middleware

```php
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

Attach the class to the verb:

```php
// routes/feed.php
use App\Models\Order;
use App\StoryMiddleware\MarkReviewed;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag')
    ->middleware(MarkReviewed::class);
```

<FeedExample :items="[marked]" expanded />

The activity carries `data.reviewed`. Middleware receives the `PendingActivity`
and passes it to `$next`. Code after `$next($activity)` can inspect the returned
activity; check its `exists` property before work that requires a stored row.

Return `null` without calling `$next` to publish nothing. The builder's
`publish()` then returns an unsaved activity (`exists === false`). Return the
result of `$next` on the normal path. Middleware cannot change the activity's
verb or object type.

## Registering Aliases and Groups

```php
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

Use the group in the feed file:

```php
// routes/feed.php
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

The `place` activity receives the review data; `complete` skips that middleware.
The built-in `default` group runs first, followed by enclosing groups and the
verb's own middleware. Identical resolved strings run once. Exclusions match
resolved strings exactly: `withoutMiddleware('batch')` leaves
`batch:5 minutes` in place. Use `unbatched()` to remove batching altogether.

A string may name a class, an alias, or a group. Append arguments after a colon,
as in `batch:5 minutes`; a custom class receives them after `$next` in `handle()`.
A constructed Story may declare its middleware in `middleware(): array`; that
method is read without constructor data.

## Preserving an Actor or Context

```php
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
The party name must be [declared](/deeper/parties#declaring-parties).

## Caching Closure Middleware

```php
// routes/feed.php
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

`storyfeed:cache` preserves middleware declarations and closures. Keep aliases
and named groups in a service provider so they also exist when the feed file
is cached. `Storyfeed::fake()` runs the same middleware pipeline.

## Inspecting Middleware

```bash
php artisan storyfeed:list -v
```

The middleware column shows the resolved classes and arguments.
`storyfeed:list --json` also includes them.
