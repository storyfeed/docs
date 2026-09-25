# Queued Publishing

`queue()` sends an activity to a Laravel queue for publishing by a worker.
`publish()` writes it in the current process.

<script setup>
import { scenes } from '../.vitepress/theme/samples'
const placed = { ...scenes.order, data: null, glyph_intent: null }
</script>

## Publishing in the Current Process

::: code-group
<<< @/snippets/place-order.php [Fluent Syntax]
<<< @/snippets/place-order.named-arguments.php [Named Arguments]
:::

<FeedExample :items="[placed]" />

`Storyfeed::record()` stays synchronous. Queueing uses the activity builder's
`queue()` terminal instead.

## Queueing an Activity

```php
// app/Http/Controllers/PlaceOrderController.php, __invoke()
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($order->kitchen)
    ->queue();
```

After the worker publishes it:

<FeedExample :items="[placed]" />

The `publish()` / `queue()` pair follows Laravel's explicit mailable queueing.
`queue()` returns no activity. It uses your configured queue connection; the
`sync` connection runs it immediately.

## Choosing a Queue and Delay

```php
// app/Http/Controllers/PlaceOrderController.php, __invoke()
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($order->kitchen)
    ->onConnection('database')
    ->onQueue('feed')
    ->delay(now()->addSeconds(10))
    ->afterCommit()
    ->queue();
```

After the transaction commits and a worker handles the job:

<FeedExample :items="[placed]" />

These are Laravel's `Queueable` methods. Run a worker for the connection and
queue you chose:

```bash
php artisan queue:work database --queue=feed
```

The database connection needs Laravel's jobs table. The delay controls when the
job becomes available; the worker determines when it is handled.

## Declaring Queue Settings on a Verb

```php
// routes/feed.php
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

## Publication Time and Snapshots

```php
// app/Http/Controllers/PlaceOrderController.php, __invoke()
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($order->kitchen)
    ->snapshotNow()
    ->queue();
```

<FeedExample :items="[placed]" />

`published_at` is captured when `queue()` is called; an explicit
`publishedAt()` wins. Entity snapshots are taken on the worker by default.
`->snapshotNow()` opts into taking the builder's entity snapshots at the call.

Story middleware runs on the worker. Actor and context scopes cross the queue
as described in [Activity Scopes](/deeper/activity-scopes).

## Waiting for a Transaction

| Setting | Queued Publish |
|---|---|
| no explicit setting | follows the queue connection's `after_commit` setting |
| `afterCommit()` | dispatches after the transaction commits; rollback discards it |
| `beforeCommit()` | dispatches without waiting for the commit |

`afterCommit()` also works with synchronous `publish()`: the returned activity
is unsaved until commit, and is not stored if the transaction rolls back.
Outside a transaction it publishes immediately.

## Queueing a Story Class

```php
<?php

namespace App\Stories;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Storyfeed\PendingActivity;
use Storyfeed\Stories\Story;

class OrderWasPlaced extends Story implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Order $order,
        public User $customer,
    ) {}

    public function toFeedActivity(): ?PendingActivity
    {
        return $this->activity($this->order)
            ->by($this->customer)
            ->to($this->order->kitchen);
    }

    public function headline(): string
    {
        // Presentation cannot read constructor data.
        return ':actor placed :object with :target';
    }

    public function icon(): ?string
    {
        return 'shopping-bag';
    }
}
```

Replace the inline declaration with the class binding:

```php
// routes/feed.php
use App\Models\Order;
use App\Stories\OrderWasPlaced;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place', OrderWasPlaced::class);
```

An authenticated controller supplies the data:

```php
// app/Http/Controllers/PlaceOrderController.php, __invoke()
use App\Stories\OrderWasPlaced;
use Storyfeed\Facades\Storyfeed;

Storyfeed::publish(
    (new OrderWasPlaced($order, $request->user()))->onQueue('feed'),
);
```

After the worker calls `toFeedActivity()` and publishes its result:

<FeedExample :items="[placed]" />

A Story implementing `ShouldQueue` queues when passed to `Storyfeed::publish()`.
The call returns `null`. `Storyfeed::publishNow()` publishes it synchronously,
as Laravel's notification `sendNow()` bypasses queueing. The base Story already
serializes model properties by their identifiers.

For queued Stories, publication time is captured at `Storyfeed::publish()`.
An explicit time set by `toFeedActivity()` takes precedence.

## Handling Missing Models

```php
// routes/feed.php
use App\Models\Order;
use App\Stories\OrderWasPlaced;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place', OrderWasPlaced::class)
    ->deleteWhenMissingModels();
```

By default a model deleted before the worker restores it fails the job with
`ModelNotFoundException`. This declaration opts into dropping that publish
without recording an activity. It replaces the preceding class binding.

The builder also accepts `->deleteWhenMissingModels()`. A Story class can set
`public bool $deleteWhenMissingModels = true`; the class's setting wins over the
declaration. `snapshotNow()` does not exempt models from restoration.

## Unique, Debounced, and Stored Activities

`ShouldBeUnique` keeps the first pending publish, `#[DebounceFor]` the last
pending publish, and `keepLatest()` the latest stored row.

A queued Story may implement `ShouldBeUnique` and define `uniqueId()`, or use
`#[DebounceFor]` and define `debounceId()`. It cannot combine both. Debouncing
uses Laravel's queue support; a Story's `DebounceFor` attribute must omit
`maxWait`.
