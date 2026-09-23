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
        DB::transaction(function () use ($request, $order) {
            $order->update(['status' => 'placed']);

            Storyfeed::activity()
                ->by($request->user())
                ->action('place', $order)
                ->to($order->kitchen)
                ->publish();                          // nothing reaches the queue yet
        });                                           // the listener's job is pushed here

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
        DB::transaction(function () use ($request, $order) {
            $order->update(['status' => 'placed']);

            Storyfeed::record(
                verb: 'place',
                object: $order,
                actor: $request->user(),
                target: $order->kitchen,
            );                                        // nothing reaches the queue yet
        });                                           // the listener's job is pushed here

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
        Storyfeed::activity()
            ->by($this->customer)
            ->action('place', $this->order)
            ->to($this->order->kitchen)
            ->publishedAt($this->occurredAt)  // without this, the row is dated when the job ran
            ->publish();
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
        Storyfeed::record(
            verb: 'place',
            object: $this->order,
            actor: $this->customer,
            target: $this->order->kitchen,
            publishedAt: $this->occurredAt,   // without this, the row is dated when the job ran
        );
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
        Storyfeed::activity()
            ->action('place', $event->order)
            ->publish();   // names the customer who placed it
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
        Storyfeed::record(
            verb: 'place',
            object: $event->order,
        );   // names the customer who placed it
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
| a `Storyfeed::as()` actor | around the dispatch, or inside the job | ignored |
| the verb's own actor | `->actor('Stripe')` in its definition | ignored |
| a registered resolver | `resolveActorUsing()`, `actor_resolver` | ignored, even when it returns null |
| nothing above | | applied, ahead of `parties.fallback` |

To opt out, before dispatching:

```php
// before the dispatch
use Illuminate\Support\Facades\Context;
use Storyfeed\Support\QueuedActor;

Context::addHidden(QueuedActor::KEY, null);   // no actor travels, a Storyfeed::as() actor included
```

### A Verb That Chooses Its Actor From the Request

A [Story class method that takes the `Request`](/deeper/stories#using-the-request)
chooses its verb's actor at each publish. On a worker there is no request, so a
job dispatched during the request carries what the method chose: a party name,
or a model as its morph alias and key, never the request itself.

```php
// app/Http/Controllers/PaymentWebhookController.php, __invoke()
use App\Jobs\ConfirmPayment;

// its confirm_payment gets the actor the request chose
ConfirmPayment::dispatch($order);
```

Every such method runs at the first dispatch in a request, once per request,
however many jobs follow. None runs when no job is dispatched, or inside
`Storyfeed::as()`, which outranks them. A method that chose no actor chooses
none on the worker either. An explicit actor in the job still wins, and an
anonymous publish stays anonymous. A method that throws at the dispatch never
fails it: the job publishes with the actor it would otherwise have had, and
the doctor names the method (`actions.carry_failed`).

### A Scoped Actor

A job dispatched inside `Storyfeed::as()` runs as that actor on the worker:

```php
<?php

namespace App\Console\Commands;

use App\Jobs\SyncMenu;
use Illuminate\Console\Command;
use Storyfeed\Facades\Storyfeed;

class SyncMenus extends Command
{
    protected $signature = 'menus:sync';

    public function handle(): void
    {
        Storyfeed::as('Nightly Import', fn () => SyncMenu::dispatch());
    }
}
```

Every activity the job publishes names the party *Nightly Import*, ahead of
the logged-in user and a registered resolver, and jobs it dispatches inherit
it. The scope ends with the job, even when the job throws. A job dispatched
with `->afterResponse()` runs after the scope has closed, so it does not carry
the actor.

### Jobs With No User

A job dispatched from a console command or the scheduler has no user to carry:

| The Job Says | Actor Recorded | Batched |
|---|---|---|
| `->by('Nightly Import')` | the party *Nightly Import* | yes |
| nothing, dispatched inside `Storyfeed::as('Nightly Import', …)` | the party *Nightly Import* | yes |
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
| one batch per actor per burst | a lock row per actor, taken inside the publish transaction |
| one `BatchClosed` per batch | the close is a conditional update |
| a snapshot never regresses | the upsert compares `updated_at` under the row lock |
| the publish is atomic | snapshot, groupings, batch and curation commit together |

Two workers publishing into the same cluster at the moment it crosses a
grouping threshold can each miss the other's row. The group then shows as plain
rows in `summary` mode until the next publish into the cluster, or
`storyfeed:curate` (scheduled hourly), re-picks the winner. No activity is
lost. Run `storyfeed:curate` more often if that hour matters.
