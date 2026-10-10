# Choosing When to Publish

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
| domain event via `PublishesToFeed` | meaningful application events; create an event when the transition needs one. See [Publishing From Events](/deeper/events#publishing-from-an-event) |
| model observer | model transitions while the application has no domain event |
| action or service class | dispatching the domain event where the transition succeeds |

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
activity then uses the [default actor](/deeper/parties#setting-a-default-actor),
or has no actor.

<span id="choosing-transitions-to-record"></span>

## Using One Verb per Transition

Use a separate verb for each transition so each has its own headline and
[`keepLatest()`](/deeper/keeping-the-latest-activity#replacing-earlier-activities)
can keep its latest activity. A single `status` verb with the state in `data`
does not distinguish transitions this way.

For which transitions and other events to record, see
[Choosing Events to Record](/cookbook/choosing-what-not-to-record#choosing-events-to-record).
