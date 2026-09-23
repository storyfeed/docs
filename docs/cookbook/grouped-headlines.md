# Headlines for Grouped Activities

When a feed groups several activities into one row, the row needs its own
headline. Write it with `aggregateGrammar()`, next to the headline for a single
activity.

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;

Storyfeed::verbs([
    'place' => ActivityType::Create,
]);

Storyfeed::grammar([
    'order.place' => ':actor placed :object with :target',
]);

Storyfeed::aggregateGrammar([
    'repeat.place' => ':actor placed :count orders with :target',
    'actors.place' => ':actors placed :count orders with :target',
]);
```

<script setup>
import { who, where, orders, activity, group, scenes } from '../.vitepress/theme/samples'

const one = scenes.order

const burst = group({
  id: 'ck5b', verb: 'place', axis: 'repeat', count: 3, glyph: 'shopping-bag',
  published_at: '2026-08-14T14:33:00.000000Z',
  headline_template: ':actor placed :count orders with :target',
  actors: [who.regular], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 1, objects: 3, targets: 1 },
})

const crowd = group({
  id: 'ck5c', verb: 'place', axis: 'actors', count: 5, glyph: 'shopping-bag',
  published_at: '2026-08-14T14:35:00.000000Z',
  headline_template: ':actors placed :count orders with :target',
  actors: [who.regular, who.customer2, who.customer3], targets: [where.kitchen],
  distinct: { actors: 5, objects: 5, targets: 1 },
})
</script>

*A customer places an order with the kitchen.*

::: code-group
<<< @/snippets/publish-from-controller.php [Fluent Syntax]
<<< @/snippets/publish-from-controller.named-arguments.php [Named Arguments]
:::

<FeedExample context :items="[one]" />

*a minute later, another request*

::: code-group
```php [Fluent Syntax]
// app/Http/Controllers/OrderController.php, store()
Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($kitchen)
    ->publish();
```

```php [Named Arguments]
// app/Http/Controllers/OrderController.php, store()
Storyfeed::record(
    verb: 'place',
    object: $order,
    actor: $request->user(),
    target: $kitchen,
);
```
:::

*another minute later, a third request*

::: code-group
```php [Fluent Syntax]
// app/Http/Controllers/OrderController.php, store()
Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($kitchen)
    ->publish();
```

```php [Named Arguments]
// app/Http/Controllers/OrderController.php, store()
Storyfeed::record(
    verb: 'place',
    object: $order,
    actor: $request->user(),
    target: $kitchen,
);
```
:::

Read the feed with grouping:

```php
// a controller, or wherever the feed is read
use Storyfeed\Facades\Storyfeed;

$feed = Storyfeed::feed()->involving($kitchen)->live()->get();
```

They share a customer, a kitchen and a day, so `live()` groups them under the
`repeat` headline:

<FeedExample :items="[burst]" />

A headline doesn't make a group form. The group of five customers below forms
only when the feed is read with `summary()`, and only once at least three
different customers have ordered. See [Aggregation](/deeper/aggregation).

*five customers, five different orders, five requests, the same kitchen*

<FeedExample :items="[crowd]" />

A group with no headline of its own gets a
[generic one](/deeper/grammar#tokens-a-group-headline-may-use).

## One Entry per Axis the Verb Can Group on

| Axis | The Members Are | Sentence |
|---|---|---|
| `repeat` | one actor, one verb, one target, one kind of object | `:actor placed :count orders with :target` |
| `actors` | several actors' acts on one target | `:actors placed :count orders with :target` |
| `object` | repeated acts on one object | `:actor changed the price of :object :count times` |
| `targets` | one actor's acts across targets | `:actor asked :count questions about :targets` |

`:count` counts activities, not different objects. If the same order can be
placed twice, write "placements", not "orders".

## When the Content Is the News

A group shows no quote or image of its own; those stay on the activities
inside it. Where every comment must stay visible, read with `log()`, which
doesn't group.

## The Same Pair in a Story

A Story class holds both headlines:

```php
<?php

namespace App\Stories;

use App\Models\Order;
use BackedEnum;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Grouping\Group;
use Storyfeed\Story;

class OrderWasPlaced extends Story
{
    public string|array|null $objectType = Order::class;

    public string|FeedVerb|BackedEnum|null $verb = 'place';

    public function headline(): string
    {
        return ':actor placed :object with :target';
    }

    public function groups(): array
    {
        return [
            Group::repeat()->headline(':actor placed :count orders with :target'),
            Group::byActors()->headline(':actors placed :count orders with :target'),
        ];
    }
}
```

Write both in the same edit, so no verb has a single headline without a group
one.
