# Keeping Verbs and Grammar Together

Declare each verb as a method on its model's Story class, with its headline in
the same method. Call sites name the verb, and a verb nothing declares throws
while you develop.

<script setup>
import { scene } from '../.vitepress/theme/world'
</script>

## Defining Verbs and Headlines Together

Generate a resource Story class before adding its verb methods:

```shell
php artisan make:story OrderStory --model=Order
```

```php memo="app/Stories/OrderStory.php"
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

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class);
```

## Publishing Declared Verbs

Publish by the verb's name:

::: code-group
<<< @/snippets/publish-from-controller.php {php memo="app/Http/Controllers/OrderController.php"} [Fluent Syntax]
<<< @/snippets/publish-from-controller.named-arguments.php {php memo="app/Http/Controllers/OrderController.php"} [Named Arguments]
:::

<FeedExample :items="[scene.order]" />

<span id="causes-of-verb-drift"></span>

Keeping the verb and headline in one method makes their definition one edit.
[Story Classes](/deeper/stories) covers the supported class shapes.

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

<span id="unused-verbs"></span>

## Keeping Definitions for Stored Activities

Old rows keep their headline only while their verb stays declared, so keep the
method:

```php memo="app/Stories/OrderStory.php"
// nothing publishes `print` any more; old rows still read
public function print(): string
{
    return ':actor printed :object';
}
```

<span id="group-headlines-in-the-same-method"></span>

## Defining Group Headlines

A verb's group headline for its type belongs beside its headline:

```php memo="app/Stories/OrderStory.php"
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
