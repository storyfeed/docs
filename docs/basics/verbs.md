# Verbs

<script setup>
import { activity, scenes } from '../.vitepress/theme/samples'

const placed = scenes.order
const confirmed = activity({
  ...scenes.order,
  id: 'verb-confirm',
  verb: 'confirm',
  glyph: 'circle-check',
  headline_template: ':actor confirmed :object',
})
</script>

A verb is the word your app records for what happened: a plain string, or a
case of an enum.

## Using Strings

<FeedExample context :items="[placed]" />

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlaceOrderRequest;
use App\Models\Kitchen;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class OrderController extends Controller
{
    public function store(PlaceOrderRequest $request, Kitchen $kitchen): RedirectResponse
    {
        $order = $kitchen->orders()->create($request->validated());

        Storyfeed::activity()
            ->by($request->user())
            ->action('place', $order) // [!code focus]
            ->to($kitchen)
            ->publish();

        return to_route('orders.show', $order);
    }
}
```

```php [Named Arguments]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\PlaceOrderRequest;
use App\Models\Kitchen;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class OrderController extends Controller
{
    public function store(PlaceOrderRequest $request, Kitchen $kitchen): RedirectResponse
    {
        $order = $kitchen->orders()->create($request->validated());

        Storyfeed::record(
            verb: 'place', // [!code focus]
            object: $order,
            actor: $request->user(),
            target: $kitchen,
        );

        return to_route('orders.show', $order);
    }
}
```
:::

These verbs are free-form strings, and can be anything at all.

## Using Storyfeed's Verbs

Storyfeed ships common verbs as the `Storyfeed\Verb` enum.

<FeedExample context :items="[confirmed]" />

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Verb; // [!code focus]

class ConfirmOrderController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update(['confirmed_at' => now()]);

        Verb::Confirm->by($request->user()) // [!code focus]
            ->object($order)
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
use Storyfeed\Verb; // [!code focus]

class ConfirmOrderController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update(['confirmed_at' => now()]);

        Storyfeed::record(
            verb: Verb::Confirm, // [!code focus]
            object: $order,
            actor: $request->user(),
        );

        return back();
    }
}
```
:::

The stored verb is the case's value, `confirm`, so the row is the same as one
recorded with a string. [Verb Vocabulary](/reference/verbs) lists all of them.

## Using Enums

In practice, passing loose strings may lead to typos and drift as an application grows. A
common pattern is to define your verbs within an enum,

```php
<?php

namespace App\Enums;

enum OrderActivity: string
{
    case Placed = 'place';
    case Confirmed = 'confirm';
    case Ready = 'ready';
}
```

which can then be decorated with Storyfeed's `AsFeedVerb` trait and `FeedVerb` interface,

```php
<?php

namespace App\Enums;

use Storyfeed\Concerns\AsFeedVerb; // [!code focus]
use Storyfeed\Contracts\FeedVerb; // [!code focus]

enum OrderActivity: string implements FeedVerb // [!code focus]
{
    use AsFeedVerb; // [!code focus]

    case Placed = 'place';
    case Confirmed = 'confirm';
    case Ready = 'ready';
}
```

to allow fluent recording of activities using the enum:

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Enums\OrderActivity; // [!code focus]
use App\Http\Requests\PlaceOrderRequest;
use App\Models\Kitchen;
use Illuminate\Http\RedirectResponse;

class OrderController extends Controller
{
    public function store(PlaceOrderRequest $request, Kitchen $kitchen): RedirectResponse
    {
        $order = $kitchen->orders()->create($request->validated());

        OrderActivity::Placed->by($request->user()) // [!code focus]
            ->object($order)
            ->to($kitchen)
            ->publish();

        return to_route('orders.show', $order);
    }
}
```

```php [Named Arguments]
<?php

namespace App\Http\Controllers;

use App\Enums\OrderActivity; // [!code focus]
use App\Http\Requests\PlaceOrderRequest;
use App\Models\Kitchen;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class OrderController extends Controller
{
    public function store(PlaceOrderRequest $request, Kitchen $kitchen): RedirectResponse
    {
        $order = $kitchen->orders()->create($request->validated());

        Storyfeed::record(
            verb: OrderActivity::Placed, // [!code focus]
            object: $order,
            actor: $request->user(),
            target: $kitchen,
        );

        return to_route('orders.show', $order);
    }
}
```
:::