# Usage Examples

Record orders, quotes and photographs, and read them as individual or grouped activities.

<script setup>
import { scene, logOf, liveOf, summaryOf } from '../.vitepress/theme/world'

const expanded = logOf(scene.guide.usageExamples.repeatOrders)
const burst = liveOf(expanded)[0]
const crowd = summaryOf(scene.busyPlace)[0]
const paid = scene.basics.recording.paid
const note = scene.basics.activityContent.note
const noted = { ...note, verb: 'note', object: note.target, target: null,
  headline_template: ':actor sent a note about :object',
  thread: { text: note.object.label, by: note.actor.label, kind: 'note', replies: null, truncated: false } }
const photographed = scene.basics.activityContent.photo
const photoBurst = liveOf(scene.guide.usageExamples.photos)[0]
const posted = scene.basics.activityContent.product
</script>

## Recording Activities

<a id="one-activity"></a>

### Recording an Order

::: code-group
<<< @/snippets/publish.php {php memo="Where the order is placed: a controller, an action, a listener"} [Fluent Syntax]
<<< @/snippets/publish.named-arguments.php {php memo="Where the order is placed: a controller, an action, a listener"} [Named Arguments]
:::

<FeedExample :items="[scene.order]" />

<a id="activities-by-a-payment-provider"></a>

### Recording a Payment

A payment provider reports an order paid, and it has no row in your database.

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/StripeWebhookController.php"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by('Stripe')
    ->action('pay', $order)
    ->publish();
```

```php [Named Arguments] memo="app/Http/Controllers/StripeWebhookController.php"
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'pay',
    object: $order,
    actor: 'Stripe',
);
```
:::

<FeedExample :items="[paid]" />

[Parties & Anonymous Actors](/deeper/parties).

## Adding Activity Content

[Activity Content](/basics/activity-content) explains how quotes and entity bodies accompany a headline.

<a id="quoted-text"></a>

### Quoting Text

::: code-group
```php [Fluent Syntax] memo="Where the fact happens: a controller, an action, a listener"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedThread;

Storyfeed::activity()
    ->by($customer)
    ->action('note', $order)
    ->thread(FeedThread::make(text: $note->body, by: $customer->name, kind: 'note'))
    ->publish();
```

```php [Named Arguments] memo="Where the fact happens: a controller, an action, a listener"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedThread;

Storyfeed::record(
    verb: 'note',
    object: $order,
    actor: $customer,
    thread: FeedThread::make(text: $note->body, by: $customer->name, kind: 'note'),
);
```
:::

<FeedExample :items="[noted]" />

<a id="a-photograph"></a>

### Including a Photograph

::: code-group
```php [Fluent Syntax] memo="Where the fact happens: a controller, an action, a listener"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($staff)
    ->action('publish', $photo)
    ->to($product)
    ->publish();
```

```php [Named Arguments] memo="Where the fact happens: a controller, an action, a listener"
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'publish',
    object: $photo,
    actor: $staff,
    target: $product,
);
```
:::

<FeedExample :items="[photographed]" />

<a id="dish-content"></a>

### Including Entity Content

::: code-group
```php [Fluent Syntax] memo="Where the fact happens: a controller, an action, a listener"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($staff)
    ->action('publish', $product)
    ->to($shop)
    ->publish();
```

```php [Named Arguments] memo="Where the fact happens: a controller, an action, a listener"
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'publish',
    object: $product,
    actor: $staff,
    target: $shop,
);
```
:::

<FeedExample :items="[posted]" />

The card comes from the product's own `toFeed()`, covered in
[Activity Body Content](/deeper/body).

## Grouping Activities

### Repeated Orders

The same customer orders three times in a few minutes, in three requests.

::: code-group
```php [Fluent Syntax] memo="Where the order is placed: a controller, an action, a listener"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($customer)
    ->action('place', $order)
    ->to($shop)
    ->publish();
```

```php [Named Arguments] memo="Where the order is placed: a controller, an action, a listener"
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'place',
    object: $order,
    actor: $customer,
    target: $shop,
);
```
:::

On the feed:

<FeedExample :items="[burst]" />

As a timeline:

<FeedExample :items="expanded" />

[Reading Feeds](/basics/reading) picks the mode. [Aggregation](/deeper/aggregation)
decides the grouping.

<a id="orders-from-several-customers"></a>

### Activities From Several People

Several people check in at the same place, in separate requests.

<FeedExample :items="[crowd]" />

[Aggregation](/deeper/aggregation) covers the axes and what each one may say.

### Grouped Photographs

The photographer uploads a set to a collection, one request each.

::: code-group
```php [Fluent Syntax] memo="Where the fact happens: a controller, an action, a listener"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($photographer)
    ->action('upload', $photo)
    ->to($collection)
    ->publish();
```

```php [Named Arguments] memo="Where the fact happens: a controller, an action, a listener"
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'upload',
    object: $photo,
    actor: $photographer,
    target: $collection,
);
```
:::

<FeedExample :items="[photoBurst]" />
