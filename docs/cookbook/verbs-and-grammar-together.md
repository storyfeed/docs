# Keeping Verbs and Grammar Together

A verb and its headline drift apart when they are written in different
places. Declare both in one Story class, and publish through that class.

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

The verb string is written only in the class. Publish through it:

```php
// where the fact happens: a controller, an action, a listener
OrderWasPlaced::activity($order)
    ->by($customer)
    ->to($kitchen)
    ->publish();
```

<FeedExample context :items="[scenes.order]" />

Registration is in [Story Classes](/deeper/stories).

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

`storyfeed:stories` reads recorded pairs, so it cannot find a publisher that
has never run. Its `(call site)` rows are pairs, not source locations.

`grammar.strict` throws at the publish call in `local` and `testing` when the
pair has no headline. See [Configuration](/reference/configuration).

## A Verb Nothing Publishes Any More

Rows recorded under a retired verb keep their headline only while the verb
stays registered:

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

`storyfeed:verbs --used` counts `print` as recorded while old rows remain. It
cannot tell that nothing publishes it any more.
