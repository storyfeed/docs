# Batching Activities

<script setup>
import { scene } from '../.vitepress/theme/world'
const placed = scene.order
</script>

## Introduction

A batch collects one actor's activities while they keep arriving. Batches
don't change the feed's rows themselves: when a batch closes, its runs of
bundleable activities become a [composite](/shaping/composites), and
`BatchClosed` lets your app act on the whole batch.

<a id="setting-a-batch-window"></a>

## Batch Windows

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

## Publishing Outside a Batch

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

## Batch Metadata

Pass your own metadata to the batch the activity joins with the `meta` method:

::: code-group

```php [Fluent Syntax] memo="app/Http/Controllers/OrderController.php"
Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($shop)
    ->meta(['channel' => 'kiosk'])
    ->publish();
```

```php [Named Arguments] memo="app/Http/Controllers/OrderController.php"
Storyfeed::record(
    verb: 'place',
    object: $order,
    actor: $request->user(),
    target: $shop,
    meta: ['channel' => 'kiosk'],
);
```

:::

Verb enums take `meta` the same way. Each activity's keys are written over the
batch's earlier ones, so later activities in the batch can add to it. An
activity that joins no batch, such as an anonymous or `unbatched` one, drops
its metadata. A queued activity writes it on the worker.

The metadata is stored in `feed_batches.meta`, and `BatchClosed` listeners
receive it as `$event->batch->meta`. Top-level keys starting with `storyfeed.`
are reserved for Storyfeed and throw an exception.

## Listening for Closed Batches

When a batch closes, Storyfeed dispatches `Storyfeed\Events\BatchClosed` after
the outermost transaction commits. The event's `$event->batch` contains an
immutable copy of the closed batch and its activities. Register a listener to
handle the completed batch.

A batch whose window has elapsed closes at the actor's next publish. To
dispatch `BatchClosed` promptly, schedule
[`storyfeed:close-batches`](/reference/commands#scheduling-maintenance).

The batch's `actor_id` and its activities' role IDs are strings, as in
[the events' activities](/recording/publishing-from-events#role-ids-are-strings).
