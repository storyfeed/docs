# Queues

A queued listener receives the facts as they were at commit time. A queued
job records the moment the fact happened and the person who caused it. When
you are done, a worker publishes the same activity a request would have.

<script setup>
import { who, where, orders, activity, group } from '../.vitepress/theme/samples'

const late = [
  activity({
    id: 'qu1', verb: 'placed', glyph: 'shopping-bag',
    published_at: '2026-08-14T12:05:00.000000Z',
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.third, target: where.kitchen,
  }),
  group({
    id: 'qu2', verb: 'placed', axis: 'repeat', count: 2, glyph: 'shopping-bag',
    published_at: '2026-08-13T12:55:00.000000Z',
    headline_template: ':actor placed :count orders with :target',
    actors: [who.regular], targets: [where.kitchen],
    objects: [orders.first, orders.second],
    distinct: { actors: 1, objects: 2, targets: 1 },
  }),
]

const dated = [
  group({
    id: 'qu3', verb: 'placed', axis: 'repeat', count: 3, glyph: 'shopping-bag',
    published_at: '2026-08-13T12:58:00.000000Z',
    headline_template: ':actor placed :count orders with :target',
    actors: [who.regular], targets: [where.kitchen],
    objects: [orders.first, orders.second, orders.third],
    distinct: { actors: 1, objects: 3, targets: 1 },
  }),
]
</script>

Storyfeed never queues anything itself. `publish()` runs inline, in one
transaction, and the queue is yours: a listener you mark `ShouldQueue`, or a
job that publishes when it runs. This page is about both sides.

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

        $activity->verb;                     // 'placed'
        $activity->object['label'];          // 'pricing-table-final.docx', as it read at publish
        $activity->published_at;             // '2026-08-13T23:58:00+00:00'
        $activity->toPayload();              // the whole snapshot as an array
    }
}
```

`ActivityPublished` and `ActivityDeleted` carry an `ActivitySnapshot`;
`BatchClosed` carries a `BatchSnapshot` whose `activities` are activity
snapshots. Both are `readonly` and hold only arrays, scalars and null, so the
job payload is the same whether the listener runs now or in an hour.

| Property | Type |  |
|---|---|---|
| `id`, `uid` | `int`, `string` | the activity's identity |
| `verb` | `string` | the verb as stored |
| `actor`, `object`, `target`, `context`, `origin`, `result`, `instrument` | `?array` | `null` when the role is empty |
| `data` | `array` | the activity's own data, detached |
| `published_at`, `deleted_at` | `?string` | ISO 8601 |
| `forceDeleted` | `bool` | true on `ActivityDeleted` for a hard delete |

Each role array has the same keys: `type` and `id` (the morph alias and key),
`label`, `component`, `data`, `content`, `mediaType` and `attributedTo`, read
from the entity's snapshot at publish.

### What Survives the Round Trip

|  | On the Worker |
|---|---|
| the role's alias, key and label | as they were at publish |
| the entity's snapshot `data` | as it was at publish |
| the activity after `storyfeed:trickle --prune` retired it | unchanged: the payload equals the one captured before the prune |
| the actor's model, its `$hidden` attributes, loaded relations | not carried |
| the entity's `url` and `media` | not carried: links resolve at read time, and a worker reading the feed mints them from `APP_URL` |
| the row's current state | not carried: a later `->replace()`, edit or deletion is not reflected |

A listener that needs the current state reads the feed the way a controller
does. A listener that needs the fact has it already.

### Inside a Transaction

```php
// where the fact happens: a controller, an action, a listener
DB::transaction(function () use ($order, $customer) {
    $order->update(['status' => 'placed']);

    Storyfeed::activity()
        ->by($user)
        ->action('placed', $order)
        ->to($order->kitchen)
        ->publish();                          // nothing reaches the queue yet

    // …a throw here rolls back the activity and pushes no job
});                                           // the listener's job is pushed here
```

The three events implement Laravel's `ShouldDispatchAfterCommit`. Inside your
transaction the job is pushed at the outermost commit; a rollback leaves no
activity row and no job. Outside any transaction the event goes out
immediately. `ShouldQueueAfterCommit` on the listener and `after_commit` on
the queue connection both stay correct and are both unnecessary for these
events.

There is no global `after_commit` setting in `config/storyfeed.php`. Each event
declares its own boundary, so the behaviour is readable from the event class.

## A Job That Publishes

```php
<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class RecordSubmission implements ShouldQueue
{
    use Dispatchable, SerializesModels;

    public Carbon $occurredAt;

    public function __construct(public Order $order, public User $customer)
    {
        $this->occurredAt = now();            // the fact's time, captured where the fact happened
    }

    public function handle(): void
    {
        Storyfeed::activity()
            ->by($this->customer)
            ->action('placed', $this->order)
            ->to($this->order->project)
            ->publishedAt($this->occurredAt)  // without this, the row is dated when the job ran
            ->publish();
    }
}
```

### Event Time and Job Time

`publish()` stamps `published_at` with `now()` when nothing else was given.
In a job that is the moment the worker got to it.

*A user places two orders at 23:52 and 23:55. A third order at 23:58
sits in a backlog, and its job runs at 00:05. Without `publishedAt()`:*

<FeedExample :items="late" />

*The same job, with `publishedAt($this->occurredAt)`:*

<FeedExample :items="dated" />

Grouping is cut by day on `published_at`, so the late row with the default
stamp lands on the next day and does not join the group its two siblings
formed. With the captured time it joins, and the group counts three.

| `published_at` Decides | Keyed on |
|---|---|
| the grouping day, and so which group a row can join | `published_at`, in `app.timezone` |
| the batch an actor's row joins | `published_at`; a row arriving after its window closed opens a separate batch and never reopens a closed one |
| the row's position under a cursor | `published_at` |
| the day heading a renderer shows | `published_at` |

A backdated row can land above a cursor a client has already paged past. The
next "load more" does not reach it; a fresh read of the head does. This is the
reconciliation the [payload contract](/reference/payload) already asks of a
client.

### What `publishedAt()` Does Not Carry

The entity's snapshot reads the model as it is when the job runs.
`SerializesModels` puts an identifier on the queue and the worker re-fetches
the row, so an order renamed between dispatch and execution publishes under
its new name, with the old time. That is the same label the feed shows for
every other activity about that order: a snapshot is one row per entity,
rewritten on every save.

A value the fact needs to keep travels in `data`:

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($this->customer)
    ->action('placed', $this->order)
    ->to($this->order->project)
    ->data(['version' => $this->version])     // captured in the constructor, not read in handle()
    ->publishedAt($this->occurredAt)
    ->publish();
```

