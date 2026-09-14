# Recording Activities

An activity is a verb plus the entities in its roles. Recording one is an
explicit call from wherever the fact happens: an action, an observer, an event
listener. When you are done, each fact your app cares about is one call that
reads like the sentence it produces.

<script setup>
import { who, where, orders, dishes, party, activity, scenes } from '../.vitepress/theme/samples'

const paid = activity({
  id: 'r2', verb: 'payment.received', glyph: 'credit-card',
  published_at: '2026-08-14T14:32:00.000000Z',
  headline_template: ':actor marked :object paid',
  actor: party.service, object: orders.first,
})

const priced = activity({
  id: 'r3', verb: 'menu.price_changed', glyph: 'tag',
  published_at: '2026-08-14T09:10:00.000000Z',
  headline_template: ':actor changed the price of :object',
  actor: who.cook, object: dishes.kottu,
})
</script>

## The Builder

The builder reads in the order of the headline it produces:

<<< @/snippets/publish.php

<FeedStream :items="[scenes.order]" :grouped="false" />

The first argument to `action()` is the **verb**: a plain string naming what
happened. `order.placed` is this app's own word, not one the package knows —
verbs are free-form, and nothing has to be registered before you record one.
A dot is just a character in the string; it groups a vocabulary for a reader,
and for the wildcards a later page uses.

The same activity in one call, when everything is in hand:

```php
// where the order is placed: a controller, an action, a listener
Storyfeed::record('order.placed', $order, actor: $customer, target: $kitchen);
```

## Roles

| Role | Question It Answers | Example |
|---|---|---|
| `actor` | who did it | the customer |
| `object` | what it was done to | the order |
| `target` | what the act was directed at | the kitchen |
| `context` | where it happened | the surrounding container |
| `origin` | where it came from | the source of an accepted invitation |
| `result` | what it produced | a receipt, a generated artifact |
| `instrument` | what it happened via | the device an order was taken on |

Direction decides the role. The same tablet is a `target` for an order sent
**to** it and an `instrument` for an order taken **on** it.

## Reading as a Sentence

Each role has a setter named for it: `actor()`, `object()`, `target()`,
`context()`, `origin()`, `result()` and `instrument()`; `verb()` sets the verb.
Aliases let the call site read as the sentence:

| Alias | Sets | Reads As |
|---|---|---|
| `->by()` | `actor` | who acted |
| `->action()` | `verb` and `object` | what they did, to what |
| `->using()` | `instrument` | what they acted via |
| `->resulting()` | `result` | what they produced |
| `->to()` `->for()` `->on()` `->with()` `->into()` `->in()` `->from()` | `target` | what it was aimed at |

An alias and its setter record identical rows. `context` is set only by
`->context()`; `->in()` and `->from()` set the target, not the container.

## The Actor

Omit the actor and the authenticated user is recorded. When a webhook or a
job records the fact, there is no authenticated user, so name the actor:

```php
// app/Http/Controllers/StripeWebhookController.php
Storyfeed::activity()
    ->by('Stripe')
    ->action('payment.received', $order)
    ->publish();
```

<FeedStream :items="[paid]" :grouped="false" />

A string actor is a [party](/deeper/parties): a named participant with no
model. When nothing names an actor the activity is published with none, which
means the actor is genuinely unknown.

## Extra Data and Backdating

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($cook)
    ->action('menu.price_changed', $dish)
    ->data(['from' => 1450, 'to' => 1550])   // activity-level payload, arrives in the node
    ->publishedAt($changedAt)                // backdate: imports, backfills
    ->publish();
```

<FeedStream :items="[priced]" :grouped="false" />

`Storyfeed::record()` takes the same as named arguments: `data:`,
`publishedAt:`, `replace:`, `objects:` and `thread:`.

## Replacing Instead of Appending

A price edited five times before the menu goes live is one fact, not five.
`->replace()` supersedes the earlier row with the same object and verb:

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()->by($cook)->action('menu.price_changed', $dish)->replace()->publish();

// a minute later, another request
Storyfeed::activity()->by($cook)->action('menu.price_changed', $dish)->replace()->publish();
```

<FeedStream :items="[priced]" :grouped="false" />

The key is the object and the verb; `data` is not part of it. Which verbs
should replace and which should append is worked through in
[Repeating Activities](/cookbook/repeating-activities).

## Recording Many Objects at Once

Pass `objects:` (or `->objects()`) to record one activity about many objects:

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::record('menu.dish_live', objects: $dishes, actor: $cook);
```

[Composites](/deeper/composites) covers how that activity reads and groups.
