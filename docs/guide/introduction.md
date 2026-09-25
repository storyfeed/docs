# Introduction

Storyfeed is an implementation of the activity feed pattern in Laravel.
Activities are recorded explicitly, displayed as a log, a live feed or a
summary, and serialized following
[W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/).

<script setup>
// Node-shaped examples: the same shape `Storyfeed::feed()->get()` returns, so the
// widgets below are the demo app's real renderer reading a real payload rather
// than a diagram of one.
import { who, where, orders, dishes, notes, party, entity, activity, group } from '../.vitepress/theme/samples'

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

// The same window, three ways. Group counts reach back past 18:44 to the start
// of the evening; the log shows only the eight minutes.
const readyAll  = group({ id: 'r1', verb: 'ready', axis: 'repeat', count: 9, glyph: 'utensils',
    published_at: '2026-08-14T18:52:02.000000Z', headline_template: ':actor marked :count orders ready',
    actors: [who.cook], distinct: { actors: 1, objects: 9 } })
const onTheWay  = group({ id: 'r2', verb: 'dispatch', axis: 'repeat', count: 4, glyph: 'bike',
    published_at: '2026-08-14T18:51:02.000000Z', headline_template: ':actor is on the way with :count orders',
    actors: [who.runner], objects: [orders.second, orders.first], distinct: { actors: 1, objects: 4 } })
const confirmed = group({ id: 'r3', verb: 'confirm', axis: 'repeat', count: 11, glyph: 'circle-check',
    published_at: '2026-08-14T18:50:02.000000Z', headline_template: ':actor confirmed :count orders',
    actors: [who.cook], distinct: { actors: 1, objects: 11 } })
const onMenu    = (axis) => group({ id: `m-${axis}`, verb: 'publish', axis, count: 3, glyph: 'chef-hat',
    published_at: '2026-08-14T18:45:02.000000Z', headline_template: ':actor put :count dishes on the menu',
    actors: [who.cook], objects: [dishes.lassi, dishes.roti, dishes.cutlets], distinct: { actors: 1, objects: 3 } })
const at = (time) => log.find((row) => row.published_at === `2026-08-14T${time}.000000Z` && row.verb === 'place')

// LIVE groups repeats only: one person doing one thing again. Orders from
// different customers stay separate rows.
const live = [
  readyAll, onTheWay, confirmed,
  at('18:49:02'),
  group({ id: 'r4', verb: 'ask', axis: 'repeat', count: 2, glyph: 'message-circle',
    published_at: '2026-08-14T18:49:02.000000Z', headline_template: ':actor asked about :count dishes',
    actors: [who.customer4], distinct: { actors: 1, objects: 2 } }),
  at('18:48:02'), at('18:46:56'),
  log.find((row) => row.verb === 'note'),
  at('18:45:08'),
  onMenu('repeat'),
  at('18:44:02'),
]

// SUMMARY collapses along every axis: several customers ordering from one
// kitchen, one customer asking about several dishes.
const summary = [
  readyAll, onTheWay, confirmed,
  group({ id: 's1', verb: 'place', axis: 'actors', count: 12, glyph: 'shopping-bag',
    published_at: '2026-08-14T18:49:02.000000Z', headline_template: ':actors ordered from :target',
    actors: [who.customer5, who.customer4, who.customer3], targets: [where.kitchen],
    distinct: { actors: 7, objects: 12, targets: 1 } }),
  group({ id: 's2', verb: 'ask', axis: 'targets', count: 2, glyph: 'message-circle',
    published_at: '2026-08-14T18:49:02.000000Z', headline_template: ':actor asked about :targets',
    actors: [who.customer4], targets: [dishes.chickenCurry, dishes.kottu], distinct: { actors: 1, targets: 2 } }),
  log.find((row) => row.verb === 'note'),
  onMenu('composite'),
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
]

// One fact, three headlines: the verb stays `place`; only the wording moves.
const sameFact = [
  ':actor sent :object to :target',
  'A new order, :object, came in to :target from :actor',
  ':target received :object from :actor',
].map((headline_template, i) => activity({ id: `h${i}`, verb: 'place', glyph: 'shopping-bag',
  published_at: '2026-08-14T18:44:02.000000Z', headline_template,
  actor: who.regular, object: orders.first, target: where.kitchen }))

// The same shape in other apps, same cast: a task tracker, a code host,
// billing, e-signature, a support desk, a newsroom.
const elsewhere = {
  task:     entity('task', '17', 'Decode the Russian broadcast', '/tasks/17'),
  project:  entity('project', 'starcourt', 'Operation Starcourt', '/projects/starcourt'),
  pull:     entity('pull_request', '214', 'Pull request #214', '/pulls/214'),
  repo:     entity('repository', 'cerebro', 'cerebro', '/repositories/cerebro'),
  invoice:  entity('invoice', '1983', 'Scoops Ahoy invoice #1983', '/invoices/1983'),
  contract: entity('document', 'fv-1', 'the Family Video employment contract', '/documents/fv-1'),
  ticket:   entity('ticket', '881', 'Ticket #881: Dig Dug high score reset', '/tickets/881'),
  desk:     entity('team', 'photo', 'the Hawkins Post photo desk', '/teams/photo'),
}