A job that carries the model without `SerializesModels` publishes from a copy
frozen at dispatch. The snapshot upsert compares `updated_at` before it writes,
so a copy older than the current snapshot leaves the snapshot alone.

### Retries and the Recording Switch

| The Job | Do |
|---|---|
| publishes, then fails, then retries | publish last, after the step that can fail: `publish()` has no idempotency key |
| repeats a verb on the same object (a status tick, a re-sync) | `->replace()`: the newest row supersedes every earlier `(object, verb)` |
| runs an import that must not record | `Storyfeed::withoutRecording(fn () => $importer->run())`: restored when the callback returns or throws |

`stopRecording()` sets a flag on the manager for the rest of the process. In a
worker the process is every job that worker runs from then on.

## The Actor

```php
<?php

namespace App\Listeners;

class NotifyTeam implements ShouldQueue
{
    public function handle(OrderPlaced $event): void
    {
        Storyfeed::record('placed', object: $event->order);   // names the customer who placed it
    }
}
```

`Auth::user()` on a worker is null. The identity that existed when the job was
dispatched travels with it: Storyfeed writes the authenticated user's morph
alias and key into Laravel's [Context](https://laravel.com/docs/context) as the
job payload is written, hidden from normal log context, and applies the pair on
the worker. Only the alias and key travel, so the row still names the user
after the user's row is gone. A job dispatched from inside that job inherits
the same identity.

The transported identity speaks only where nothing else has an opinion:

