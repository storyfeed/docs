# Introduction

Storyfeed is an implementation of the activity feed pattern in Laravel.
Activities are recorded explicitly, read back as a timeline or an aggregated
feed, and serialized following
[W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/).

<script setup>
// Node-shaped examples: the same shape `Storyfeed::feed()->get()` returns, so the
// widgets below are the demo app's real renderer reading a real payload rather
// than a diagram of one.
import { who, where, orders, dishes, devices, notes, activity, group } from '../.vitepress/theme/samples'

// Eight minutes of a dinner service, 18:44–18:52.
const log = [
  ['18:52:02','ready','utensils',':actor marked :object ready', who.cook, orders.third, null, null],
  ['18:51:02','dispatch','bike',':actor is on the way with :object', who.runner, orders.second, null, null],
  ['18:50:02','confirm','circle-check',':actor confirmed :object', who.cook, orders.fifth, null, null],
  ['18:49:02','place','shopping-bag',':actor placed :object with :target', who.customer5, orders.fifth, where.kitchen, null],
  ['18:49:02','ask','message-circle',':actor asked about :target', who.customer4, notes.spice, dishes.chickenCurry, null],
  ['18:48:15','confirm','circle-check',':actor confirmed :object', who.cook, orders.fourth, null, null],
  ['18:48:02','place','shopping-bag',':actor placed :object with :target', who.customer4, orders.fourth, where.kitchen, null],
  ['18:48:00','dispatch','bike',':actor is on the way with :object', who.runner, orders.first, null, null],
  ['18:47:02','confirm','circle-check',':actor confirmed :object', who.cook, orders.third, null, null],
  ['18:46:56','place','shopping-bag',':actor placed :object with :target', who.customer3, orders.third, where.kitchen, null],
  ['18:46:02','ready','utensils',':actor marked :object ready', who.cook, orders.second, null, null],
  ['18:45:46','note','message-circle',':actor sent a note about :object', who.customer2, orders.second, null, null],
  ['18:45:37','confirm','circle-check',':actor confirmed :object', who.cook, orders.second, null, null],
  ['18:45:08','place','shopping-bag',':actor placed :object with :target', who.customer2, orders.second, where.kitchen, null],
  ['18:45:02','ready','utensils',':actor marked :object ready', who.cook, orders.first, null, null],
  ['18:45:02','publish','chef-hat',':actor put :object on the menu', who.cook, dishes.lassi, null, null],
  ['18:44:02','confirm','circle-check',':actor confirmed :object', who.cook, orders.first, null, null],
  ['18:44:02','place','shopping-bag',':actor placed :object with :target', who.regular, orders.first, where.kitchen, null],
].map(([time, verb, glyph, tpl, actor, object, target, context], i) => activity({
  id: `l${i}`, verb, glyph, headline_template: tpl,
  published_at: `2026-08-14T${time}.000000Z`, actor, object, target, context,
}))

// The same window, collapsed. Counts reach back past 18:44.
const summary = [
  group({ id: 'g1', verb: 'ready', axis: 'repeat', count: 9, glyph: 'utensils',
    published_at: '2026-08-14T18:52:02.000000Z',
    headline_template: ':actor marked :count orders ready',
    actors: [who.cook], distinct: { actors: 1, objects: 9 } }),
  group({ id: 'g2', verb: 'dispatch', axis: 'repeat', count: 4, glyph: 'bike',
    published_at: '2026-08-14T18:51:02.000000Z',
    headline_template: ':actor is on the way with :count orders',
    actors: [who.runner], objects: [orders.second, orders.first], distinct: { actors: 1, objects: 4 } }),
  group({ id: 'g3', verb: 'place', axis: 'actors', count: 12, glyph: 'shopping-bag',
    published_at: '2026-08-14T18:49:02.000000Z',
    headline_template: ':actors ordered from :target',
    actors: [who.customer5, who.customer4, who.customer3], targets: [where.kitchen],
    distinct: { actors: 7, objects: 12, targets: 1 } }),
  group({ id: 'g4', verb: 'ask', axis: 'targets', count: 5, glyph: 'message-circle',
    published_at: '2026-08-14T18:49:02.000000Z',
    headline_template: ':actor asked about :targets',
    actors: [who.customer4], targets: [dishes.chickenCurry, dishes.kottu],
    distinct: { actors: 1, targets: 2 } }),
  group({ id: 'g5', verb: 'publish', axis: 'composite', count: 3, glyph: 'chef-hat',
    published_at: '2026-08-14T18:45:02.000000Z',
    headline_template: ':actor put :count dishes on the menu',
    actors: [who.cook], objects: [dishes.lassi, dishes.roti, dishes.cutlets],
    distinct: { actors: 1, objects: 3 } }),
]

