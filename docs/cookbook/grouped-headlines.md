# Headlines for Grouped Activities

An order can be placed more than once. A headline that calls every placement
an order overstates how many orders there are. Keep the events, and choose
wording that counts what actually happened.

<script setup>
import { scene, logOf, liveOf, VERBS } from '../.vitepress/theme/world'
const placements = logOf(scene.cookbook.transitions.timeline.filter(row => row.verb === 'place'))
const grouped = liveOf(placements, {
  ...VERBS,
  place: { ...VERBS.place, object: ':actor placed :object :count times',
    repeat: ':actor made :count order placements with :target' },
})
</script>

<a id="writing-a-group-headline"></a>

## Counting Placements of the Same Order

Suppose a customer places an order, then places it again after an amendment.
[Keep both occurrences](/cookbook/repeating-activities#keeping-every-occurrence)
so the feed can explain what happened. These are two `place` activities about
one order:

<FeedExample :items="placements" />

| What Is Counted | Value |
|---|---|
| placement activities (`count`) | 2 |
| distinct orders (`distinct.objects`) | 1 |

`:count` counts activities. It cannot turn the two placements into a distinct
order count. In this case, “placed 2 orders” would be wrong.

For names recorded in `data` rather than roles, see
[Naming Group Members From Activity Data](/cookbook/naming-group-members).

## Wording the Group Headline

Both placements share an actor, verb, object and day, so the default `object`
axis groups them. Name the shared order and count how many times it was placed.
For a `repeat` group across orders, call the events “order placements”:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->grouped(
        fn (GroupBuilder $group): GroupBuilder => $group
            ->object(':actor placed :object :count times')
            ->repeat(':actor made :count order placements with :target'),
    );
```

The same two activities now have a headline that describes their group:

<FeedExample :items="grouped" />

<span id="choosing-group-headline-keys"></span>
<span id="choosing-headline-keys"></span>
<a id="choosing-where-to-declare-a-group-headline"></a>
<a id="single-type-groups"></a>
<a id="mixed-type-groups"></a>

For the declaration table, type and verb scope, and allowed tokens, see
[Defining Group Headlines](/deeper/aggregation#defining-group-headlines).

## Keeping Individual Content Visible

A group headline describes the events together; it does not replace their
individual content. Quotes, images and other bodies remain on the member
activities. To show every placement as its own row, retrieve the order's
placements in log mode:

```php memo="routes/web.php"
use App\Models\Order;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/orders/{order}/placements', function (Order $order) {
    return Storyfeed::feed()
        ->involving($order)
        ->only(['place'])
        ->log()
        ->get();
});
```

<FeedExample :items="placements" />

This query returns one item per placement. Each placement remains a separate
row. Render each item's body beside its headline.
