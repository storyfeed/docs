# Verbs

<script setup>
import { scenes } from '../.vitepress/theme/samples'

const placed = scenes.order
</script>

A verb classifies an activity: it is the word your app uses for what happened.
Recording one takes a plain string, and an app with a growing vocabulary
eventually wants them typed.

## Using Strings

<FeedStream :items="[placed]" :grouped="false" />

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($customer)
    ->action('placed', $order) // [!code focus]
    ->to($kitchen)
    ->publish();
```

These verbs are free-form strings, and can be anything at all.

## Using Enums

In practice, passing loose strings may lead to typos and drift as an application grows. A
common pattern is to define your verbs within an enum,

```php
<?php

namespace App\Enums;

enum OrderActivity: string
{
    case Placed = 'placed';
    case Confirmed = 'confirmed';
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

    case Placed = 'placed';
    case Confirmed = 'confirmed';
    case Ready = 'ready';
}
```

to allow fluent recording of activities using the enum:

```php
// where the fact happens: a controller, an action, a listener
OrderActivity::Placed->by($customer)
    ->object($order)
    ->to($kitchen)
    ->publish();
```