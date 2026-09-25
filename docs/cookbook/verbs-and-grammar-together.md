# Keeping Verbs and Grammar Together

Declare each verb as a method on its model's Story class, with its headline in
the same method. Call sites name the verb, and a verb nothing declares throws
while you develop.

<script setup>
import { scenes } from '../.vitepress/theme/samples'
</script>

```php
<?php

namespace App\Stories;

use Storyfeed\Stories\Verb;

class OrderStory
{
    public function place(Verb $verb): Verb
    {
        return $verb
            ->headline(':actor placed :object with :target')
            ->icon('shopping-bag');
    }
}
```

```php
// routes/feed.php
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class);
```

Publish by the verb's name:

```php
// where the fact happens: a controller, an action, a listener
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity('place', $order)
    ->by($customer)
    ->to($kitchen)
    ->publish();
```

<FeedExample context :items="[scenes.order]" />

[Story Classes](/deeper/stories) covers the class.

## Causes of Verb Drift

| Verb Written in | Headline Written in | Drifts When |
|---|---|---|
| a call site | a grammar array | a verb is added at one and not the other |
| an enum | a grammar array | a case's value changes |
| a Story class method | the same method | a call site names a verb no method declares, which throws in `local` and `testing` |

## Checking Verb Coverage

```bash
# published pairs with no headline
php artisan storyfeed:doctor --only=grammar
# registered but never recorded, and recorded but never registered
php artisan storyfeed:verbs --used
# every verb on orders, and the method that declares it
php artisan storyfeed:list --type=order
```

In `local` and `testing`, `verbs.strict` throws when you publish a verb nothing
declares, and `grammar.strict` throws when you publish one with no headline:

```txt
Storyfeed does not recognize the verb [plcae]. Register it with
Storyfeed::verbs(['plcae' => ActivityType::Update]) or an enum implementing
FeedVerb, or disable storyfeed.verbs.strict.
```

## Unused Verbs

Old rows keep their headline only while their verb stays declared, so keep the
method:

```php
// app/Stories/OrderStory.php
// nothing publishes `print` any more; old rows still read
public function print(): string
{
    return ':actor printed :object';
}
```

## Group Headlines in the Same Method

A verb's group headline for its type belongs beside its headline:

```php
<?php

namespace App\Stories;

use Storyfeed\Stories\Verb;

class OrderStory
{
    public function place(Verb $verb): Verb
    {
        return $verb
            ->headline(':actor placed :object with :target')
            ->icon('shopping-bag')
            ->grouped(fn ($group) => $group
                ->repeat(':actor placed :count orders with :target'));
    }
}
```

Write both in the same edit, so no verb has a single headline without a group
one. A group that can hold other types, such as `actors`, takes its headline
on the verb in `routes/feed.php`, as in
[Aggregation](/deeper/aggregation#grouping-along-another-axis).
