# Queues

`publish()` records an activity immediately, in the current request. To record
from a queue instead, publish from a queued listener or a job. The user who
dispatched the job is still the actor; the time needs `publishedAt()`.

<script setup>
import { who, where, orders, activity, group } from '../.vitepress/theme/samples'

const late = [
  activity({
    id: 'qu1', verb: 'place', glyph: 'shopping-bag',
    published_at: '2026-08-14T12:05:00.000000Z',
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.third, target: where.kitchen,
  }),
  group({
    id: 'qu2', verb: 'place', axis: 'repeat', count: 2, glyph: 'shopping-bag',
    published_at: '2026-08-13T12:55:00.000000Z',
    headline_template: ':actor placed :count orders with :target',
    actors: [who.regular], targets: [where.kitchen],
    objects: [orders.first, orders.second],
    distinct: { actors: 1, objects: 2, targets: 1 },
  }),
]

const dated = [
  group({
    id: 'qu3', verb: 'place', axis: 'repeat', count: 3, glyph: 'shopping-bag',
    published_at: '2026-08-13T12:58:00.000000Z',
    headline_template: ':actor placed :count orders with :target',
    actors: [who.regular], targets: [where.kitchen],
    objects: [orders.first, orders.second, orders.third],
    distinct: { actors: 1, objects: 3, targets: 1 },
  }),
]
</script>

## A Queued Listener

```php
<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Storyfeed\Events\ActivityPublished;

class BroadcastActivity implements ShouldQueue
{
    public function handle(ActivityPublished $event): void
    {
        $activity = $event->activity;        // an ActivitySnapshot: plain values, not a model

        $activity->verb;                     // 'place'
        $activity->object['label'];          // the label as it read at publish
        $activity->published_at;             // '2026-08-13T23:58:00+00:00'
        $activity->toPayload();              // the whole snapshot as an array
    }
}
```

`ActivityPublished` and `ActivityDeleted` carry a readonly `ActivitySnapshot`;
`BatchClosed` carries a `BatchSnapshot` of activity snapshots. Both hold only
arrays, scalars and null.

| Property | Type |  |
|---|---|---|
| `id`, `uid` | `int`, `string` | the activity's identity |
| `verb` | `string` | the verb as stored |
| `actor`, `object`, `target`, `context`, `origin`, `result`, `instrument` | `?array` | `null` when the role is empty |
| `data` | `array` | the activity's own data |
| `published_at`, `deleted_at` | `?string` | ISO 8601 |
| `forceDeleted` | `bool` | true on `ActivityDeleted` for a hard delete |

Each role array holds `type`, `id`, `label`, `data`, `content`,
`mediaType` and `attributedTo`, as the entity's snapshot read at publish.

Not carried: the actor's model, the entity's `url` and `media` (they resolve at
read time), and anything that changed after publish. A listener that needs the
current state reads the feed.

### Inside a Transaction

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Storyfeed\Facades\Storyfeed;

class CheckoutController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        DB::transaction(function () use ($request, $order) { // [!code focus]
            $order->update(['status' => 'placed']);

            Storyfeed::activity() // [!code focus]
                ->by($request->user()) // [!code focus]
                ->action('place', $order) // [!code focus]
                ->to($order->kitchen) // [!code focus]
                ->publish();                          // nothing reaches the queue yet // [!code focus]
        });                                           // the listener's job is pushed here // [!code focus]

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
use Illuminate\Support\Facades\DB;
use Storyfeed\Facades\Storyfeed;

class CheckoutController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        DB::transaction(function () use ($request, $order) { // [!code focus]
            $order->update(['status' => 'placed']);

            Storyfeed::record( // [!code focus]
                verb: 'place', // [!code focus]
                object: $order, // [!code focus]
                actor: $request->user(), // [!code focus]
                target: $order->kitchen, // [!code focus]
            );                                        // nothing reaches the queue yet // [!code focus]
        });                                           // the listener's job is pushed here // [!code focus]

        return to_route('orders.show', $order);
    }
}
```
:::

The events implement `ShouldDispatchAfterCommit`: the job is pushed at the
outermost commit, and a rollback leaves no row and no job.

## A Job That Publishes

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Storyfeed\Facades\Storyfeed;

class RecordOrder implements ShouldQueue
{
    use Dispatchable, SerializesModels;

    public Carbon $occurredAt;

    public function __construct(public Order $order, public User $customer)
    {
        $this->occurredAt = now();            // the fact's time, captured where it happened
    }

    public function handle(): void
    {
        Storyfeed::activity() // [!code focus]
            ->by($this->customer) // [!code focus]
            ->action('place', $this->order) // [!code focus]
            ->to($this->order->kitchen) // [!code focus]
            ->publishedAt($this->occurredAt)  // without this, the row is dated when the job ran // [!code focus]
            ->publish(); // [!code focus]
    }
}
```

```php [Named Arguments]
<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Storyfeed\Facades\Storyfeed;

class RecordOrder implements ShouldQueue
{
    use Dispatchable, SerializesModels;

    public Carbon $occurredAt;

    public function __construct(public Order $order, public User $customer)
    {
        $this->occurredAt = now();            // the fact's time, captured where it happened
    }

    public function handle(): void
    {
        Storyfeed::record( // [!code focus]
            verb: 'place', // [!code focus]
            object: $this->order, // [!code focus]
            actor: $this->customer, // [!code focus]
            target: $this->order->kitchen, // [!code focus]
            publishedAt: $this->occurredAt,   // without this, the row is dated when the job ran // [!code focus]
        ); // [!code focus]
    }
}
```
:::

### Event Time and Job Time

