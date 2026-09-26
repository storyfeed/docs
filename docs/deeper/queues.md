# Queued Publishing

## Introduction

`queue()` sends an activity to a Laravel queue for a worker to publish.
`publish()` writes it in the current process.

<script setup>
import { scene } from '../.vitepress/theme/world'
const placed = { ...scene.order, data: null, glyph_intent: null }
</script>

Configure a [Laravel queue worker](https://laravel.com/docs/13.x/queues#running-the-queue-worker)
to process queued activities. The `sync` connection runs them immediately.

<a id="publishing-in-the-current-process"></a>

<a id="queueing-an-activity"></a>

## Queueing Activities

```php
Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($order->shop)
    ->queue();
```

After the worker publishes it:

<FeedExample :items="[placed]" />

As with Laravel mailables, call `queue()` to queue the activity explicitly.
It uses your configured queue connection and returns no activity.

`Storyfeed::record()` stays synchronous.

<a id="choosing-a-queue-and-delay"></a>

### Queue and Connection

```php memo="app/Http/Controllers/PlaceOrderController.php" at="__invoke()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($order->shop)
    ->onConnection('database')
    ->onQueue('feed')
    ->queue();
```

After a worker handles the job:

<FeedExample :items="[placed]" />

Laravel's `Queueable` methods chain before `queue()`, just as on a queued
job. Run a worker for the chosen connection and queue:

```bash
php artisan queue:work database --queue=feed
```

The database connection needs Laravel's jobs table.

### Delays

Call `delay()` before `queue()` to set when the job becomes available.
The builder uses `delay()` in place of a mailable's `later()`:

```php memo="app/Http/Controllers/PlaceOrderController.php" at="__invoke()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($order->shop)
    ->delay(now()->addSeconds(10))
    ->queue();
```

The worker determines when the job runs. After publication:

<FeedExample :items="[placed]" />

<a id="declaring-queue-settings-on-a-verb"></a>

### Per-Verb Defaults

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag')
    ->onConnection('database')
    ->onQueue('feed')
    ->delay(10)
    ->afterCommit();
```

<FeedExample :items="[placed]" />

Replace the verb's existing declaration with this one. Queue settings on the
builder override these defaults. The declaration's `delay()` accepts seconds,
a positive interval string, or a `DateInterval`.

These settings do not queue a `publish()` call. Call `queue()` to send the
activity to the queue.

<a id="queueing-a-story-class"></a>
<a id="queueable-stories"></a>
<a id="unique-stories"></a>
<a id="unique-and-stored-activities"></a>

## Queueing Story Classes

A Story class that implements `ShouldQueue` queues when published. It may also
implement `ShouldBeUnique`. See [Queueing Stories](/deeper/stories#queueing-stories)
for an example. The transaction and missing-model settings below also apply.

<a id="waiting-for-a-transaction"></a>

## Queues and Transactions

| Setting | Queued Publish |
|---|---|
| no explicit setting | follows the queue connection's `after_commit` setting |
| `afterCommit()` | dispatches after the transaction commits; rollback discards it |
| `beforeCommit()` | dispatches without waiting for the commit |

With synchronous `publish()`, `afterCommit()` leaves the returned activity
unsaved until commit. A rollback discards it. Outside a transaction, it
publishes immediately.

<a id="publication-time-and-snapshots"></a>
<a id="publication-time-and-model-snapshots"></a>

## Capturing Labels at Dispatch

```php memo="app/Http/Controllers/PlaceOrderController.php" at="__invoke()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($order->shop)
    ->snapshotNow()
    ->queue();
```

<FeedExample :items="[placed]" />

By default, the worker captures model labels and details when it publishes
the activity. Call `snapshotNow()` to capture them when `queue()` is called.
`queue()` always captures `published_at` at dispatch unless you set `publishedAt()`.

<a id="handling-missing-models"></a>

### Missing Models

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderWasPlaced;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place', OrderWasPlaced::class)
    ->deleteWhenMissingModels();
```

If a model is deleted before the worker restores it, the job fails with
`ModelNotFoundException`. This declaration discards the job without recording
an activity. Replace the class binding from
[Story Classes](/deeper/stories#registering-the-story) with this one.

You may also call `deleteWhenMissingModels()` on the builder. A Story class
can set `public bool $deleteWhenMissingModels = true`, which overrides the
declaration. Models must still be restored when you use `snapshotNow()`.

<a id="carrying-the-actor-and-context"></a>
<a id="request-based-actors"></a>
<a id="scoped-actors"></a>
<a id="jobs-without-a-user"></a>
<a id="scoped-context"></a>

## Carrying Actors and Context

By default, a queued activity uses the user authenticated when it was queued
and any `Storyfeed::actor()` or `Storyfeed::context()` scope active then.
See [Carrying Roles Into Queued Jobs](/deeper/activity-scopes#passing-scopes-to-queued-jobs)
for inherited scopes and [Role Precedence](/deeper/activity-scopes#role-precedence)
for the full order.

<a id="publishing-from-your-own-job"></a>

## Publishing From Application Jobs

Calling `publish()` inside a job records the worker's current time unless you
set `publishedAt()`. Capture the event time in the job's constructor if the
activity belongs to that earlier moment:

::: code-group
```php [Fluent Syntax] memo="app/Jobs/RecordOrder.php"
<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Storyfeed\Facades\Storyfeed;

class RecordOrder implements ShouldQueue
{
    use Dispatchable, Queueable, SerializesModels;

    public Carbon $occurredAt;

    public function __construct(public Order $order)
    {
        $this->occurredAt = now();
    }

    public function handle(): void
    {
        Storyfeed::activity('place', $this->order)
            ->to($this->order->shop)
            ->publishedAt($this->occurredAt)
            ->publish();
    }
}
```

```php [Named Arguments] memo="app/Jobs/RecordOrder.php"
<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Storyfeed\Facades\Storyfeed;

class RecordOrder implements ShouldQueue
{
    use Dispatchable, Queueable, SerializesModels;

    public Carbon $occurredAt;

    public function __construct(public Order $order)
    {
        $this->occurredAt = now();
    }

    public function handle(): void
    {
        Storyfeed::record(
            verb: 'place',
            object: $this->order,
            target: $this->order->shop,
            publishedAt: $this->occurredAt,
        );
    }
}
```
:::

<FeedExample :items="[placed]" />

Publication time determines ordering and the activity's
[grouping period](/deeper/grouping-periods). Also capture any event values the
job needs, since restored models contain the worker's current data.
Calling `queue()` directly already captures publication time at dispatch.

## Testing Queued Publishing

Use `Storyfeed::fake()` and `assertQueued()` to check the queued activity
without sending a job. [Testing Queued and Event Publishing](/deeper/testing#testing-queued-and-event-publishing)
covers the queued assertions and when to use Laravel's queue fake instead.
