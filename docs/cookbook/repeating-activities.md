# Repeating Activities

When a verb repeats on the same object, keep every activity or call
`keepLatest()` on the verb to keep only the latest.

<script setup>
import { scene, logOf } from '../.vitepress/theme/world'
const timeline = logOf(scene.cookbook.transitions.timeline)
// keepLatest removes the earlier placement before a reader groups the rows.
const latest = timeline.filter((row, index) => timeline.findIndex((other) =>
  other.verb === row.verb && other.object.id === row.object.id) === index)
</script>

<span id="choosing-which-occurrences-to-keep"></span>
<span id="keeping-every-occurrence-or-the-latest"></span>

## Choosing a Storage Policy

Suppose an order is placed, confirmed, amended, and placed again. Choose
whether to keep every activity or the latest for each verb:

| Request | Full Timeline | Latest Activity per Verb |
|---|---|---|
| first placement | append `placed` | replace `placed` |
| confirmation | append `confirmed` | replace `confirmed` |
| placed again after an amendment | append another `placed` | replace the earlier `placed` |
| visible rows afterward | first placement, confirmation, second placement | confirmation, second placement |

### Keeping Every Occurrence

To keep the full timeline, publish the transition's verb in the controller
on each request:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/OrderTransitionController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class OrderTransitionController extends Controller
{
    // Route::post('orders/{order}/{verb}', OrderTransitionController::class)
    //     ->whereIn('verb', ['place', 'confirm'])
    public function __invoke(
        Request $request,
        Order $order,
        string $verb,
    ): RedirectResponse {
        $order->update(['status' => $verb]);

        Storyfeed::activity()
            ->by($request->user())
            ->action($verb, $order)
            ->to($verb === 'place' ? $order->shop : null)
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/OrderTransitionController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class OrderTransitionController extends Controller
{
    // Route::post('orders/{order}/{verb}', OrderTransitionController::class)
    //     ->whereIn('verb', ['place', 'confirm'])
    public function __invoke(
        Request $request,
        Order $order,
        string $verb,
    ): RedirectResponse {
        $order->update(['status' => $verb]);

        Storyfeed::record(
            verb: $verb,
            object: $order,
            actor: $request->user(),
            target: $verb === 'place' ? $order->shop : null,
        );

        return back();
    }
}
```
:::

Retrieve the order's timeline in log mode:

```php memo="app/Http/Controllers/OrderController.php" at="show()"
use Storyfeed\Facades\Storyfeed;

$timeline = Storyfeed::feed()->involving($order)->log()->get();
```

<FeedExample :items="timeline" />

### Keeping the Latest Occurrence

Call `keepLatest()` on each verb to replace its earlier activities. The
controller publishes as before; the query below retrieves the feed in live mode:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->keepLatest(); // removes earlier placements from every feed

Story::for(Order::class)->verb('confirm')
    ->headline(':actor confirmed :object')
    ->keepLatest();
```

```php memo="app/Http/Controllers/OrderController.php" at="show()"
use Storyfeed\Facades\Storyfeed;

$latest = Storyfeed::feed()->involving($order)->live()->get();
```

<FeedExample :items="latest" />

For this order, the feed keeps the latest activity for each verb.

Replaced activities disappear from every feed, including `log()`. Keep every
activity if any page needs the full timeline.

<a id="matching-activities"></a>

See [Keeping the Latest Activity](/deeper/keeping-the-latest-activity) for
matching roles and time limits.