// Section 2 reuses one activity from the log, so the roles arrive on a sentence
// the reader has already read.
const oneActivity = [
  activity({ id: 'a6', verb: 'ask', glyph: 'message-circle', published_at: '2026-08-14T18:49:02.000000Z',
    headline_template: ':actor asked about :target',
    actor: who.customer4, object: notes.spice, target: dishes.chickenCurry }),
  activity({ id: 'a5', verb: 'place', glyph: 'shopping-bag', published_at: '2026-08-14T18:44:02.000000Z',
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.first, target: where.kitchen }),
  activity({ id: 'a4', verb: 'publish', glyph: 'chef-hat', published_at: '2026-08-14T12:00:00.000000Z',
    headline_template: ':actor put :object on the menu',
    actor: who.cook, object: dishes.chickenCurry }),
  activity({ id: 'a3', verb: 'pair', glyph: 'tablet', published_at: '2026-08-14T11:30:00.000000Z',
    headline_template: ':actor paired :object',
    actor: who.cook, object: devices.ipad }),
  activity({ id: 'a2', verb: 'join', glyph: 'user-plus', published_at: '2026-08-13T19:00:00.000000Z',
    headline_template: ':actor joined :target',
    actor: who.newcomer, target: where.table }),
  activity({ id: 'a1', verb: 'open', glyph: 'building-2', published_at: '2026-08-12T10:00:00.000000Z',
    headline_template: ':actor opened :object',
    actor: who.owner, object: where.kitchen }),
]
</script>

<a id="what-is-an-activity"></a>

## Activities

An activity is a recorded fact, shaped like a sentence with named roles:

<FeedExample :items="[oneActivity[1]]" />

The **actor** is who did it. The **verb** is what happened. The **object** is
what it was done to, and the **target** is what it was aimed at.

> **{{ who.regular.label }}** *(actor)* **placed** *(verb)* **{{ orders.first.label }}** *(object)*
> with **{{ where.kitchen.label }}** *(target)*

**{{ who.regular.label }}** is the party that initiated the **placing** of **{{ orders.first.label }}**, with **{{ where.kitchen.label }}**.
The summary headline of the activity may take different forms, but the underlying fact is always the same.

> **{{ who.regular.label }}** sent **{{ orders.first.label }}** to **{{ where.kitchen.label }}**

> A new order, **{{ orders.first.label }}**, came in to **{{ where.kitchen.label }}** from **{{ who.regular.label }}**

> **{{ where.kitchen.label }}** received **{{ orders.first.label }}** from **{{ who.regular.label }}**

The recorded verb is still `place`, whichever headline describes it.


<a id="examples-of-activities"></a>

**{{ who.customer4.label }}** *(actor)* **asked** *(verb)* about **{{ dishes.chickenCurry.label }}** *(target)*. The object is the note itself, so the headline names the target.

<FeedExample :items="[oneActivity[0]]" />

**{{ who.cook.label }}** *(actor)* **put** **{{ dishes.chickenCurry.label }}** *(object)* **on the menu** *(verb)*

<FeedExample :items="[oneActivity[2]]" />

**{{ who.cook.label }}** *(actor)* **paired** *(verb)* **{{ devices.ipad.label }}** *(object)*

<FeedExample :items="[oneActivity[3]]" />

**{{ who.newcomer.label }}** *(actor)* **joined** *(verb)* **{{ where.table.label }}** *(target)*, with no object

<FeedExample :items="[oneActivity[4]]" />

**{{ who.owner.label }}** *(actor)* **opened** *(verb)* **{{ where.kitchen.label }}** *(object)*

<FeedExample :items="[oneActivity[5]]" />

## Recording Activities

After [installing Storyfeed](/guide/installation), record an activity where the order is placed:

::: code-group
<<< @/snippets/publish.php [Fluent Syntax]
<<< @/snippets/publish.named-arguments.php [Named Arguments]
:::

<FeedExample :items="[oneActivity[1]]" />

<a id="examples-of-feeds"></a>

## Reading Feeds

A feed reads recorded activities as individual rows or groups. [Reading Feeds](/basics/reading) describes the read modes.

<a id="as-a-timeline"></a>

### Timeline Feeds

<FeedExample :items="log" />

<a id="as-a-grouped-summary"></a>

### Aggregated Feeds

<FeedExample :items="summary" />
