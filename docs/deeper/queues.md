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

Story middleware runs on the worker.

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

A Story's `middleware()` declares story middleware; Queueable's `through()`
and `$middleware` configure job middleware.

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

## Carrying the Actor and Context

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

### Request-Based Actors

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

### Scoped Actors

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

Activities without an explicit actor or explicit anonymity name the party
*Nightly Import*, ahead of the logged-in user and a registered resolver. Jobs
it dispatches inherit that scope. The scope ends with the job, even when the job throws. A job dispatched
with `->afterResponse()` runs after the scope has closed, so it does not carry
the actor.

### Jobs Without a User

A job dispatched from a console command or the scheduler has no user to carry.
With no verb actor, custom resolver or other actor-setting middleware:

| The Job Says | Actor Recorded | Batched |
|---|---|---|
| `->by('Nightly Import')` | the party *Nightly Import* | yes |
| nothing, dispatched inside `Storyfeed::as('Nightly Import', …)` | the party *Nightly Import* | yes |
| nothing, with `'parties' => ['fallback' => 'Nightly Import']` | the party *Nightly Import* | yes |
| `->anonymously()`, whatever the fallback | none | no |
| nothing, no fallback | none | no |

See [Parties & Anonymous Actors](/deeper/parties).

### Scoped Context

Jobs dispatched inside `Storyfeed::context($model, $callback)` carry that
context's identity to the worker. An explicit context on an activity wins;
otherwise the job inherits the scope. Jobs it dispatches inherit the context,
and the worker restores its previous scope after each job, including failures.
See [Activity Scopes](/deeper/activity-scopes) for callback and route examples.

## Publishing From Your Own Job

Calling `publish()` inside a job records the worker's current time unless you
set `publishedAt()`. Capture the event time in the job's constructor if the
activity belongs to that earlier moment:

```php
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
            ->to($this->order->kitchen)
            ->publishedAt($this->occurredAt)
            ->publish();
    }
}
```

The publication time determines ordering and the activity's
[grouping period](/deeper/grouping-periods). Capture any event values you need
in the job as well: model identifiers restore the worker's current model data.
Using `queue()` directly already captures publication time at dispatch.

## Listening After Publication

A listener for `ActivityPublished` can implement `ShouldQueue`. Storyfeed's
[events](/deeper/events) carry immutable publication snapshots and dispatch
after the database transaction commits. `Storyfeed::fake()` does not dispatch
these events; use `Queue::fake()` alone when asserting that a listener was queued.
