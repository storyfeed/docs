# Activity Verbs

<script setup>
import { scene } from '../.vitepress/theme/world'

const placed = scene.order
const confirmed = scene.basics.activityContent.confirmed
</script>

## Introduction

A verb names the action in base form, such as `place` or `email`. The object
type is stored separately, so use `place` rather than `order.place` or
`place_order`. See [Choosing a Verb](/cookbook/choosing-a-verb) for examples.
Declaring or publishing a dotted verb throws `Storyfeed\Exceptions\DottedVerb`; use a [story name](/deeper/named-stories) for dotted lookups such as `order.place`.

You may use a string or an enum case.

<a id="using-strings"></a>

For example, `->action('place', $order)` records `place`. Define its headline in
`routes/feed.php`. Use an enum to share verb values across your application.

<a id="using-your-own-enums"></a>

## Recording With Enums

### Defining a Backed Enum

Define the verb values in a backed enum:

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

### Defining Headlines for Enum Verbs

Pass the enum case to the `verb` method in `routes/feed.php`:

```php memo="routes/feed.php"
use App\Enums\OrderActivity;
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb(OrderActivity::Placed)
    ->headline(':actor placed :object with :target');
```

<FeedExample :items="[placed]" />

This defines a headline for the case's value, `place`, as `->verb('place')` does.

### Adding Fluent Recording

To publish directly from an enum case, implement the `FeedVerb` interface and
use the `AsFeedVerb` trait:

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

You may publish from the enum case. The `record` method on the `Storyfeed`
facade also accepts an enum case as its `verb` argument, without requiring the
trait:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/PlaceOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Enums\OrderActivity;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;

class PlaceOrderController
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        OrderActivity::Placed->by($request->user())
            ->object($order)
            ->to($order->shop)
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/PlaceOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Enums\OrderActivity;
use App\Models\Order;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;
use Illuminate\Http\RedirectResponse;

class PlaceOrderController
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        Storyfeed::record(
            verb: OrderActivity::Placed,
            object: $order,
            actor: $request->user(),
            target: $order->shop,
        );

        return back();
    }
}
```
:::

<FeedExample :items="[placed]" />

## Using Storyfeed's Verbs

Storyfeed provides common verbs through the `Storyfeed\Act` enum. Define a
headline for the verb before publishing:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Act;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb(Act::Confirm)
    ->headline(':actor confirmed :object');
```

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/ConfirmOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Storyfeed\Act;
use Illuminate\Http\RedirectResponse;

class ConfirmOrderController
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
        Act::Confirm->by($request->user())->object($order)->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/ConfirmOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Storyfeed\Act;
use Storyfeed\Facades\Storyfeed;
use Illuminate\Http\RedirectResponse;

class ConfirmOrderController
{
    public function __invoke(Request $request, Order $order): RedirectResponse
    {
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

<FeedExample :items="[confirmed]" />

Storyfeed records the case's value, `confirm`. See
[Verb Vocabulary](/reference/verbs) for the available verbs.
