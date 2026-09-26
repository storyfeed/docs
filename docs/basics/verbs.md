# Activity Verbs

<script setup>
import { scene } from '../.vitepress/theme/world'

const placed = scene.order
const confirmed = scene.basics.activityContent.confirmed
</script>

## Introduction

A verb identifies the action recorded by an activity. You may use a string or
an enum case.

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

You may now publish from the enum case. The `record` method on the `Storyfeed`
facade also accepts an enum case as its `verb` argument, without requiring the
trait:

::: code-group
```php [Fluent Syntax]
OrderActivity::Placed->by($request->user()) // [!code highlight]
    ->object($order)
    ->to($shop)
    ->publish();
```

```php [Named Arguments]
Storyfeed::record(
    verb: OrderActivity::Placed, // [!code highlight]
    object: $order,
    actor: $request->user(),
    target: $shop,
);
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
```php [Fluent Syntax]
Act::Confirm->by($request->user()) // [!code highlight]
    ->object($order)
    ->publish();
```

```php [Named Arguments]
Storyfeed::record(
    verb: Act::Confirm, // [!code highlight]
    object: $order,
    actor: $request->user(),
);
```
:::

<FeedExample :items="[confirmed]" />

Storyfeed records the case's value, `confirm`. See
[Verb Vocabulary](/reference/verbs) for the available verbs.
