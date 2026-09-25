# Queued Publishing

## Introduction

`queue()` sends an activity to a Laravel queue for publishing by a worker.
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

```php memo="app/Http/Controllers/PlaceOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PlaceOrderController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update(['status' => 'placed']);

        Storyfeed::activity()
            ->by($request->user())
            ->action('place', $order)
            ->to($order->shop)
            ->queue();

        return to_route('orders.show', $order);
    }
}
```

After the worker publishes it:

<FeedExample :items="[placed]" />

The `publish()` / `queue()` pair follows Laravel's explicit mailable queueing.
`queue()` returns no activity. It uses your configured queue connection.

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

These are Laravel's `Queueable` methods, as on a queued job, and they chain
before `queue()`. Run a worker for the connection and queue you chose:

```bash
php artisan queue:work database --queue=feed
```

The database connection needs Laravel's jobs table.

### Delays

Add `delay()` before `queue()` to choose when the job becomes available. It
takes the place of a mailable's `later()`, which the builder does not have:

```php memo="app/Http/Controllers/PlaceOrderController.php" at="__invoke()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($order->shop)
    ->delay(now()->addSeconds(10))
    ->queue();
```

The worker determines when it is handled. After publication:

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

Use this in place of the verb's existing declaration. The call site's queue
settings override the declaration. A declaration's `delay()` accepts seconds,
a positive interval string, or a `DateInterval`.

Queue settings do not queue an ordinary `publish()` call. End the builder with
`queue()` to send it to the queue.

<a id="queueing-a-story-class"></a>
<a id="queueable-stories"></a>
<a id="unique-stories"></a>
<a id="unique-and-stored-activities"></a>

## Queueing Story Classes

A Story class that implements `ShouldQueue` queues when it is published, and
may implement `ShouldBeUnique`. [Queueing Stories](/deeper/stories#queueing-stories)
shows the class. The transaction and missing-model settings below apply to it
too.

<a id="waiting-for-a-transaction"></a>

## Queues and Transactions

| Setting | Queued Publish |
|---|---|
| no explicit setting | follows the queue connection's `after_commit` setting |
| `afterCommit()` | dispatches after the transaction commits; rollback discards it |
| `beforeCommit()` | dispatches without waiting for the commit |

`afterCommit()` also works with synchronous `publish()`: the returned activity
is unsaved until commit, and is not stored if the transaction rolls back.
Outside a transaction it publishes immediately.

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

By default, the labels and other details of the activity's models are captured
when the worker publishes it. `->snapshotNow()` captures them when `queue()` is called instead.
`published_at` is always captured when `queue()` is called; an explicit
`publishedAt()` wins.

<a id="handling-missing-models"></a>

### Missing Models

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderWasPlaced;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place', OrderWasPlaced::class)
    ->deleteWhenMissingModels();
```

By default a model deleted before the worker restores it fails the job with
`ModelNotFoundException`. This declaration opts into dropping that publish
without recording an activity. Use it in place of the class binding from
[Story Classes](/deeper/stories#registering-the-story).

The builder also accepts `->deleteWhenMissingModels()`. A Story class can set
`public bool $deleteWhenMissingModels = true`; the class's setting wins over the
declaration. `snapshotNow()` does not exempt models from restoration.

<a id="carrying-the-actor-and-context"></a>
<a id="request-based-actors"></a>
<a id="scoped-actors"></a>
<a id="jobs-without-a-user"></a>
<a id="scoped-context"></a>

## Carrying Actors and Context

By default, a queued activity publishes as the user authenticated when it was
queued, and inside any `Storyfeed::actor()` or `Storyfeed::context()` scope
open at that moment. [Carrying Roles Into Queued Jobs](/deeper/activity-scopes#passing-scopes-to-queued-jobs)
covers jobs and the scopes they inherit, and
[Role Precedence](/deeper/activity-scopes#role-precedence) gives the full order.

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

The publication time determines ordering and the activity's
[grouping period](/deeper/grouping-periods). Capture any event values you need
in the job as well: model identifiers restore the worker's current model data.
Using `queue()` directly already captures publication time at dispatch.

## Testing Queued Publishing

Use `Storyfeed::fake()` and `assertQueued()` to check the queued activity
without sending a job. [Testing Queued and Event Publishing](/deeper/testing#testing-queued-and-event-publishing)
covers the queued assertions and when to use Laravel's queue fake instead.