const otherApps = [
  activity({ id: 'e1', verb: 'complete', glyph: 'square-check', published_at: '2026-08-14T16:20:00.000000Z',
    headline_template: ':actor completed :object in :target',
    actor: who.customer2, object: elsewhere.task, target: elsewhere.project }),
  activity({ id: 'e2', verb: 'merge', glyph: 'git-merge', published_at: '2026-08-14T15:05:00.000000Z',
    headline_template: ':actor merged :object into :target',
    actor: who.customer3, object: elsewhere.pull, target: elsewhere.repo }),
  activity({ id: 'e3', verb: 'pay', glyph: 'receipt', published_at: '2026-08-14T14:00:00.000000Z',
    headline_template: ':actor marked :object paid',
    actor: party.service, object: elsewhere.invoice }),
  activity({ id: 'e4', verb: 'sign', glyph: 'file-pen', published_at: '2026-08-14T11:40:00.000000Z',
    headline_template: ':actor signed :object',
    actor: who.regular, object: elsewhere.contract }),
  activity({ id: 'e5', verb: 'assign', glyph: 'ticket', published_at: '2026-08-14T10:15:00.000000Z',
    headline_template: ':actor assigned :object to :target',
    actor: who.customer4, object: elsewhere.ticket, target: who.customer5 }),
  activity({ id: 'e6', verb: 'join', glyph: 'user-plus', published_at: '2026-08-13T19:00:00.000000Z',
    headline_template: ':actor joined :target',
    actor: who.runner, target: elsewhere.desk }),
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

### Different Ways to Render the Same Activity

The summary headline of the activity may take different forms, but the underlying fact is always the same.

<FeedExample :items="[sameFact[0]]">

**{{ who.regular.label }}** *(actor)* **sent** *(verb)* **{{ orders.first.label }}** *(object)* to **{{ where.kitchen.label }}** *(target)*

</FeedExample>

<FeedExample :items="[sameFact[1]]">

A new order, **{{ orders.first.label }}** *(object)*, **came in** *(verb)* to **{{ where.kitchen.label }}** *(target)* from **{{ who.regular.label }}** *(actor)*

</FeedExample>

<FeedExample :items="[sameFact[2]]">

**{{ where.kitchen.label }}** *(target)* **received** *(verb)* **{{ orders.first.label }}** *(object)* from **{{ who.regular.label }}** *(actor)*

</FeedExample>


<a id="examples-of-activities"></a>

### Other Examples

<FeedExample :items="[oneActivity[0]]">

**{{ who.customer4.label }}** *(actor)* **asked** *(verb)* about **{{ dishes.chickenCurry.label }}** *(target)*

</FeedExample>

<FeedExample :items="[otherApps[0]]">

**{{ who.customer2.label }}** *(actor)* **completed** *(verb)* **{{ elsewhere.task.label }}** *(object)* in **{{ elsewhere.project.label }}** *(target)*

</FeedExample>

<FeedExample :items="[otherApps[1]]">

**{{ who.customer3.label }}** *(actor)* **merged** *(verb)* **{{ elsewhere.pull.label }}** *(object)* into **{{ elsewhere.repo.label }}** *(target)*

</FeedExample>

<FeedExample :items="[otherApps[2]]">

**{{ party.service.label }}** *(actor)* **marked** **{{ elsewhere.invoice.label }}** *(object)* **paid** *(verb)*

</FeedExample>

<FeedExample :items="[otherApps[3]]">

**{{ who.regular.label }}** *(actor)* **signed** *(verb)* **{{ elsewhere.contract.label }}** *(object)*

</FeedExample>

<FeedExample :items="[otherApps[4]]">

**{{ who.customer4.label }}** *(actor)* **assigned** *(verb)* **{{ elsewhere.ticket.label }}** *(object)* to **{{ who.customer5.label }}** *(target)*

</FeedExample>

<FeedExample :items="[otherApps[5]]">

**{{ who.runner.label }}** *(actor)* **joined** *(verb)* **{{ elsewhere.desk.label }}** *(target)*

</FeedExample>

## Recording Activities

After [installing Storyfeed](/guide/installation), record an activity where the order is placed:

::: code-group
<<< @/snippets/publish.php {php memo="Where the order is placed: a controller, an action, a listener"} [Fluent Syntax]
<<< @/snippets/publish.named-arguments.php {php memo="Where the order is placed: a controller, an action, a listener"} [Named Arguments]
:::

<FeedExample :items="[oneActivity[1]]" />

<a id="examples-of-feeds"></a>

## Displaying Feeds

The same recorded activities display three ways. [Reading Feeds](/basics/reading) shows how to choose one.

### Live

The familiar feed, and the typical home page: repeats collapse, so one person doing the same thing again reads as one row.

<FeedExample :items="live" />

<a id="as-a-grouped-summary"></a>
<a id="aggregated-feeds"></a>

### Summary

A grouped digest: many people in one place, one person across many things.

<FeedExample :items="summary" />

<a id="as-a-timeline"></a>
<a id="timeline-feeds"></a>

### Log

The atomic timeline: every activity, one row each.

<FeedExample :items="log" />
