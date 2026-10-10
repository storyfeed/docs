# Story Middleware & Batching

## Introduction

Use story middleware to add shared data, supply roles, or decide whether to
publish an activity. The built-in batch middleware collects one actor's
activities into a batch.

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

Middleware receives a `PendingActivity` and passes it to `$next`. Code after
`$next($activity)` can inspect the returned activity. Check its `exists` property
before performing work that requires a stored activity.

Return `null` without calling `$next` to skip publishing. The builder's
`publish` method then returns an unsaved activity (`exists === false`). To
continue publishing, return the result of `$next($activity)`. Middleware cannot
change the verb or object type.

### Closure Middleware

You may also define middleware as a closure:

```php memo="routes/feed.php"
use App\Models\Order;
use Closure;
use Storyfeed\Facades\Story;
use Storyfeed\PendingActivity;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag')
    ->middleware(
    static function (PendingActivity $activity, Closure $next) {
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

<a id="aliases"></a>
<a id="groups"></a>

Register aliases and named groups in a service provider, because cached
stories do not load `routes/feed.php`:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use App\StoryMiddleware\MarkReviewed;
use Storyfeed\Facades\Story;

Story::aliasMiddleware('reviewed', MarkReviewed::class);
Story::middlewareGroup('review', ['reviewed']);
```

`aliasMiddleware` gives a class a short name. `middlewareGroup` registers a
list of middleware under one name: the `review` group contains the `reviewed`
alias, and either may be assigned to a story.

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

The `place` activity receives the review data; `complete` skips that middleware:

<FeedExample :items="[marked]" expanded />

### Execution Order

The built-in `default` group runs first, followed by enclosing groups and the
verb's middleware. Identical resolved middleware strings run once. The
`default` group contains `batch`. To run middleware for every verb, push it
onto the `default` group:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Story;

Story::pushMiddlewareToGroup('default', 'reviewed');
```

`prependMiddlewareToGroup` adds middleware to the start of a group instead.
Neither adds middleware a group already contains. To replace the whole group,
redefine it with `Story::middlewareGroup('default', [...])`.

A queued activity runs its story middleware on the worker.

### Excluding Middleware

Exclusions match resolved strings exactly: `withoutMiddleware('batch')` leaves
`batch:5 minutes` in place. Use `unbatched()` to remove batching altogether.

### Parameters

A middleware string may name a class, alias, or group. Append arguments after a
colon, as in `batch:5 minutes`. A custom class receives them after `$next` in
its `handle` method. A Story may declare middleware in `middleware(): array`,
but that method cannot use constructor data.

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

A batch collects activities by one actor until its window closes. The activity
joins the actor's open batch without changing its headline. Storyfeed batches
are separate from Laravel job batches created with `Bus::batch()`.

The window determines how long Storyfeed waits for more activities before
closing the batch. Each batched activity extends the closing time to its
`published_at` plus its verb's window, if that is later. An activity before an open batch’s start or at or after its closing time
starts a separate batch. Closed batches stay closed.
Anonymous activities cannot join a batch because they have no recorded actor.
Batches are stored in [`feed_batches`](/reference/schema#feed-batches).

| Declaration | Batch Behaviour |
|---|---|
| nothing | the built-in `batch` middleware uses `grouping.batch.quiet_minutes` |
| `batched()` | uses the configured window |
| `batched(within: '5 minutes')` | uses a five-minute window |
| `unbatched()` | does not join, extend, or close a batch |

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

The activity remains in the feed without affecting the actor's open batch.
The `unbatched` method removes batch middleware, including inherited windows.

### Listening for Closed Batches

When a batch closes, Storyfeed dispatches `Storyfeed\Events\BatchClosed` after
the outermost transaction commits. The event's `$event->batch` contains an
immutable copy of the closed batch and its activities. Register a listener to
handle the completed batch.

A batch whose window has elapsed closes at the actor's next publish. To
dispatch `BatchClosed` promptly, schedule
[`storyfeed:close-batches`](/reference/commands#scheduling-maintenance).

The batch's `actor_id` and every role ID in its activities are strings when
non-null: compare with `'1'`, not `1`. Null role IDs remain `null`.

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

Call `hasActor()` before supplying an actor; it also returns `true` for explicit
anonymity. Call `has('context')` before supplying context. These checks preserve
[actor and context precedence](#resolving-role-precedence).
Declare party names in the [party list](/deeper/parties#declaring-parties),
because the `by` method does not check that list.

## Resolving Role Precedence

Storyfeed resolves each role from the first applicable source:

| Priority | Actor | Context |
|---|---|---|
| Call site | `->by($user)` or explicit anonymity | `->context($model)` |
| Scope | `Storyfeed::actor()` or `storyfeed.actor:{Party}`, including a scope carried into a queued job | `Storyfeed::context()` or `storyfeed.context:{param}`, including a scope carried into a queued job |
| [Story middleware](/deeper/story-middleware-and-batching) | supplies an actor when `hasActor()` is false | supplies context when `has('context')` is false |
| Verb | the [verb's actor](/basics/stories#request-based-actors) | none |
| Resolver or user | a custom [`actor_resolver`](/deeper/parties#resolving-the-default-actor); without one, the authenticated user, or in a queued job the user authenticated at dispatch | none |
| Fallback | [`parties.fallback`](/deeper/parties#setting-a-default-actor) | none |

A custom resolver replaces the authenticated user as a source. If it returns
`null`, the fallback party applies. Explicit anonymity records no actor.
Without a resolved actor, the activity is anonymous and cannot join a
[batch](/deeper/story-middleware-and-batching#batch-windows). If no context is
supplied, that role remains empty.

<a id="caching-closure-middleware"></a>
<a id="inspecting-middleware"></a>

## Caching and Inspecting Middleware

The [`storyfeed:cache` command](/basics/the-feed-file#caching-definitions) caches
middleware declarations, including closures. Register aliases and named groups
in a service provider so they remain available when the feed file is cached.
Use `storyfeed:list -v` to inspect each verb's resolved middleware and arguments.
