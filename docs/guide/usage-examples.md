# Usage Examples

<script setup>
import { who, where, orders, dishes, party, activity, group, scenes } from '../.vitepress/theme/samples'

const burst = group({
  id: 'i2', verb: 'order.placed', axis: 'repeat', count: 3, glyph: 'shopping-bag',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor placed :count orders with :target',
  actors: [who.regular], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 1, objects: 3, targets: 1 },
})

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
  actors: [who.cook],
  objects: [dishes.cutlets, dishes.roti],
  distinct: { actors: 1, objects: 2 },
})

const paid = activity({
  id: 'i9', verb: 'payment.received', glyph: 'credit-card',
  published_at: '2026-08-14T14:32:00.000000Z',
  headline_template: ':actor marked :object paid',
  actor: party.service, object: orders.first,
})
</script>

## A Single Activity

A customer places an order with the kitchen.

<<< @/snippets/publish.php

<FeedStream :items="[scenes.order]" :grouped="false" />

## Consecutive Activities

The same customer places three orders, one after another.

```php
// where the order is placed: a controller, an action, a listener
foreach ($orders as $order) {
    Storyfeed::activity()
        ->by($customer)
        ->action('order.placed', $order)
        ->to($kitchen)
        ->publish();
}
```

<FeedStream :items="[burst]" :grouped="false" />

## Concurrent Activities in One Kitchen

Five customers order from the same kitchen, each from their own request,
minutes apart. Nothing coordinates them.

```php
// Steve, 14:31
Storyfeed::activity()
    ->by($customer)
    ->action('order.placed', $order)
    ->to($kitchen)
    ->publish();
```

*a minute later, another request*

```php
// Robin, 14:32
Storyfeed::activity()
    ->by($customer)
    ->action('order.placed', $order)
    ->to($kitchen)
    ->publish();
```

*three minutes later, another request*

```php
// Dustin, 14:35
Storyfeed::activity()
    ->by($customer)
    ->action('order.placed', $order)
    ->to($kitchen)
    ->publish();
```

Each call knows only its own activity. On the feed:

<FeedStream :items="[crowd]" :grouped="false" />

## One Activity About Several Objects

The cook puts two dishes on the menu at once.

```php
// app/Http/Controllers/PublishDishesController.php
public function store(Request $request)
{
    $dishes = MenuItem::whereIn('id', $request->array('dishes'))->get();

    // Two dishes, one decision, one row.
    Storyfeed::activity()
        ->by($request->user())
        ->action('menu.dish_live')
        ->objects($dishes)
        ->publish();

    return back();
}
```

`objects()` takes several models for **one** activity. That is the difference
between this and the loop further up: three `publish()` calls are three
activities that a reader sees collapsed, while this is a single activity that
happens to name two dishes. Publishing two dishes in one click is one fact.

<FeedStream :items="[menu]" :grouped="false" />

## A Participant With No Model

A payment provider reports an order paid, and it has no row in your database
to point at.

```php
// app/Http/Controllers/StripeWebhookController.php
Storyfeed::activity()
    ->by('Stripe')
    ->action('payment.received', $order)
    ->publish();
```

<FeedStream :items="[paid]" :grouped="false" />

## Choosing the Preposition

Say the sentence out loud first. You place an order **with** a kitchen, ask
**about** a dish, send a note **about** an order, pair a device **to** a
display, add a dish **to** the menu. The code takes the same word:

```php
->by($customer)->action('order.placed', $order)->with($kitchen)
->by($customer)->action('discussion.asked', $note)->on($dish)
->by($cook)->action('device.paired', $ipad)->to($display)
->by($cook)->action('menu.dish_added', $dish)->into($menu)
->by($customer)->action('people.joined')->in($table)
```

**All five prepositions do exactly the same thing.** They set the last
participant, whose real name is the *target*. `on()`, `with()`, `into()`,
`to()`, `for()`, `in()` and `from()` are one method wearing seven words, so you
can write the line that matches what you would say.

Here is the first line with nothing dressed up. It stores a byte-identical row:

```php
->actor($customer)->verb('order.placed', $order)->target($kitchen)
```

Neither is the correct one. Use whichever you would rather read in six months,
and if no preposition fits your verb, `target()` always does.

[Recording Activities](/basics/recording) lists every role and every word for it.
