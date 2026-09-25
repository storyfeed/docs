# Activity Verbs

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

## Introduction

A verb is the word your app records for what happened: a plain string, or a
case of an enum.

<a id="using-strings"></a>

## Recording With Strings

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/OrderController.php"
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
            ->action('place', $order)
            ->to($kitchen)
            ->publish();

        return to_route('orders.show', $order);
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/OrderController.php"
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
            verb: 'place',
            object: $order,
            actor: $request->user(),
            target: $kitchen,
        );

        return to_route('orders.show', $order);
    }
}
```
:::

<FeedExample context :items="[placed]" />

These verbs are free-form strings, and can be anything at all.

<a id="using-your-own-enums"></a>

## Recording With Enums

### Defining a Backed Enum

A backed enum gives your application a shared vocabulary:

```php memo="app/Enums/OrderActivity.php"
<?php

namespace App\Enums;

enum OrderActivity: string
{
    case Placed = 'place';
    case Confirmed = 'confirm';
    case Ready = 'ready';
}
```

### Adding Fluent Recording

Add Storyfeed's `AsFeedVerb` trait and `FeedVerb` interface to record directly from an enum case:

```php memo="app/Enums/OrderActivity.php"
<?php

namespace App\Enums;

use Storyfeed\Concerns\AsFeedVerb;
use Storyfeed\Contracts\FeedVerb;

enum OrderActivity: string implements FeedVerb
{
    use AsFeedVerb;

    case Placed = 'place';
    case Confirmed = 'confirm';
    case Ready = 'ready';
}
```

`Storyfeed::record()` accepts the backed enum with or without the trait:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/OrderController.php"
<?php

namespace App\Http\Controllers;

use App\Enums\OrderActivity;
use App\Http\Requests\PlaceOrderRequest;
use App\Models\Kitchen;
use Illuminate\Http\RedirectResponse;

class OrderController extends Controller
{
    public function store(PlaceOrderRequest $request, Kitchen $kitchen): RedirectResponse
    {
        $order = $kitchen->orders()->create($request->validated());

        OrderActivity::Placed->by($request->user())
            ->object($order)
            ->to($kitchen)
            ->publish();

        return to_route('orders.show', $order);
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/OrderController.php"
<?php

namespace App\Http\Controllers;

use App\Enums\OrderActivity;
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
            verb: OrderActivity::Placed,
            object: $order,
            actor: $request->user(),
            target: $kitchen,
        );

        return to_route('orders.show', $order);
    }
}
```
:::


<FeedExample context :items="[placed]" />

## Using Storyfeed's Verbs

Storyfeed also ships common verbs, as the `Storyfeed\Act` enum.

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/ConfirmOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Act;

class ConfirmOrderController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update(['confirmed_at' => now()]);

        Act::Confirm->by($request->user())
            ->object($order)
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/ConfirmOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Act;
use Storyfeed\Facades\Storyfeed;

class ConfirmOrderController extends Controller
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        $order->update(['confirmed_at' => now()]);

        Storyfeed::record(
            verb: Act::Confirm,
            object: $order,
            actor: $request->user(),
        );

        return back();
    }
}
```
:::

<FeedExample context :items="[confirmed]" />

The stored verb is the case's value, `confirm`, so the row is the same as one
recorded with a string. [Verb Vocabulary](/reference/verbs) lists all of them.
