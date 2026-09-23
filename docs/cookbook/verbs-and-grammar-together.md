# Keeping Verbs and Grammar Together

Write a verb and its headline in one Story class, and publish through that
class. Then the two can't get out of step.

<script setup>
import { scenes } from '../.vitepress/theme/samples'
</script>

```php
<?php

namespace App\Stories;

use App\Models\Order;
use BackedEnum;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Story;

class OrderWasPlaced extends Story
{
    public string|array|null $objectType = Order::class;

    public string|FeedVerb|BackedEnum|null $verb = 'place';

    public function headline(): string
    {
        return ':actor placed :object with :target';
    }

    public function icon(): ?string
    {
        return 'shopping-bag';
    }
}
```

Publish through the class:

```php
// where the fact happens: a controller, an action, a listener
OrderWasPlaced::activity($order)
    ->by($customer)
    ->to($kitchen)
    ->publish();
```

<FeedExample context :items="[scenes.order]" />

Register the class as shown in [Story Classes](/deeper/stories).

## Where Drift Comes from

| Verb Written in | Headline Written in | Drifts When |
|---|---|---|
| a call site | a grammar array | a verb is added at one and not the other |
| an enum | a grammar array | a case's value changes |
| a Story class | the same Story class | nothing |

## Catching It

```bash
php artisan storyfeed:doctor --only=grammar   # published pairs with no headline
php artisan storyfeed:verbs --used            # registered but never recorded, and recorded but never registered
php artisan storyfeed:stories                 # registered definitions and recorded pairs
```

In `local` and `testing`, the `grammar.strict` option throws when you publish
a verb with no headline.

## A Verb Nothing Publishes Any More

Old rows keep their headline only while their verb stays registered:

```php
<?php

namespace App\Stories;

use App\Models\Order;
use BackedEnum;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Story;

class OrderWasPrinted extends Story
{
    // Nothing publishes `print` any more. Registered so old rows keep their headline.
    public string|array|null $objectType = Order::class;

    public string|FeedVerb|BackedEnum|null $verb = 'print';

    public function headline(): string
    {
        return ':actor printed :object';
    }
}
```
