# What You Can Build

What you write, and the feed it gives you, from rich activities to a week in
one glance. Each example links to the page that covers it.

<script setup>
import { scene, everything, logOf, summaryOf } from '../.vitepress/theme/world'

const content = scene.basics.activityContent
const withKeyValue = { ...content.confirmed,
  object: { ...content.confirmed.object, body: [{ $body: 'Storyfeed/Body/KeyValue', $v: 1,
    title: content.confirmed.object.label, items: [
    { key: 'Pickup', value: '12:10 pm', verbatim: false, missing: null },
    { key: 'Items', value: '1', verbatim: false, missing: null },
    { key: 'Reference', value: content.confirmed.object.id, verbatim: true, missing: null },
  ] }] } }

const paidByWebhook = logOf([scene.cookbook.actorless.paid])
const orderStory = logOf(scene.deeper.latestPerObject.timeline)
const weekly = summaryOf(everything(), 'week')
</script>

<a id="one-activity"></a>
<a id="recording-activities"></a>

<a id="adding-activity-content"></a>

<a id="activities-with-content-previews"></a>

## Showing Content Previews

An order shows its pickup details under the headline:

```php memo="app/Models/Order.php" at="toFeed()"
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

<FeedExample :items="[withKeyValue]" />

More in [Activity Content](/basics/activity-content).

<a id="actors-beyond-your-users"></a>

## Recording Services as Actors

A payment webhook tells your app an order was paid:

```php memo="app/Http/Controllers/StripeWebhookController.php" at="__invoke()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by('Stripe')
    ->action('pay', $order)
    ->publish();
```

<FeedExample :items="paidByWebhook" />

More in [Parties & Anonymous Actors](/deeper/parties).

## Filtering a Feed by Entity

An order's page lists everything that happened to it:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->involving($order)->log()->get();
```

<FeedExample :items="orderStory" />

More in [Reading Feeds](/basics/reading#filtering-by-entity-or-role).

<a id="grouping-activities"></a>

<a id="a-week-at-a-glance"></a>

## Summarizing a Week

A weekly recap shows each person's week in one row:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->summary('week')->get();
```

<FeedExample :items="weekly" days height="420" />

More in [Grouping Periods](/deeper/grouping-periods).
