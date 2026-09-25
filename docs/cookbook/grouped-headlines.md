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
import { scene, liveOf } from '../.vitepress/theme/world'
const one = scene.cookbook.grouped.repeat[0]
const [burst] = liveOf(scene.cookbook.grouped.repeat)
const [crowd] = liveOf(scene.cookbook.grouped.actors)
</script>

## Publishing and Reading a Group

*A customer places an order with the shop.*

::: code-group
<<< @/snippets/publish-from-controller.php {php memo="app/Http/Controllers/OrderController.php"} [Fluent Syntax]
<<< @/snippets/publish-from-controller.named-arguments.php {php memo="app/Http/Controllers/OrderController.php"} [Named Arguments]
:::

<FeedExample :items="[one]" />

*a minute later, another request*

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/OrderController.php" at="store()"
Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($shop)
    ->publish();
```

```php [Named Arguments] memo="app/Http/Controllers/OrderController.php" at="store()"
Storyfeed::record(
    verb: 'place',
    object: $order,
    actor: $request->user(),
    target: $shop,
);
```
:::

*another minute later, a third request*

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/OrderController.php" at="store()"
Storyfeed::activity()
    ->by($request->user())
    ->action('place', $order)
    ->to($shop)
    ->publish();
```

```php [Named Arguments] memo="app/Http/Controllers/OrderController.php" at="store()"
Storyfeed::record(
    verb: 'place',
    object: $order,
    actor: $request->user(),
    target: $shop,
);
```
:::

Read the feed with grouping:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

$feed = Storyfeed::feed()->involving($shop)->live()->get();
```

They share a customer, a shop and a day, so `live()` groups them under the
`repeat` headline:

<FeedExample :items="[burst]" />

A headline doesn't make a group form. The group of three customers below forms
only when the feed is read with `live()`, and only once at least three
different customers have placed the shared order. See [Aggregation](/deeper/aggregation).

*three customers, one shared order, three requests, the same shop*

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
