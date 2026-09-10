# Queues

A queued listener that receives frozen facts after the commit, a queued job
that records the moment the fact happened and the person who caused it, and a
list of what has been demonstrated on a real queue and what has not.

<script setup>
import { who, where, doc, activity, group } from '../.vitepress/theme/samples'

const late = [
  activity({
    id: 'qu1', verb: 'submit', glyph: 'file-check',
    published_at: '2026-08-14T12:05:00.000000Z',
    headline_template: ':actor submitted :object to :target',
    actor: who.ines, object: doc.pricingTableFinal, target: where.passwordCrackdown,
  }),
  group({
    id: 'qu2', verb: 'submit', axis: 'repeat', count: 2, glyph: 'file-check',
    published_at: '2026-08-13T12:55:00.000000Z',
    headline_template: ':actor submitted :count documents to :target',
    actors: [who.ines], targets: [where.passwordCrackdown],
    objects: [doc.annualReportV3, doc.styleTileRevA],
    distinct: { actors: 1, objects: 2, targets: 1 },
  }),
]

const dated = [
  group({
    id: 'qu3', verb: 'submit', axis: 'repeat', count: 3, glyph: 'file-check',
    published_at: '2026-08-13T12:58:00.000000Z',
    headline_template: ':actor submitted :count documents to :target',
    actors: [who.ines], targets: [where.passwordCrackdown],
    objects: [doc.annualReportV3, doc.styleTileRevA, doc.pricingTableFinal],
    distinct: { actors: 1, objects: 3, targets: 1 },
  }),
]
</script>

Storyfeed never queues anything itself. `publish()` runs inline, in one
transaction, and the queue is yours: a listener you mark `ShouldQueue`, or a
job that publishes when it runs. This page is about both sides.

::: tip
This page describes `dev-main`. Tagged releases through v0.9.0 pass Eloquent
models to `ActivityPublished`, `ActivityDeleted` and `BatchClosed`, and
dispatch them before your outermost transaction commits.
:::

## A queued listener

