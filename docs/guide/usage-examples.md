# What You Can Build

<script setup>
import { scene, everything, logOf, liveOf } from '../.vitepress/theme/world'

const content = scene.basics.activityContent
const withKeyValue = { ...content.confirmed,
  object: { ...content.confirmed.object, body: [{ $body: 'Storyfeed/Body/KeyValue', $v: 3,
    title: content.confirmed.object.label, items: [
    { key: 'Pickup', value: '12:10 pm' },
    { key: 'Items', value: '1' },
    { key: 'Reference', value: content.confirmed.object.id, verbatim: true },
  ] }] } }

const paidByWebhook = logOf([scene.cookbook.actorless.paid])
const orderStory = logOf(scene.deeper.latestPerObject.timeline)
const live = liveOf(everything())
</script>

<a id="one-activity"></a>
<a id="recording-activities"></a>
<a id="adding-activity-content"></a>
<a id="activities-with-content-previews"></a>

## Showing Content Previews

A [KeyValue body](/basics/activity-content#text-and-labelled-values) adds the
order's labelled pickup details below its headline.

::: code-group
```php [Fluent Syntax] memo="app/Models/Order.php" at="toFeed()"
use Storyfeed\Body\KeyValue;
use Storyfeed\FeedEntity;

return FeedEntity::make()
    ->label("Order #{$this->reference}")
    ->body(
        KeyValue::make()->title("Order #{$this->reference}")->items([
            'Pickup' => $this->pickup_at->format('g:i a'),
            'Items' => $this->items->count(),
            'Reference' => KeyValue::verbatim($this->reference),
        ]),
    );
```

```php [Named Arguments] memo="app/Models/Order.php" at="toFeed()"
use Storyfeed\Body\KeyValue;
use Storyfeed\FeedEntity;

return FeedEntity::make(
    label: "Order #{$this->reference}",
    body: KeyValue::make(
        title: "Order #{$this->reference}",
        items: [
            'Pickup' => $this->pickup_at->format('g:i a'),
            'Items' => $this->items->count(),
            'Reference' => KeyValue::verbatim($this->reference),
        ],
    ),
);
```
:::

<FeedExample :items="[withKeyValue]" />

<a id="actors-beyond-your-users"></a>

## Recording Services as Actors

A [named party](/deeper/parties#declaring-parties) records a payment service as
the actor when its webhook reports that an order was paid.

::: code-group
```php [Fluent Syntax] memo="Where the payment webhook is handled: a controller or a job"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by('Stripe')
    ->action('pay', $order)
    ->publish();
```

```php [Named Arguments] memo="Where the payment webhook is handled: a controller or a job"
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'pay',
    object: $order,
    actor: 'Stripe',
);
```
:::

<FeedExample :items="paidByWebhook" />

## Filtering a Feed by Entity

An [entity filter](/basics/reading#filtering-by-entity-or-role) gathers the
activities involving one order into its own timeline.

```php memo="routes/web.php"
use App\Models\Order;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/orders/{order}/history', function (Order $order) {
    return Storyfeed::feed()->involving($order)->log()->get();
});
```

<FeedExample :items="orderStory" />

<a id="grouping-activities"></a>
<a id="a-week-at-a-glance"></a>

## Grouping Busy Activity

[Live](/basics/reading#live) combines one action per row within a burst.
See [Aggregation](/deeper/aggregation#built-in-axes) for which activities share a row.

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/activity', function () {
    return Storyfeed::feed()->live()->get();
});
```

<FeedExample :items="live" days height="420" />
