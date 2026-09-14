# Usage Examples

What the package produces, before how. Each example is a snippet and the feed
it renders. The pages that teach them are linked underneath.

<script setup>
import { who, where, orders, dishes, notes, party, activity, group, scenes } from '../.vitepress/theme/samples'

const at = '2026-08-14T14:30:00.000000Z'

const burst = group({
  id: 'i2', verb: 'order.placed', axis: 'repeat', count: 3, glyph: 'shopping-bag',
  published_at: at,
  headline_template: ':actor placed :count orders with :target',
  actors: [who.regular], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 1, objects: 3, targets: 1 },
})

const expanded = [
  activity({ id: 'i2a', verb: 'order.placed', glyph: 'shopping-bag', published_at: at,
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.third, target: where.kitchen }),
  activity({ id: 'i2b', verb: 'order.placed', glyph: 'shopping-bag', published_at: '2026-08-14T14:29:00.000000Z',
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.second, target: where.kitchen }),
  activity({ id: 'i2c', verb: 'order.placed', glyph: 'shopping-bag', published_at: '2026-08-14T14:27:00.000000Z',
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.first, target: where.kitchen }),
]

const crowd = group({
  id: 'i7', verb: 'order.placed', axis: 'actors', count: 5, glyph: 'shopping-bag',
  published_at: '2026-08-14T14:35:00.000000Z',
  headline_template: ':actors placed :count orders with :target',
  actors: [who.regular, who.customer2, who.customer3], targets: [where.kitchen],
  distinct: { actors: 5, objects: 5, targets: 1 },
})

const menu = group({
  id: 'i8', verb: 'menu.dish_live', axis: 'composite', count: 2, glyph: 'chef-hat',
  published_at: '2026-08-14T09:20:00.000000Z',
  headline_template: ':actor put :count dishes on the menu',
  actors: [who.cook], objects: [dishes.cutlets, dishes.roti],
  distinct: { actors: 1, objects: 2 },
})

const paid = activity({
  id: 'i9', verb: 'payment.received', glyph: 'credit-card',
  published_at: '2026-08-14T14:32:00.000000Z',
  headline_template: ':actor marked :object paid',
  actor: party.service, object: orders.first,
})

const noted = activity({
  id: 'i10', verb: 'order.noted', glyph: 'message-circle',
  published_at: '2026-08-14T14:34:00.000000Z',
  headline_template: ':actor sent a note about :object',
  actor: who.regular, object: orders.first,
  thread: { text: notes.pickup.label, by: who.regular.label, kind: 'note', replies: null, truncated: false },
})

const priced = activity({
  id: 'i11', verb: 'menu.price_changed', glyph: 'tag',
  published_at: '2026-08-14T09:10:00.000000Z',
  headline_template: ':actor changed the price of :object',
  actor: who.cook, object: dishes.kottu,
  data: { $detail: 'Storyfeed/Detail/Change', $v: 1, changes: {
    Price: ['$14.50', '$15.50'], 'On the menu': [false, true] } },
})

const kitchenFeed = [
  activity({ id: 'i12a', verb: 'order.ready', glyph: 'utensils', published_at: '2026-08-14T14:50:00.000000Z',
    headline_template: ':actor marked :object ready', actor: who.cook, object: orders.first }),
  activity({ id: 'i12b', verb: 'menu.price_changed', glyph: 'tag', published_at: '2026-08-14T14:45:00.000000Z',
    headline_template: ':actor changed the price of :object', actor: who.cook, object: dishes.kottu }),
  activity({ id: 'i12c', verb: 'order.placed', glyph: 'shopping-bag', published_at: at,
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.first, target: where.kitchen }),
]

const customerFeed = [kitchenFeed[0], kitchenFeed[2]]

const anonymous = activity({
  id: 'i13', verb: 'order.expired', glyph: 'circle-x',
  published_at: '2026-08-21T00:00:00.000000Z',
  headline_template: ':object expired at :target',
  actor: null, object: orders.fifth, target: where.kitchen,
})
</script>

## One Activity

<<< @/snippets/publish.php

<FeedStream :items="[scenes.order]" :grouped="false" />

## Three in a Row, One Line

The same customer orders three times in a few minutes. Nothing coordinates the
three requests.

```php
// where the order is placed: a controller, an action, a listener
Storyfeed::activity()
    ->by($customer)
    ->action('order.placed', $order)
    ->to($kitchen)
    ->publish();
```

<FeedStream :items="[burst]" :grouped="false" />

Read as a plain timeline instead, the same three activities are three rows:

<FeedStream :items="expanded" :grouped="false" />

[Reading Feeds](/basics/reading) picks the mode. [Aggregation](/deeper/aggregation)
decides the grouping.

## A Crowd, One Line

Five customers, five orders, five separate requests.

<FeedStream :items="[crowd]" :grouped="false" />

[Aggregation](/deeper/aggregation) covers the axes and what each one may say.

## Several Objects, One Fact

The cook publishes two dishes in one click. That is one decision, so it is one
activity, not two.

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($cook)
    ->action('menu.dish_live')
    ->objects($dishes)
    ->publish();
```

<FeedStream :items="[menu]" :grouped="false" />

[Composites](/deeper/composites).

## Someone Who Is Not a User

A payment provider reports an order paid, and it has no row in your database.

```php
// app/Http/Controllers/StripeWebhookController.php
Storyfeed::activity()
    ->by('Stripe')
    ->action('payment.received', $order)
    ->publish();
```

<FeedStream :items="[paid]" :grouped="false" />

And when nobody acted at all, the sentence can leave the actor out:

<FeedStream :items="[anonymous]" :grouped="false" />

[Parties & Anonymous Actors](/deeper/parties).

## The Words Someone Wrote

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($customer)
    ->action('order.noted', $order)
    ->thread(FeedThread::make(text: $note->body, by: $customer->name, kind: 'note'))
    ->publish();
```

<FeedStream :items="[noted]" :grouped="false" />

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

<FeedStream :items="[priced]" :grouped="false" />

[What an Activity Shows](/basics/activity-content) covers the forms a row can
carry.

## Two Audiences, One History

The kitchen sees everything it did:

```php
// a controller, or wherever the feed is read
Storyfeed::feed('kitchen')->involving($kitchen)->get();
```

<FeedStream :items="kitchenFeed" :grouped="false" />

The customer sees their own order, and only the verbs that concern them:

```php
// a controller, or wherever the feed is read
Storyfeed::feed('customer')->involving($order)->get();
```

<FeedStream :items="customerFeed" :grouped="false" />

[Named Feeds](/basics/named-feeds) declares each audience once.
