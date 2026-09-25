# Repeating Activities

When the same verb happens to the same object again, you can keep every
occurrence as its own row, or declare `->keepLatest()` on the verb to keep its latest row.

<script setup>
import { who, orders, dishes, activity } from '../.vitepress/theme/samples'

const on = (id, verb, glyph, at, actor, object, template) => activity({ id, verb, glyph,
  published_at: at, headline_template: template, actor, object })

const pricedTwice = [
  on('rp1', 'reprice', 'tag', '2026-08-14T14:32:00.000000Z', who.cook, dishes.kottu, ':actor changed the price of :object'),
  on('rp2', 'add', 'chef-hat', '2026-08-14T14:20:00.000000Z', who.cook, dishes.kottu, ':actor added a new dish, :object'),
]

const timeline = [
  on('rp3', 'place', 'shopping-bag', '2026-08-14T14:40:00.000000Z', who.regular, orders.first, ':actor placed :object'),
  on('rp4', 'confirm', 'circle-check', '2026-08-14T14:30:00.000000Z', who.cook, orders.first, ':actor confirmed :object'),
  on('rp5', 'place', 'shopping-bag', '2026-08-14T14:20:00.000000Z', who.regular, orders.first, ':actor placed :object'),
]

const pulse = [timeline[0], timeline[1]]
</script>

## Recording Repeated Occurrences

*A cook adds a dish:*

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMenuItemRequest;
use App\Models\Kitchen;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class MenuItemController extends Controller
{
    public function store(
        StoreMenuItemRequest $request,
        Kitchen $kitchen,
    ): RedirectResponse {
        $dish = $kitchen->menuItems()->create($request->validated());

        Storyfeed::activity() // every new dish is its own row
            ->by($request->user())
            ->action('add', $dish)
            ->publish();

        return to_route('menu-items.edit', $dish);
    }
}
```

```php [Named Arguments]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMenuItemRequest;
use App\Models\Kitchen;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class MenuItemController extends Controller
{
    public function store(
        StoreMenuItemRequest $request,
        Kitchen $kitchen,
    ): RedirectResponse {
        $dish = $kitchen->menuItems()->create($request->validated());

        Storyfeed::record( // every new dish is its own row
            verb: 'add',
            object: $dish,
            actor: $request->user(),
        );

        return to_route('menu-items.edit', $dish);
    }
}
```
:::

Declare which price changes to keep:

```php
// routes/feed.php
use App\Models\MenuItem;
use Storyfeed\Facades\Story;

Story::for(MenuItem::class)->verb('reprice')
    ->headline(':actor changed the price of :object')
    ->keepLatest(); // superseded rows leave every feed, including log()
```

*Later, in another request, they change its price:*

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePriceRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class MenuItemPriceController extends Controller
{
    public function update(
        UpdatePriceRequest $request,
        MenuItem $dish,
    ): RedirectResponse {
        $dish->update(['price' => $request->integer('price')]);

        Storyfeed::activity() // replaces the earlier price change
            ->by($request->user())
            ->action('reprice', $dish)
            ->publish();

        return back();
    }
}
```

```php [Named Arguments]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePriceRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class MenuItemPriceController extends Controller
{
    public function update(
        UpdatePriceRequest $request,
        MenuItem $dish,
    ): RedirectResponse {
        $dish->update(['price' => $request->integer('price')]);

        Storyfeed::record( // replaces the earlier price change
            verb: 'reprice',
            object: $dish,
            actor: $request->user(),
        );

        return back();
    }
}
```
:::

After one new dish and two price changes:

<FeedExample context :items="pricedTwice" />

<span id="choosing-which-occurrences-to-keep"></span>

## Choosing a Storage Policy

| Decision | Question | Consequence |
|---|---|---|
| occurrence | is this a retry of the same fact, or a new act? | an order placed again after an amendment is a new occurrence |
| retention | does this feed need every occurrence? | append for a full timeline; replace only when earlier ones may leave the feed |

[Keeping the Latest Activity](/deeper/keeping-the-latest-activity) covers
publication order and how superseded activities are removed.

<span id="keeping-every-occurrence-or-the-latest"></span>

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
```php [Fluent Syntax]
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
            ->publish();

        return back();
    }
}
```

```php [Named Arguments]
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
        );

        return back();
    }
}
```
:::

The order's page reads the timeline:

```php
// app/Http/Controllers/OrderController.php, show()
use Storyfeed\Facades\Storyfeed;

$timeline = Storyfeed::feed()->involving($order)->log()->get();
```

<FeedExample :items="timeline" />

### Keeping the Latest Occurrence

To keep only the latest occurrence of each verb, declare that policy. The
controller publishes the same way:

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object')
    ->keepLatest(); // removes earlier placements from every feed

Story::for(Order::class)->verb('confirm')
    ->headline(':actor confirmed :object')
    ->keepLatest();
```

```php
// app/Http/Controllers/OrderController.php, show()
use Storyfeed\Facades\Storyfeed;

$pulse = Storyfeed::feed()->involving($order)->live()->get();
```

<FeedExample :items="pulse" />

The pulse keeps one row per verb, not one row per order.

Replaced rows are gone from every feed, including `log()`. If a page needs the
full timeline, don't replace.

## Matching Activities

By default, `keepLatest()` matches the object and verb. The actor, target,
context and `data` do not count.

### Matching Roles

Use `per:` to choose the roles that identify a repeated occurrence:

```php
// routes/feed.php
use App\Models\MenuItem;
use Storyfeed\Facades\Story;

Story::for(MenuItem::class)->verb('reprice')
    ->headline(':actor changed the price of :object')
    ->keepLatest(per: ['object', 'actor']);
```

A missing role in the key leaves the activity separate. Authored composites
recorded with `objects()` are not superseded.

Superseded rows are soft-deleted. To delete them outright, set
[`keep_latest.delete`](/reference/configuration) to `'force'`.

### Limiting the Window

Add `within:` when only nearby repetitions should replace one another:

```php
// routes/feed.php
use App\Models\MenuItem;
use Storyfeed\Facades\Story;

Story::for(MenuItem::class)->verb('reprice')
    ->headline(':actor changed the price of :object')
    ->keepLatest(per: ['object', 'actor'], within: '10 minutes');
```