```php
use Illuminate\Contracts\Queue\ShouldQueue;
use Storyfeed\Events\ActivityPublished;

class BroadcastActivity implements ShouldQueue
{
    public function handle(ActivityPublished $event): void
    {
        $activity = $event->activity;        // an ActivitySnapshot: plain values, not a model

        $activity->verb;                     // 'submit'
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

| property | type | |
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

### What survives the round trip

| | on the worker |
|---|---|
| the role's alias, key and label | as they were at publish |
| the entity's snapshot `data` | as it was at publish |
| the activity after `storyfeed:trickle --prune` retired it | unchanged: the payload equals the one captured before the prune |
| the actor's model, its `$hidden` attributes, loaded relations | not carried |
| the entity's `url` and `media` | not carried: links resolve at read time, and a worker reading the feed mints them from `APP_URL` |
| the row's current state | not carried: a later `->replace()`, edit or deletion is not reflected |

A listener that needs the current state reads the feed the way a controller
does. A listener that needs the fact has it already.

### Inside a transaction

```php
DB::transaction(function () use ($document, $user) {
    $document->update(['status' => 'submitted']);

    Storyfeed::activity()
        ->by($user)
        ->action('submit', $document)
        ->to($document->project)
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

## A job that publishes

```php
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class RecordSubmission implements ShouldQueue
{
    use Dispatchable, SerializesModels;

    public Carbon $occurredAt;

    public function __construct(public Document $document, public User $user)
    {
        $this->occurredAt = now();            // the fact's time, captured where the fact happened
    }

    public function handle(): void
    {
        Storyfeed::activity()
            ->by($this->user)
            ->action('submit', $this->document)
            ->to($this->document->project)
            ->publishedAt($this->occurredAt)  // without this, the row is dated when the job ran
            ->publish();
    }
}
```

### Event time and job time

`publish()` stamps `published_at` with `now()` when nothing else was given.
In a job that is the moment the worker got to it.

*A user submits two documents at 23:52 and 23:55. A third submission at 23:58
sits in a backlog, and its job runs at 00:05. Without `publishedAt()`:*

<FeedStream :items="late" />

*The same job, with `publishedAt($this->occurredAt)`:*

<FeedStream :items="dated" />

Grouping is cut by day on `published_at`, so the late row with the default
stamp lands on the next day and does not join the group its two siblings
formed. With the captured time it joins, and the group counts three.

| `published_at` decides | keyed on |
|---|---|
| the grouping day, and so which group a row can join | `published_at`, in `app.timezone` |
| the batch an actor's row joins | `published_at`; a row arriving after its window closed opens a separate batch and never reopens a closed one |
| the row's position under a cursor | `published_at` |
| the day heading a renderer shows | `published_at` |

A backdated row can land above a cursor a client has already paged past. The
next "load more" does not reach it; a fresh read of the head does. This is the
reconciliation the [payload contract](/reference/payload) already asks of a
client.

### What `publishedAt()` does not carry

The entity's snapshot reads the model as it is when the job runs.
`SerializesModels` puts an identifier on the queue and the worker re-fetches
the row, so a document renamed between dispatch and execution publishes under
its new name, with the old time. That is the same label the feed shows for
every other activity about that document: a snapshot is one row per entity,
rewritten on every save.

A value the fact needs to keep travels in `data`:

```php
Storyfeed::activity()
    ->by($this->user)
    ->action('submit', $this->document)
    ->to($this->document->project)
    ->data(['version' => $this->version])     // captured in the constructor, not read in handle()
    ->publishedAt($this->occurredAt)
    ->publish();
```

A job that carries the model without `SerializesModels` publishes from a copy
frozen at dispatch. The snapshot upsert compares `updated_at` before it writes,
so a copy older than the current snapshot leaves the snapshot alone.

### Retries and the recording switch

| the job | do |
|---|---|
| publishes, then fails, then retries | publish last, after the step that can fail: `publish()` has no idempotency key |
| repeats a verb on the same object (a status tick, a re-sync) | `->replace()`: the newest row supersedes every earlier `(object, verb)` |
| runs an import that must not record | `Storyfeed::withoutRecording(fn () => $importer->run())`: restored when the callback returns or throws |

`stopRecording()` sets a flag on the manager for the rest of the process. In a
worker the process is every job that worker runs from then on.

## The actor

```php
class NotifyTeam implements ShouldQueue
{
    public function handle(DocumentSubmitted $event): void
    {
        Storyfeed::record('submit', object: $event->document);   // names the user who submitted
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

| decided first | example | the transported identity |
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

### Anonymous is not system

A worker with no request context at all, a job dispatched from a console
command or a schedule, records nothing unless told. The four ways of telling it
are distinct, and each was checked on a real queue:

| the job says | actor recorded | batched |
|---|---|---|
| `->by('Nightly Import')` | the party *Nightly Import* | yes |
| nothing, with `'parties' => ['fallback' => 'Nightly Import']` | the party *Nightly Import* | yes |
| `->anonymously()`, whatever the fallback | none | no |
| nothing, no fallback, no context | none | no |

A null actor means the actor is unknown. A named party means a system did it.
The fallback names the system for every publish that would otherwise be
unknown; `->anonymously()` says this one is unknown on purpose, and wins over
the fallback. See [Parties & anonymous actors](/deeper/parties).

## Testing a queued publish

Under the `sync` driver, the default in a test suite, a queued listener runs
inline and `Storyfeed::fake()` sees its publish:

```php
it('records the submission', function () {
    Storyfeed::fake();

    event(new DocumentSubmitted($document, $user));

    Storyfeed::assertPublished('submit', $document);
});
```

With `Queue::fake()` as well, nothing is recorded until the handler runs.
Queue acceptance is not evidence of a publish:

```php
it('records the submission', function () {
    Storyfeed::fake();
    Queue::fake();

    event(new DocumentSubmitted($document, $user));

    Queue::assertPushed(CallQueuedListener::class);
    Storyfeed::assertNothingPublished();                  // the job is on the queue, unrun

    $job = Queue::pushed(CallQueuedListener::class)->first();
    app($job->class)->{$job->method}(...$job->data);      // run the listener

    Storyfeed::assertPublished('submit', $document);
});
```

`Storyfeed::fake()` never dispatches `ActivityPublished`, so a test that fakes
Storyfeed cannot assert that a listener on that event was pushed. Assert that
one against the real manager with `Queue::fake()` alone.

## Two workers at once

Two workers publishing at the same moment hold, in the exercised cases:

| | how |
|---|---|
| one batch per actor per burst | the actor's open batch row is read `lockForUpdate()` inside the publish transaction |
| one `BatchClosed` per batch | the close is a conditional update on the open row; a second sweeper affects zero rows and announces nothing |
| a snapshot never regresses | the upsert compares the model's `updated_at` under the row lock before writing |
| the publish is one transaction | snapshot, groupings, batch and curation commit together, or not at all |

### A stale curation winner

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

## What has been demonstrated

Everything above marked as checked ran as real serialized jobs on the
`database` queue driver, popped and fired by Laravel's own worker code.

| demonstrated | |
|---|---|
| snapshot events survive the queue, and survive the trickle pruning their activity | database driver |
| jobs are pushed after the outermost commit; a rollback pushes nothing | database driver |
| the transported actor, its precedence, its opt-out, and no leak between two jobs on one worker | database driver, one worker process |
| a party, the fallback and `->anonymously()` stay distinct on a worker | database driver |
| the grouping day follows `published_at`, and the object's label follows the job | database driver |
| one batch per burst and one `BatchClosed` per batch across two overlapping workers | two processes, PostgreSQL 18; batches also on MariaDB 10.11 |
| the stale curation winner above | two processes, PostgreSQL 18 and MariaDB 10.11 |
| a worker renders the feed and resolves `feedMedia()` with no request | database driver |

| not demonstrated | |
|---|---|
| MySQL | no run; MariaDB's `REPEATABLE READ` behaviour above is the closest evidence |
| two first-ever publishes by one actor at the same moment | no open batch row exists yet to lock; the shared snapshot row serialized the exercised case, and a case with no shared row has not been run |
| a publish overlapping a batch close | not run |
| Redis, SQS, Horizon | the serialized payload is driver-independent, but only the database driver has been run |
| a long-lived `queue:work` daemon across many jobs | the two-job isolation check ran in one process from a CLI harness, not a separately booted daemon |
| exactly-once delivery | not a property of any queue; a retried job publishes again, as the table under retries says |
