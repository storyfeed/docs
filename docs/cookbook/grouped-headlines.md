# Headlines for Grouped Activities

A group that reads as one sentence, written on the lines next to the sentence
for one activity.

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::verbs([
    'placed' => ActivityType::Create,
]);

Storyfeed::grammar([
    'order.placed' => ':actor placed :object with :target',
]);

Storyfeed::aggregateGrammar([
    'repeat.placed' => ':actor placed :count orders with :target',
    'actors.placed' => ':actors placed :count orders with :target',
]);
```

<script setup>
import { who, where, orders, activity, group, scenes } from '../.vitepress/theme/samples'

const one = scenes.order

const burst = group({
  id: 'ck5b', verb: 'placed', axis: 'repeat', count: 3, glyph: 'shopping-bag',
  published_at: '2026-08-14T14:33:00.000000Z',
  headline_template: ':actor placed :count orders with :target',
  actors: [who.regular], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 1, objects: 3, targets: 1 },
})

const crowd = group({
  id: 'ck5c', verb: 'placed', axis: 'actors', count: 5, glyph: 'shopping-bag',
  published_at: '2026-08-14T14:35:00.000000Z',
  headline_template: ':actors placed :count orders with :target',
  actors: [who.regular, who.customer2, who.customer3], targets: [where.kitchen],
  distinct: { actors: 5, objects: 5, targets: 1 },
})
</script>

*A customer places an order with the kitchen.*

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($customer)
    ->action('placed', $firstOrder)
    ->to($kitchen)
    ->publish();
```

<FeedExample :items="[one]" />

*a minute later, another request*

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($customer)
    ->action('placed', $secondOrder)
    ->to($kitchen)
    ->publish();
```

*another minute later, a third request*

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($customer)
    ->action('placed', $thirdOrder)
    ->to($kitchen)
    ->publish();
```

These are three different orders, each placed once. Read with grouping:

```php
// a controller, or wherever the feed is read
$feed = Storyfeed::feed()->involving($kitchen)->live()->get();
```

With the default grouping strategy, these activities share the same actor,
verb, object type, target, and publish day, so `live()` groups them under the
`repeat` sentence:

<FeedExample :items="[burst]" />

`log()` returns individual activities. `live()` reads repeat groups and authored
composites; `summary()` can select other eligible axes. Aggregate grammar
names a group; it does not create one. The five-user example below needs
`summary()` and an eligible `actors` bucket (at least three distinct actors
under the default policy). See [Aggregation](/deeper/aggregation).

*five customers, five different orders, five requests, the same kitchen*

<FeedExample :items="[crowd]" />

Without an aggregate template, a group has no authored sentence and falls back.
The fallback is described in [Grammar](/deeper/grammar#tokens-a-group-headline-may-use).

If ordering from a different kitchen stops a `repeat` group from forming, the built-in
[`targets` axis](/deeper/aggregation#the-built-in-axes) leaves target free;
`repeat` includes its id in the key.

## One Entry per Axis the Verb Can Group on

`:count` is always the member count; the noun after it names what a member is.

| Axis | The Members Are | Sentence |
|---|---|---|
| `repeat` | one actor, one verb, one target, one kind of object | `:actor placed :count orders with :target` |
| `actors` | several actors' acts on one target | `:actors placed :count orders with :target` |
| `object` | repeated acts on one object | `:actor changed the price of :object :count times` |
| `targets` | one actor's acts across targets | `:actor asked :count questions about :targets` |

The wording above assumes one order per distinct row. If the same order can
be placed repeatedly, count “placements” instead: `:count` does not count
distinct orders.

On the `object` axis a member is one more act on one thing, so the count is of
changes or times, never of dishes.

Which tokens each axis allows in the singular is in
[Aggregation](/deeper/aggregation).

## When the Content Is the News

A group has children, but no group-level `thread` quote. Quotes and media on
individual activities remain on those children; a closed group can hide the
words or image the reader needed at a glance. Children are capped by
`grouping.children_limit` (25 by default), and `children_truncated` says when
some are omitted. The headline's count still covers the whole group.

Use `log()` for a surface where each decision or comment must remain visible.
An aggregate sentence alone cannot preserve each member's content.

## The Same Pair in a Story

Both sentences live in one class, singular first:

```php
<?php

namespace App\Stories;

class OrderWasPlaced extends Story
{
    public string|array|null $objectType = Order::class;

    public string|FeedVerb|BackedEnum|null $verb = 'placed';

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

A Story with `headline()` and no `groups()` is a singular with no plural.
Writing the two methods in the same edit is the whole practice.
