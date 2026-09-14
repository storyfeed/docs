# Usage Examples

What the package produces, before how. Each example is a snippet and the feed
it renders. The pages that teach them are linked underneath.

<script setup>
import { who, where, orders, dishes, photos, notes, party, activity, group, scenes } from '../.vitepress/theme/samples'

const at = '2026-08-14T14:30:00.000000Z'

const burst = group({
  id: 'i2', verb: 'placed', axis: 'repeat', count: 3, glyph: 'shopping-bag',
  published_at: at,
  headline_template: ':actor placed :count orders with :target',
  actors: [who.regular], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 1, objects: 3, targets: 1 },
})

const expanded = [
  activity({ id: 'i2a', verb: 'placed', glyph: 'shopping-bag', published_at: at,
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.third, target: where.kitchen }),
  activity({ id: 'i2b', verb: 'placed', glyph: 'shopping-bag', published_at: '2026-08-14T14:29:00.000000Z',
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.second, target: where.kitchen }),
  activity({ id: 'i2c', verb: 'placed', glyph: 'shopping-bag', published_at: '2026-08-14T14:27:00.000000Z',
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.first, target: where.kitchen }),
]

const crowd = group({
  id: 'i7', verb: 'placed', axis: 'actors', count: 5, glyph: 'shopping-bag',
  published_at: '2026-08-14T14:35:00.000000Z',
  headline_template: ':actors placed :count orders with :target',
  actors: [who.regular, who.customer2, who.customer3], targets: [where.kitchen],
  distinct: { actors: 5, objects: 5, targets: 1 },
})


const paid = activity({
  id: 'i9', verb: 'paid', glyph: 'credit-card',
  published_at: '2026-08-14T14:32:00.000000Z',
  headline_template: ':actor marked :object paid',
  actor: party.service, object: orders.first,
})

const noted = activity({
  id: 'i10', verb: 'noted', glyph: 'message-circle',
  published_at: '2026-08-14T14:34:00.000000Z',
  headline_template: ':actor sent a note about :object',
  actor: who.regular, object: orders.first,
  thread: { text: notes.pickup.label, by: who.regular.label, kind: 'note', replies: null, truncated: false },
})

const photographed = activity({
  id: 'i14', verb: 'menu.photo_published', glyph: 'image',
  published_at: '2026-08-14T11:20:00.000000Z',
  headline_template: ':actor added a photo of :target',
  actor: who.cook, object: photos.curry, target: dishes.chickenCurry,
})

const photoBurst = group({
  id: 'i15', verb: 'menu.photo_published', axis: 'repeat', count: 6, glyph: 'image',
  published_at: '2026-08-14T11:30:00.000000Z',
  headline_template: ':actor added :count photos',
  actors: [who.cook],
  objects: [photos.curry, photos.kottu, photos.cutlets, photos.roti, photos.lassi],
  distinct: { actors: 1, objects: 6 },
})

const posted = activity({
  id: 'i16', verb: 'menu.dish_added', glyph: 'chef-hat',
  published_at: '2026-08-14T09:00:00.000000Z',
  headline_template: ':actor added a new dish',
  actor: who.cook,
  object: { ...dishes.chickenCurry,
    media: { icon: null, image: null,
      preview: { src: '/media/chicken-curry.svg', mediaType: 'image/svg+xml', width: 400, height: 300, alt: null },
      url: null },
    data: { $detail: 'Storyfeed/Detail/MediaObject', $v: 1,
      subject: { label: 'Chicken Curry', href: '/menu/1' },
      content: 'Slow-cooked with roasted curry powder and coconut milk. Mild, unless you ask.',
      image: 'preview', attachments: [], footnote: 'Photographed by Nancy' } },
})

const priced = activity({
  id: 'i11', verb: 'menu.price_changed', glyph: 'tag',
  published_at: '2026-08-14T09:10:00.000000Z',
  headline_template: ':actor changed the price of :object',
  actor: who.cook, object: dishes.kottu,
  data: { $detail: 'Storyfeed/Detail/Change', $v: 1, changes: {
    Price: ['$14.50', '$15.50'], 'On the menu': [false, true] } },
})



</script>

## One Activity

<<< @/snippets/publish.php

<FeedExample :items="[scenes.order]" />

## Three in a Row, One Line

The same customer orders three times in a few minutes. Nothing coordinates the
three requests.

```php
// where the order is placed: a controller, an action, a listener
Storyfeed::activity()
    ->by($customer)
    ->action('placed', $order)
    ->to($kitchen)
    ->publish();
```

<FeedExample :items="[burst]" />

Read as a plain timeline instead, the same three activities are three rows:

<FeedExample :items="expanded" />

[Reading Feeds](/basics/reading) picks the mode. [Aggregation](/deeper/aggregation)
decides the grouping.

## A Crowd, One Line

Five customers, five orders, five separate requests.

<FeedExample :items="[crowd]" />

[Aggregation](/deeper/aggregation) covers the axes and what each one may say.

## Someone Who Is Not a User

A payment provider reports an order paid, and it has no row in your database.

```php
// app/Http/Controllers/StripeWebhookController.php
Storyfeed::activity()
    ->by('Stripe')
    ->action('paid', $order)
    ->publish();
```

<FeedExample :items="[paid]" />

[Parties & Anonymous Actors](/deeper/parties).

## The Words Someone Wrote

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($customer)
    ->action('noted', $order)
    ->thread(FeedThread::make(text: $note->body, by: $customer->name, kind: 'note'))
    ->publish();
```

<FeedExample :items="[noted]" />

## The Facts Behind a Change

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($cook)
    ->action('menu.price_changed', $dish)
    ->data(Change::make([
        'Price' => ['$14.50', '$15.50'],
        'On the menu' => [false, true],
    ]))
    ->publish();
```

<FeedExample :items="[priced]" />

[What an Activity Shows](/basics/activity-content) covers the forms a row can
carry.

## A Photograph

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($cook)
    ->action('menu.photo_published', $photo)
    ->to($dish)
    ->publish();
```

<FeedExample :items="[photographed]" />

## Six Photographs, One Row

The cook uploads a set, one request each.

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($cook)
    ->action('menu.photo_published', $photo)
    ->publish();
```

<FeedExample :items="[photoBurst]" />

## A Dish, as a Post

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($cook)
    ->action('menu.dish_added', $dish)
    ->publish();
```

<FeedExample :items="[posted]" />

## And Many More

A feed can group by whoever you like, tell one history to several audiences,
bundle a burst of work into one story, publish itself from an event, keep
working when a row it names is gone, and serialize to
[Activity Streams 2.0](/deeper/activity-streams).

[The Basics](/basics/feedable-models) is the shortest way through.
