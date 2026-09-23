# Usage Examples

<script setup>
import { who, where, orders, dishes, photos, notes, party, activity, group, scenes } from '../.vitepress/theme/samples'

const at = '2026-08-14T14:30:00.000000Z'

const burst = group({
  id: 'i2', verb: 'place', axis: 'repeat', count: 3, glyph: 'shopping-bag',
  published_at: at,
  headline_template: ':actor placed :count orders with :target',
  actors: [who.regular], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 1, objects: 3, targets: 1 },
})

const expanded = [
  activity({ id: 'i2a', verb: 'place', glyph: 'shopping-bag', published_at: at,
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.third, target: where.kitchen }),
  activity({ id: 'i2b', verb: 'place', glyph: 'shopping-bag', published_at: '2026-08-14T14:29:00.000000Z',
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.second, target: where.kitchen }),
  activity({ id: 'i2c', verb: 'place', glyph: 'shopping-bag', published_at: '2026-08-14T14:27:00.000000Z',
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.first, target: where.kitchen }),
]

const crowd = group({
  id: 'i7', verb: 'place', axis: 'actors', count: 5, glyph: 'shopping-bag',
  published_at: '2026-08-14T14:35:00.000000Z',
  headline_template: ':actors ordered from :target',
  actors: [who.regular, who.customer2, who.customer3], targets: [where.kitchen],
  distinct: { actors: 5, objects: 5, targets: 1 },
})


const paid = activity({
  id: 'i9', verb: 'pay', glyph: 'credit-card',
  published_at: '2026-08-14T14:32:00.000000Z',
  headline_template: ':actor marked :object paid',
  actor: party.service, object: orders.first,
})

const noted = activity({
  id: 'i10', verb: 'note', glyph: 'message-circle',
  published_at: '2026-08-14T14:34:00.000000Z',
  headline_template: ':actor sent a note about :object',
  actor: who.regular, object: orders.first,
  thread: { text: notes.pickup.label, by: who.regular.label, kind: 'note', replies: null, truncated: false },
})

const photographed = activity({
  id: 'i14', verb: 'publish', glyph: 'image',
  published_at: '2026-08-14T11:20:00.000000Z',
  headline_template: ':actor added a photo of :target',
  actor: who.cook, object: photos.curry, target: dishes.chickenCurry,
})

const photoBurst = group({
  id: 'i15', verb: 'publish', axis: 'repeat', count: 6, glyph: 'image',
  published_at: '2026-08-14T11:30:00.000000Z',
  headline_template: ':actor added :count photos',
  actors: [who.cook],
  objects: [photos.curry, photos.kottu, photos.cutlets, photos.roti, photos.lassi],
  distinct: { actors: 1, objects: 6 },
})

const posted = activity({
  id: 'i16', verb: 'add', glyph: 'chef-hat',
  published_at: '2026-08-14T09:00:00.000000Z',
  headline_template: ':actor added a new dish',
  actor: who.cook,
  object: { ...dishes.chickenCurry,
    media: { icon: null, image: null,
      preview: { src: '/media/chicken-curry.svg', mediaType: 'image/svg+xml', width: 400, height: 300, alt: null },
      url: null },
    data: { $body: 'Storyfeed/Body/MediaObject', $v: 1,
      subject: { label: 'Chicken Curry', href: '/menu/1' },
      content: 'Slow-cooked with roasted curry powder and coconut milk. Mild, unless you ask.',
      image: 'preview', attachments: [], footnote: 'Photographed by Nancy' } },
})



</script>

## One Activity

::: code-group
<<< @/snippets/publish.php [Fluent Syntax]
<<< @/snippets/publish.named-arguments.php [Named Arguments]
:::

<FeedExample context :items="[scenes.order]" />

## Three in a Row, One Line

The same customer orders three times in a few minutes, in three requests.

::: code-group
```php [Fluent Syntax]
// where the order is placed: a controller, an action, a listener
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($customer)
    ->action('place', $order)
    ->to($kitchen)
    ->publish();
```

```php [Named Arguments]
// where the order is placed: a controller, an action, a listener
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'place',
    object: $order,
    actor: $customer,
    target: $kitchen,
);
```
:::

On the feed:

<FeedExample :items="[burst]" />

As a timeline:

<FeedExample :items="expanded" />

[Reading Feeds](/basics/reading) picks the mode. [Aggregation](/deeper/aggregation)
decides the grouping.

## A Crowd, One Line

Five customers, five orders, five separate requests.

<FeedExample :items="[crowd]" />

[Aggregation](/deeper/aggregation) covers the axes and what each one may say.

## Someone Who Is Not a User

A payment provider reports an order paid, and it has no row in your database.

::: code-group
```php [Fluent Syntax]
// app/Http/Controllers/StripeWebhookController.php
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by('Stripe')
    ->action('pay', $order)
    ->publish();
```

```php [Named Arguments]
// app/Http/Controllers/StripeWebhookController.php
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

## The Words Someone Wrote

::: code-group
```php [Fluent Syntax]
// where the fact happens: a controller, an action, a listener
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($customer)
    ->action('note', $order)
    ->thread(FeedThread::make(text: $note->body, by: $customer->name, kind: 'note'))
    ->publish();
```

```php [Named Arguments]
// where the fact happens: a controller, an action, a listener
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'note',
    object: $order,
    actor: $customer,
    thread: FeedThread::make(text: $note->body, by: $customer->name, kind: 'note'),
);
```
:::

<FeedExample :items="[noted]" />

## A Photograph

::: code-group
```php [Fluent Syntax]
// where the fact happens: a controller, an action, a listener
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($cook)
    ->action('publish', $photo)
    ->to($dish)
    ->publish();
```

```php [Named Arguments]
// where the fact happens: a controller, an action, a listener
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'publish',
    object: $photo,
    actor: $cook,
    target: $dish,
);
```
:::

<FeedExample :items="[photographed]" />

## Six Photographs, One Row

The cook uploads a set, one request each.

::: code-group
```php [Fluent Syntax]
// where the fact happens: a controller, an action, a listener
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($cook)
    ->action('publish', $photo)
    ->publish();
```

```php [Named Arguments]
// where the fact happens: a controller, an action, a listener
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'publish',
    object: $photo,
    actor: $cook,
);
```
:::

<FeedExample :items="[photoBurst]" />

## A Dish, as a Post

::: code-group
```php [Fluent Syntax]
// where the fact happens: a controller, an action, a listener
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($cook)
    ->action('add', $dish)
    ->publish();
```

```php [Named Arguments]
// where the fact happens: a controller, an action, a listener
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'add',
    object: $dish,
    actor: $cook,
);
```
:::

<FeedExample :items="[posted]" />

The card comes from the dish's own `toFeed()`, covered in
[Activity Body Content](/deeper/body).

## And Many More

A feed can group by whoever you like, tell one history to several audiences,
bundle a burst of work into one story, publish itself from an event, keep
working when a row it names is gone, and serialize to
[Activity Streams 2.0](/deeper/activity-streams).
