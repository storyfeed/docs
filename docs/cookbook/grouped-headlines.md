# Headlines for Grouped Activities

Grouped activities need a headline that describes every member. See
[Aggregation](/deeper/aggregation#defining-group-headlines) for the syntax and
allowed tokens.

<script setup>
import { scene, liveOf } from '../.vitepress/theme/world'
const [burst] = liveOf(scene.cookbook.grouped.repeat)
</script>

## Writing a Group Headline

A customer's orders with one shop can form a group. Define its headline
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

Three orders from one customer at the same shop, a minute apart, in live mode:

<FeedExample :items="[burst]" />

<span id="choosing-group-headline-keys"></span>
<span id="choosing-headline-keys"></span>

## Choosing Where to Declare a Group Headline

An axis defines what a group has in common. The table lists these shared
values and where to declare each headline. The default
[grouping period](/deeper/grouping-periods) is one day.

| Shared Values | Axis | Headline | Declared On |
|---|---|---|---|
| one actor, verb, target and object type, on one day | `repeat` | `:actor placed :count orders with :target` | the type |
| one verb and target on one day, from several actors | `actors` | `:actors ordered from :target` | the verb |
| one actor, verb and object, on one day | `object` | `:actor changed the price of :object :count times` | the type |
| one actor and verb on one day, across several targets | `targets` | `:actor asked :count questions about :targets` | the verb |

### Single-Type Groups

A headline declared on the type can say "orders" because every member is an order.

### Mixed-Type Groups

A headline declared on the verb may describe several object types, so avoid
naming a particular type.

`:count` counts activities, not distinct objects. If an order can be placed
twice, use "placements" to avoid overstating the number of orders.

## Keeping Individual Content Visible

Quotes and images belong to the activities within a group. To display every
comment, retrieve the feed with `log()`, which returns activities separately.
