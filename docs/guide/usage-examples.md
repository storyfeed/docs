# What You Can Build with Storyfeed

What you write, and the feed it gives you, from rich activities to a week in
one glance. Each example links to the page that covers it.

<script setup>
import { scene, activity, everything, logOf, liveOf, summaryOf } from '../.vitepress/theme/world'

const content = scene.basics.activityContent
const withThread = { ...content.note,
  thread: { text: content.note.object.label, by: content.note.actor.label, kind: 'note', replies: null, truncated: false } }
const withKeyValue = { ...content.confirmed,
  object: { ...content.confirmed.object, body: [{ $body: 'Storyfeed/Body/KeyValue', $v: 1,
    title: content.confirmed.object.label, items: [
    { key: 'Pickup', value: '12:10 pm', verbatim: false, missing: null },
    { key: 'Items', value: '1', verbatim: false, missing: null },
    { key: 'Reference', value: content.confirmed.object.id, verbatim: true, missing: null },
  ] }] } }
const previews = logOf([withThread, withKeyValue, content.photo, content.product,
  ...liveOf(scene.guide.usageExamples.photos)])

const actorless = logOf(Object.values(scene.cookbook.actorless))
const orderStory = logOf(scene.deeper.latestPerObject.timeline)
const live = liveOf(scene.glance)
const daily = summaryOf(scene.glance)
const weekly = summaryOf(everything(), 'week')
</script>

<a id="one-activity"></a>
<a id="recording-activities"></a>

<a id="adding-activity-content"></a>

## Activities With Content Previews

```php memo="app/Models/Order.php" at="toFeed()"
return FeedEntity::make()
    ->label("Order #{$this->reference}")
    ->body(KeyValue::make()->title("Order #{$this->reference}")->items([
        'Pickup' => $this->pickup_at->format('g:i a'),
        'Items' => $this->items->count(),
        'Reference' => KeyValue::verbatim($this->reference),
    ]));
```

<FeedExample :items="previews" />

More in [Activity Content](/basics/activity-content).

## Actors Beyond Your Users

```php memo="app/Http/Controllers/StripeWebhookController.php" at="__invoke()"
Storyfeed::activity()
    ->by(Storyfeed::party('Stripe'))
    ->action('pay', $order)
    ->publish();
```

<FeedExample :items="actorless" />

More in [Parties & Anonymous Actors](/deeper/parties).

## One Order's Story

```php memo="A controller, or wherever the feed is read"
$order->storyfeed()->log()->get();
```

<FeedExample :items="orderStory" />

More in [Latest Activity per Object](/deeper/latest-per-object).

<a id="grouping-activities"></a>

## A Home Page Feed

```php memo="A controller, or wherever the feed is read"
Storyfeed::feed()->live()->get();
```

<FeedExample :items="live" days height="360" />

More in [Reading Feeds](/basics/reading).

## A Daily Recap

```php memo="A controller, or wherever the feed is read"
Storyfeed::feed()->summary()->get();
```

<FeedExample :items="daily" days height="360" />

More in [Reading Feeds](/basics/reading).

## A Week at a Glance

```php memo="A controller, or wherever the feed is read"
Storyfeed::feed()->summary(Period::Week)->get();
```

<FeedExample :items="weekly" days height="420" />

More in [Grouping Periods](/deeper/grouping-periods).
