# Activity Verbs

<script setup>
import { scene } from '../.vitepress/theme/world'

const placed = scene.order
const confirmed = scene.basics.activityContent.confirmed
</script>

## Introduction

A verb is the word your app records for what happened: a plain string, or a
case of an enum.

<a id="using-strings"></a>

`->action('place', $order)` records the string `place`, and `routes/feed.php`
gives it a headline. An enum defines those strings once, for the whole app.

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

### Defining Headlines for Enum Verbs

A case names its verb in `routes/feed.php` too:

```php memo="routes/feed.php"
use App\Enums\OrderActivity;
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb(OrderActivity::Placed)
    ->headline(':actor placed :object with :target');
```

<FeedExample :items="[placed]" />

The headline is for the case's value, `place`, the same as
`->verb('place')`.

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

With the trait, record straight from the case. `Storyfeed::record()` takes the
case as its `verb`, with or without the trait:

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

Storyfeed also ships common verbs, as the `Storyfeed\Act` enum. Give the verb
its headline before publishing:

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

The recorded verb is the case's value, `confirm`, so the activity is the same
as one recorded with a string. [Verb Vocabulary](/reference/verbs) lists all of them.