| Decided First | Example | The Transported Identity |
|---|---|---|
| an explicit actor | `->by($user)`, `->by('Nightly Import')` | ignored |
| explicit anonymity | `->anonymously()`, `->by(null)` | ignored |
| a resolver you registered | `Storyfeed::as(…)`, `resolveActorUsing()`, `actor_resolver` in config | ignored, including when the resolver returns null |
| nothing above | | applied, ahead of `parties.fallback` |

To opt a scope out, before dispatching:

```php
use Illuminate\Support\Facades\Context;
use Storyfeed\Support\QueuedActor;

Context::addHidden(QueuedActor::KEY, null);
```

### Anonymous Versus System

A worker with no request context at all, a job dispatched from a console
command or a schedule, records nothing unless told. The four ways of telling it
are distinct, and each was checked on a real queue:

| The Job Says | Actor Recorded | Batched |
|---|---|---|
| `->by('Nightly Import')` | the party *Nightly Import* | yes |
| nothing, with `'parties' => ['fallback' => 'Nightly Import']` | the party *Nightly Import* | yes |
| `->anonymously()`, whatever the fallback | none | no |
| nothing, no fallback, no context | none | no |

A null actor means the actor is unknown. A named party means a system did it.
The fallback names the system for every publish that would otherwise be
unknown; `->anonymously()` says this one is unknown on purpose, and wins over
the fallback. See [Parties & anonymous actors](/deeper/parties).

## Testing a Queued Publish

Under the `sync` driver, the default in a test suite, a queued listener runs
inline and `Storyfeed::fake()` sees its publish:

```php
// tests/Feature/FeedTest.php
it('records the submission', function () {
    Storyfeed::fake();

    event(new OrderPlaced($order, $customer));

    Storyfeed::assertPublished('placed', $order);
});
```

With `Queue::fake()` as well, nothing is recorded until the handler runs.
Queue acceptance is not evidence of a publish:

```php
// tests/Feature/FeedTest.php
it('records the submission', function () {
    Storyfeed::fake();
    Queue::fake();

    event(new OrderPlaced($order, $customer));

    Queue::assertPushed(CallQueuedListener::class);
    Storyfeed::assertNothingPublished();                  // the job is on the queue, unrun

    $job = Queue::pushed(CallQueuedListener::class)->first();
    app($job->class)->{$job->method}(...$job->data);      // run the listener

    Storyfeed::assertPublished('placed', $order);
});
```

`Storyfeed::fake()` never dispatches `ActivityPublished`, so a test that fakes
Storyfeed cannot assert that a listener on that event was pushed. Assert that
one against the real manager with `Queue::fake()` alone.

## Two Workers at Once

Two workers publishing at the same moment hold, in the exercised cases:

|  | How |
|---|---|
| one batch per actor per burst | the actor's open batch row is read `lockForUpdate()` inside the publish transaction |
| one `BatchClosed` per batch | the close is a conditional update on the open row; a second sweeper affects zero rows and announces nothing |
| a snapshot never regresses | the upsert compares the model's `updated_at` under the row lock before writing |
| the publish is one transaction | snapshot, groupings, batch and curation commit together, or not at all |

### A Stale Curation Winner

One case is characterised and not fixed. Two workers publishing into the same
cluster at the same moment, where the cluster crosses a grouping threshold
only when both rows are counted, each decide on a read that does not include
the other's row. Both commit. Every member is stamped `repeat` where `actors`
should have won.

| | |
|---|---|
| what is wrong | the `winner` stamps; in `summary` mode three plain rows show where one group should |
| what is not wrong | no activity is lost, every grouping hash is present, and `log` reads are unaffected |
| when it happens | the moment a threshold is crossed, and only then |
| what repairs it | the next publish into the cluster re-settles it; `storyfeed:curate`, which the package schedules hourly over the last two days, re-picks the winner from the stored hashes |

Reproduced with two worker processes on PostgreSQL 18 and MariaDB 10.11. On
MariaDB any overlap inside one cluster was enough; on PostgreSQL the two
publishes serialized on a shared `feed_snapshots` row when the members had a
`Feedable` participant in common, and the stale result appeared only when they
did not. A group that is wrong for up to an hour is the cost today; a feed
that must not show it can run `storyfeed:curate` on a shorter schedule.
