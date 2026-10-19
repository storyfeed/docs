# Choosing When to Publish

## Introduction

An order is saved many times while it is being prepared: a note is added, the
table changes, a line is corrected. Only a few of those saves matter to
someone reading the feed, such as when the order was placed, confirmed or
cancelled. Publishing from every save fills the feed with near-identical rows.
Publishing from the status changes records what happened.

<script setup>
import { scene } from '../.vitepress/theme/world'
const confirmed = scene.cookbook.transitions.confirmed
</script>

Publish meaningful status changes so routine saves do not create duplicate activities.

<span id="publishing-from-domain-events"></span>
<span id="publishing-status-transitions-from-events"></span>

## Choosing a Publish Site

Publish each transition from one site, so it is recorded once:

| Call Site | Use For |
|---|---|
| domain event via `PublishesToFeed` | meaningful application events; create an event when the transition needs one. See [Publishing From Events](/recording/publishing-from-events#publishing-from-an-event) |
| model observer | model transitions while the application has no domain event |
| action or service class | dispatching the domain event where the transition succeeds |
| none: [compose it](/retrieving/composing-feeds#showing-a-record-s-progress) when read | a record's own page, from timestamps it already stores; nothing reaches other feeds |

<a id="publishing-a-status-transition"></a>

## Publishing From an Observer

Use a model observer when the application has no domain event for a
transition.

Create an observer for the model whose status changes:

```shell
php artisan make:observer OrderObserver --model=Order
```

In the observer's `updated` method, publish only the transitions the feed should show:

::: code-group
```php [Fluent Syntax] memo="app/Observers/OrderObserver.php"
<?php

namespace App\Observers;

use App\Models\Order;
use Storyfeed\Facades\Storyfeed;

class OrderObserver
{
    public function updated(Order $order): void
    {
        if (! $order->wasChanged('status')) {
            return;                                  // no status change
        }

        $verb = match ($order->status) {
            'confirmed' => 'confirm',
            'ready' => 'prepare',
            'completed' => 'complete',
            default => null,                         // drafts are not recorded
        };

        if ($verb === null) {
            return;
        }

        Storyfeed::activity()
            ->action($verb, $order)
            ->publish();
    }
}
```

```php [Named Arguments] memo="app/Observers/OrderObserver.php"
<?php

namespace App\Observers;

use App\Models\Order;
use Storyfeed\Facades\Storyfeed;

class OrderObserver
{
    public function updated(Order $order): void
    {
        if (! $order->wasChanged('status')) {
            return;                                  // no status change
        }

        $verb = match ($order->status) {
            'confirmed' => 'confirm',
            'ready' => 'prepare',
            'completed' => 'complete',
            default => null,                         // drafts are not recorded
        };

        if ($verb === null) {
            return;
        }

        Storyfeed::record(
            verb: $verb,
            object: $order,
        );
    }
}
```
:::

<span id="status-transitions"></span>

Register the observer in your service provider:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use App\Models\Order;
use App\Observers\OrderObserver;

Order::observe(OrderObserver::class);
```

Define a headline for each verb:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('confirm')
    ->headline(':actor confirmed :object');

Story::for(Order::class)->verb('prepare')
    ->headline(':actor prepared :object');

Story::for(Order::class)->verb('complete')
    ->headline(':actor completed :object');
```

Without `by()`, Storyfeed records the signed-in user as the actor:

<FeedExample :items="[confirmed]" />

A save in a console command or a scheduled task has no signed-in user. The
activity then uses the [default actor](/recording/parties-and-anonymous-actors#setting-a-default-actor),
or has no actor.

<span id="choosing-transitions-to-record"></span>

## Using One Verb per Transition

Use a separate verb for each transition so each has its own headline and
[`keepLatest()`](/shaping/keeping-the-latest-activity#replacing-earlier-activities)
can keep its latest activity. A single `status` verb with the state in `data`
does not distinguish transitions this way.

<span id="events-to-omit"></span>
<span id="skipping-publication"></span>

## Choosing Events to Record

Record what the reader of this particular feed would want to follow. The same
event can belong on an admin feed and not on a public one. For a customer feed:

| Event | Record It? | Reason |
|---|---|---|
| model created as a draft | no | it is not ready for others to act on |
| save with no status change | no | no visible change occurred |
| note text edited | no | the note's [body](/basics/activity-content#adding-entity-bodies) already displays its current text |
| background indexing, cache rebuilding, or setting a dirty flag | no | internal maintenance is not useful feed content |
| someone typing or coming online | no | the state may change within seconds |
| field-level audit record | no | keep detailed change history in an audit log |
| order placed → confirmed | yes, as `confirm` | each status transition describes an event; give each [its own verb](#using-one-verb-per-transition) |
| order confirmed → ready | yes, as `prepare` | each status transition describes an event |
| order ready → completed | yes, as `complete` | each status transition describes an event |
| question asked about a menu item | yes | the activity identifies the subject and can [quote the question](/basics/activity-content#adding-quoted-text) |
| order placed | yes | others can follow the order's progress |
| order viewed | temporarily | use the verb's [retention period](/maintenance/retention) to limit how long it remains |

To leave a draft out, return `null` from the event's `toFeedActivity()`; see
[Skipping Publication](/recording/publishing-from-events#skipping-publication).
