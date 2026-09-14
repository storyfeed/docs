# Containers & Context

`context` is the fourth role: the container an activity happened **inside**.
With it recorded, a feed can be scoped to the container and an axis can group
by it.

<script setup>
import { who, where, dishes, notes, activity } from '../.vitepress/theme/samples'

const inside = activity({
  id: 'cx1', verb: 'discussion.asked', glyph: 'message-circle',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor asked about :target in :context',
  actor: who.customer4, object: notes.spice, target: dishes.chickenCurry,
  context: where.kitchen,
})
</script>

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($user)
    ->action('discussion.asked', $note)
    ->on($dish)               // target: what the question is about
    ->context($kitchen)       // context: the kitchen the dish belongs to
    ->publish();
```

<FeedStream :items="[inside]" :grouped="false" />

## The Difference Between Target and Context

| Role | Holds | In the Sentence |
|---|---|---|
| `target` | what the preposition points at | asked **about** the dish |
| `context` | the container the act happened inside | …**in** the kitchen |

They carry different facts when the target sits inside the container — a
a question about a dish in a kitchen, a note on an order at a table. That
is the case `context` is for.

When the target is itself the container, `target` carries it, and the record
is complete:

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($user)
    ->action('order.placed', $order)
    ->to($kitchen)
    ->publish();
```

Setting `context` to the same kitchen as well is allowed. It records the
kitchen twice, once in each role, and matters only when something reads the
`context` role — an axis you registered, a container query, the AS2 document.

Fill each role with what is true and available. The template decides which
roles the sentence names; a role it leaves out is still there for scoping,
grouping and the AS2 document.

## When to Set It

Whether an activity needs `context` is decided by what reads it, not by the
sentence:

| You Want | Why It Needs `context` |
|---|---|
| a group like "three customers asked about dishes in the same kitchen today" | axes key on roles, so the container has to *be* a role; no built-in axis keys on `context`, so this is a [custom axis](/deeper/aggregation#custom-axes) |
| `feed()->context($kitchen)` | the scope reads the `context` column |
| `:context` in a composite headline | the built-in `composite` axis pins `:actor`, `:target` and `:context` — see [Composites](/deeper/composites) |
| `context` on the Activity Streams 2.0 document | the serializer emits each role that is filled, and omits each that is not |

The axis is the one that cannot be had any other way:

```php
// app/Providers/AppServiceProvider.php, boot()
Axis::make('scene')
    ->key('v:ca!:cid!:d')                 // verb + context identity + day
    ->eligibleWhenDistinct('actor', min: 2);
```

A filter can narrow a feed to a container; only a role can group by one.

## The Container Query

`feed()->context($kitchen)` returns what happened inside the kitchen. It is
narrower than [`involving()`](/basics/reading#scoping), which also matches the
kitchen's own creation and closure — those record the kitchen as the
`object`.

## A Container That Is Not a Model

A folder name, a source system, a mailbox: when the room is a value rather than
an entity, it has three homes.

| Home | In the Headline | Groups by It | In the AS2 Document | Cost |
|---|---|---|---|---|
| `->context('Saturday service')` | yes, as `:context` | yes | yes, as a [party](/deeper/parties) | one party per distinct string |
| `->data(['folder' => $name])` | no — templates read roles, not `data` | no | no | the value arrives in the node for your renderer to show beneath |
| a closure in the grammar | yes, pre-rendered | no | no | `headline_template` is null; the renderer gets a string it cannot tokenize or link |

## Roles Are Set at Publish, and Never Backfilled

Roles are set when the activity is published and never backfilled: a
`context` axis registered later groups only the activities that were recorded with a
`context`. If the room is a model you have at publish time, record it.