*A user places two orders at 23:52 and 23:55. The third, at 23:58, waits in a
backlog and its job runs at 00:05. Without `publishedAt()`:*

<FeedExample context :items="late" />

*With `publishedAt($this->occurredAt)`:*

<FeedExample :items="dated" />

Grouping is cut by day on `published_at`, so the late row missed its group.
`published_at` also decides the batch a row joins, its position under a cursor,
and the day heading a renderer shows.

A backdated row can land above a cursor a client has already paged past. A
fresh read of the head picks it up, as the [payload contract](/reference/payload)
describes.

### Values That Must Not Change

`SerializesModels` re-fetches the model on the worker, so an order renamed
before the job runs publishes under its new name. A value the fact must keep
travels in `data`:

::: code-group
```php [Fluent Syntax]
// app/Jobs/RecordOrder.php, handle()
Storyfeed::activity()
    ->by($this->customer)
    ->action('place', $this->order)
    ->to($this->order->kitchen)
    ->data(['total' => $this->total])         // captured in the constructor, not read in handle()
    ->publishedAt($this->occurredAt)
    ->publish();
```

```php [Named Arguments]
// app/Jobs/RecordOrder.php, handle()
Storyfeed::record(
    verb: 'place',
    object: $this->order,
    actor: $this->customer,
    target: $this->order->kitchen,
    data: ['total' => $this->total],          // captured in the constructor, not read in handle()
    publishedAt: $this->occurredAt,
);
```
:::

### Retries and Imports

| The Job | Do |
|---|---|
| publishes, then fails, then retries | publish last: `publish()` has no idempotency key |
| repeats a verb on the same object | `->replace()`: the newest row supersedes the earlier `(object, verb)` |
| runs an import that must not record | `Storyfeed::withoutRecording(fn () => $importer->run())` |

`stopRecording()` lasts for the rest of the process, which on a worker is
every job it runs after.

## The Actor

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use Illuminate\Contracts\Queue\ShouldQueue;
use Storyfeed\Facades\Storyfeed;

class RecordOrderPlaced implements ShouldQueue
{
    public function handle(OrderPlaced $event): void
    {
        Storyfeed::activity() // [!code focus]
            ->action('place', $event->order) // [!code focus]
            ->publish();   // names the customer who placed it // [!code focus]
    }
}
```

```php [Named Arguments]
<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use Illuminate\Contracts\Queue\ShouldQueue;
use Storyfeed\Facades\Storyfeed;

class RecordOrderPlaced implements ShouldQueue
{
    public function handle(OrderPlaced $event): void
    {
        Storyfeed::record( // [!code focus]
            verb: 'place', // [!code focus]
            object: $event->order, // [!code focus]
        );   // names the customer who placed it // [!code focus]
    }
}
```
:::

The user authenticated at dispatch travels with the job, as a morph alias and
key in Laravel's hidden [Context](https://laravel.com/docs/context), and is
applied on the worker. Jobs dispatched from that job inherit it.

It applies only when nothing else names the actor:

| Decided First | Example | The Transported User |
|---|---|---|
| an explicit actor | `->by($user)`, `->by('Nightly Import')` | ignored |
| explicit anonymity | `->anonymously()`, `->by(null)` | ignored |
| a registered resolver | `Storyfeed::as(…)`, `resolveActorUsing()`, `actor_resolver` | ignored, even when it returns null |
| nothing above | | applied, ahead of `parties.fallback` |

To opt out, before dispatching:

```php
// before the dispatch
use Illuminate\Support\Facades\Context;
use Storyfeed\Support\QueuedActor;

Context::addHidden(QueuedActor::KEY, null);
```

### Jobs With No User

A job dispatched from a console command or the scheduler has no user to carry:

| The Job Says | Actor Recorded | Batched |
|---|---|---|
| `->by('Nightly Import')` | the party *Nightly Import* | yes |
| nothing, with `'parties' => ['fallback' => 'Nightly Import']` | the party *Nightly Import* | yes |
| `->anonymously()`, whatever the fallback | none | no |
| nothing, no fallback | none | no |

See [Parties & Anonymous Actors](/deeper/parties).

## Testing a Queued Publish

Under the `sync` driver a queued listener runs inline, and `Storyfeed::fake()`
sees its publish. With `Queue::fake()` as well, nothing is recorded until the
listener runs:

```php
// tests/Feature/FeedTest.php
use Illuminate\Events\CallQueuedListener;
use Illuminate\Support\Facades\Queue;
use Storyfeed\Facades\Storyfeed;

it('records the order', function () {
    Storyfeed::fake();
    Queue::fake();

    event(new OrderPlaced($order, $customer));

    Storyfeed::assertNothingPublished();                  // the job is on the queue, unrun

    $job = Queue::pushed(CallQueuedListener::class)->first();
    app($job->class)->{$job->method}(...$job->data);      // run the listener

    Storyfeed::assertPublished('place', $order);
});
```

`Storyfeed::fake()` never dispatches `ActivityPublished`. To assert a listener
on that event was pushed, use `Queue::fake()` alone.

## Concurrent Workers

| Guaranteed | How |
|---|---|
| one batch per actor per burst | the open batch row is locked inside the publish transaction |
| one `BatchClosed` per batch | the close is a conditional update |
| a snapshot never regresses | the upsert compares `updated_at` under the row lock |
| the publish is atomic | snapshot, groupings, batch and curation commit together |

Two workers publishing into the same cluster at the moment it crosses a
grouping threshold can each miss the other's row. The group then shows as plain
rows in `summary` mode until the next publish into the cluster, or
`storyfeed:curate` (scheduled hourly), re-picks the winner. No activity is
lost. Run `storyfeed:curate` more often if that hour matters.
