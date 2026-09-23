# Headlines for Grouped Activities

When a feed groups several activities into one row, the row needs its own
headline. Write it with `aggregateGrammar()`, next to the headline for a single
activity.

```php
// app/Providers/AppServiceProvider.php, boot()
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

Three orders, each placed once. Read the feed with grouping:

```php
// a controller, or wherever the feed is read
$feed = Storyfeed::feed()->involving($kitchen)->live()->get();
```

They share an actor, verb, object type, target and day, so `live()` groups
them under the `repeat` headline:

<FeedExample :items="[burst]" />

Aggregate grammar names a group; it does not create one. The group of five
customers below needs `summary()` and at least three distinct actors under the
default policy. See [Aggregation](/deeper/aggregation).

*five customers, five different orders, five requests, the same kitchen*

<FeedExample :items="[crowd]" />

Without an aggregate template, a group falls back to a generic headline,
described in [Grammar](/deeper/grammar#tokens-a-group-headline-may-use).

`repeat` only groups orders to the same kitchen. The
[`targets` axis](/deeper/aggregation#the-built-in-axes) groups across kitchens.

## One Entry per Axis the Verb Can Group on

`:count` is always the member count; the noun after it names what a member is.

| Axis | The Members Are | Sentence |
|---|---|---|
| `repeat` | one actor, one verb, one target, one kind of object | `:actor placed :count orders with :target` |
| `actors` | several actors' acts on one target | `:actors placed :count orders with :target` |
| `object` | repeated acts on one object | `:actor changed the price of :object :count times` |
| `targets` | one actor's acts across targets | `:actor asked :count questions about :targets` |

`:count` counts activities, not distinct objects. If the same order can be
placed twice, write "placements", not "orders". On the `object` axis the count
is of times, never of dishes.

The tokens each axis allows are in [Aggregation](/deeper/aggregation).

## When the Content Is the News

A group has no quote of its own. Quotes and media stay on its children, so a
collapsed group can hide the words or image the reader needed. Children are
capped by `grouping.children_limit` (25 by default), and `children_truncated`
says when some are left out; the count still covers the whole group.

Where every comment must stay visible, read with `log()`.

## The Same Pair in a Story

A Story class holds both headlines, singular first:

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

Write `headline()` and `groups()` in the same edit, so no verb has a singular
without a plural.
