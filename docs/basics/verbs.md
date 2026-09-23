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

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($customer)
    ->action('place', $order) // [!code focus]
    ->to($kitchen)
    ->publish();
```

These verbs are free-form strings, and can be anything at all.

## Using Storyfeed's Verbs

Storyfeed ships common verbs as the `Storyfeed\Verb` enum.

<FeedExample context :items="[confirmed]" />

```php
// where the fact happens: a controller, an action, a listener
use Storyfeed\Verb; // [!code focus]

Verb::Confirm->by($cook) // [!code focus]
    ->object($order)
    ->publish();
```

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

```php
// where the fact happens: a controller, an action, a listener
OrderActivity::Placed->by($customer)
    ->object($order)
    ->to($kitchen)
    ->publish();
```