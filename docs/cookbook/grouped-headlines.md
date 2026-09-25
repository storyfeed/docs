# Headlines for Grouped Activities

When a feed groups several activities into one row, the row needs its own
headline: one sentence that is true of every activity in it.
[Aggregation](/deeper/aggregation#defining-group-headlines) covers the syntax
and which tokens each group may use.

<script setup>
import { scene, liveOf } from '../.vitepress/theme/world'
const [burst] = liveOf(scene.cookbook.grouped.repeat)
</script>

## Writing a Group Headline

A customer's orders with one shop group into one row. Declare its sentence
beside the single-activity headline:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->grouped(fn (GroupBuilder $group) => $group
        ->repeat(':actor placed :count orders with :target'));
```

*Three orders from one customer to the same shop, a minute apart, read with `live()`:*

<FeedExample :items="[burst]" />

<span id="choosing-group-headline-keys"></span>
<span id="choosing-headline-keys"></span>

## Choosing Where to Declare a Group Headline

Each kind of group has a name, its axis. The table shows what the activities in
each group share, and where its headline is declared. A day is the default
[grouping period](/deeper/grouping-periods).

| Groups Activities That Share | Axis | Sentence | Declared On |
|---|---|---|---|
| one actor, verb, target and object type, on one day | `repeat` | `:actor placed :count orders with :target` | the type |
| one verb and target on one day, from several actors | `actors` | `:actors ordered from :target` | the verb |
| one actor, verb and object, on one day | `object` | `:actor changed the price of :object :count times` | the type |
| one actor and verb on one day, across several targets | `targets` | `:actor asked :count questions about :targets` | the verb |

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
