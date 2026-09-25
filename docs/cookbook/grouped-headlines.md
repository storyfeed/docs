# Headlines for Grouped Activities

When a feed groups several activities into one row, the row needs its own
headline. Declare it with `grouped()` beside the single-activity headline.

## Defining a Group Headline

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Storyfeed;

Storyfeed::verbs([
    'place' => ActivityType::Create,
]);
```

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\Group;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->grouped(Group::repeat()->headline(':actor placed :count orders with :target'));

Story::verb('place')
    ->grouped(Group::byActors()->headline(':actors ordered from :target'));
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
  headline_template: ':actors ordered from :target',
  actors: [who.regular, who.customer2, who.customer3], targets: [where.kitchen],
  distinct: { actors: 5, objects: 5, targets: 1 },
})
</script>

## Publishing and Reading a Group

*A customer places an order with the kitchen.*

::: code-group
<<< @/snippets/publish-from-controller.php {php memo="app/Http/Controllers/OrderController.php"} [Fluent Syntax]
<<< @/snippets/publish-from-controller.named-arguments.php {php memo="app/Http/Controllers/OrderController.php"} [Named Arguments]
:::

<FeedExample context :items="[one]" />

*a minute later, another request*

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/OrderController.php" at="store()"
Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($kitchen)
    ->publish();
```

```php [Named Arguments] memo="app/Http/Controllers/OrderController.php" at="store()"
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
```php [Fluent Syntax] memo="app/Http/Controllers/OrderController.php" at="store()"
Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($kitchen)
    ->publish();
```

```php [Named Arguments] memo="app/Http/Controllers/OrderController.php" at="store()"
Storyfeed::record(
    verb: 'place',
    object: $order,
    actor: $request->user(),
    target: $kitchen,
);
```
:::

Read the feed with grouping:

```php memo="A controller, or wherever the feed is read"
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
[generic one](/deeper/aggregation#group-headline-tokens).

<span id="choosing-group-headline-keys"></span>

## Choosing Headline Keys

| Axis | The Members Are | Sentence | Written On |
|---|---|---|---|
| `repeat` | one actor, one verb, one target, one kind of object | `:actor placed :count orders with :target` | the type |
| `actors` | several actors' acts on one target | `:actors ordered from :target` | the verb |
| `object` | repeated acts on one object | `:actor changed the price of :object :count times` | the type |
| `targets` | one actor's acts across targets | `:actor asked :count questions about :targets` | the verb |

### Single-Type Groups

A group on the type can say "orders", because every member is an order.

### Mixed-Type Groups

A group on the verb can gather other types into the same row, so its sentence
should describe the activity without assuming an object type.

`:count` counts activities, not different objects. If the same order can be
placed twice, write "placements", not "orders".

## Keeping Individual Content Visible

A group shows no quote or image of its own; those stay on the activities
inside it. Where every comment must stay visible, read with `log()`, which
doesn't group.

<span id="defining-group-headlines-in-a-story-class"></span>

## Defining Headlines in Story Classes

A verb's method holds its headline and the group headlines for its type:

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
            ->grouped(fn ($group) => $group
                ->repeat(':actor placed :count orders with :target'));
    }
}
```

The `actors` headline stays on the verb in `routes/feed.php`:

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::verb('place')->grouped(fn (GroupBuilder $group) => $group
    ->actors(':actors ordered from :target'));
```

In `OrderStory`, it would be an error when stories compile. Write them in the
same edit, so no verb has a single headline without a group one.
