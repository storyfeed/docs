# Repeating Activities

When the same verb happens to the same object again, you can keep every
occurrence as its own row, or declare `->keepLatest()` on the verb to keep its latest row.

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

The order is placed, confirmed, amended, and placed again. Choose one storage policy for those verbs:

| Request | Full Timeline | Latest Row per Verb |
|---|---|---|
| first placement | append `placed` | replace `placed` |
| confirmation | append `confirmed` | replace `confirmed` |
| placed again after an amendment | append another `placed` | replace the earlier `placed` |
| visible rows afterward | first placement, confirmation, second placement | confirmation, second placement |

### Keeping Every Occurrence

For the full timeline, each transition request runs this with its verb:

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

The order's page reads the timeline:

```php memo="app/Http/Controllers/OrderController.php" at="show()"
use Storyfeed\Facades\Storyfeed;

$timeline = Storyfeed::feed()->involving($order)->log()->get();
```

<FeedExample :items="timeline" />

### Keeping the Latest Occurrence

To keep only the latest occurrence of each verb, declare that policy. The
controller publishes the same way:

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

The feed keeps one row per verb, not one row per order.

Replaced rows are gone from every feed, including `log()`. If a page needs the
full timeline, don't replace.

<a id="matching-activities"></a>

[Keeping the Latest Activity](/deeper/keeping-the-latest-activity) covers
which roles make two activities match, and limiting the match to a time window.
