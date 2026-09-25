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
  keycard:  entity('task', '16', 'Find the keycard', '/tasks/16'),
  tunnels:  entity('task', '15', 'Map the tunnels', '/tasks/15'),
  pull213:  entity('pull_request', '213', 'Pull request #213', '/pulls/213'),
  invoice82: entity('invoice', '1982', 'Scoops Ahoy invoice #1982', '/invoices/1982'),
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
  activity({ id: 'e6', verb: 'join', glyph: 'user-plus', published_at: '2026-08-14T09:40:00.000000Z',
    headline_template: ':actor joined :target',
    actor: who.runner, target: elsewhere.desk }),
]

// ONE DAY IN HAWKINS: every activity the page has shown, and the rest of the
// day around it. The three feeds below are COMPUTED from these rows, so a
// group's count is always the rows it stands for.
const at = (time) => `2026-08-14T${time}.000000Z`
const row = (id, time, verb, glyph, headline_template, actor, object = null, target = null) =>
  activity({ id, verb, glyph, published_at: at(time), headline_template, actor, object, target })
const order = (n) => entity('order', String(n), `Order #${n}`, `/orders/${n}`)
const hawkinsPost = entity('publication', 'post', 'the Hawkins Post', '/publications/post')
const familyVideo = entity('store', 'fv', 'Family Video', '/stores/fv')
const photoOf = (n, label) => entity('photo', `p${n}`, label, `/photos/p${n}`)
const tape = (n, label) => entity('tape', `t${n}`, label, `/tapes/t${n}`)
const task = (n, label) => entity('task', String(n), label, `/tasks/${n}`)
const pull = (n) => entity('pull_request', String(n), `Pull request #${n}`, `/pulls/${n}`)
const invoice = (n) => entity('invoice', String(n), `Scoops Ahoy invoice #${n}`, `/invoices/${n}`)

const kitchen = [
  row('k1', '18:31:00', 'place', 'shopping-bag', ':actor placed :object with :target', who.newcomer, order(1047), where.kitchen),
  row('k2', '18:32:00', 'confirm', 'circle-check', ':actor confirmed :object', who.cook, order(1047)),
  row('k3', '18:40:00', 'ready', 'utensils', ':actor marked :object ready', who.cook, order(1047)),
  row('k4', '18:41:00', 'dispatch', 'bike', ':actor is on the way with :object', who.runner, order(1047)),
  oneActivity[1],
  row('k6', '18:44:30', 'confirm', 'circle-check', ':actor confirmed :object', who.cook, orders.first),
  row('k7', '18:45:08', 'place', 'shopping-bag', ':actor placed :object with :target', who.customer2, orders.second, where.kitchen),
  row('k8', '18:45:37', 'confirm', 'circle-check', ':actor confirmed :object', who.cook, orders.second),
  row('k9', '18:45:46', 'note', 'message-circle', ':actor sent a note about :object', who.customer2, orders.second),
  row('k10', '18:46:56', 'place', 'shopping-bag', ':actor placed :object with :target', who.customer3, orders.third, where.kitchen),
  row('k11', '18:47:02', 'confirm', 'circle-check', ':actor confirmed :object', who.cook, orders.third),
  row('k12', '18:48:02', 'place', 'shopping-bag', ':actor placed :object with :target', who.customer4, orders.fourth, where.kitchen),
  row('k13', '18:48:15', 'confirm', 'circle-check', ':actor confirmed :object', who.cook, orders.fourth),
  oneActivity[0],
  row('k15', '18:49:30', 'ask', 'message-circle', ':actor asked about :target', who.customer4, notes.spice, dishes.kottu),
  row('k16', '18:49:40', 'place', 'shopping-bag', ':actor placed :object with :target', who.customer5, orders.fifth, where.kitchen),
  row('k17', '18:50:02', 'confirm', 'circle-check', ':actor confirmed :object', who.cook, orders.fifth),
  row('k18', '18:50:30', 'ready', 'utensils', ':actor marked :object ready', who.cook, orders.first),
  row('k19', '18:51:02', 'dispatch', 'bike', ':actor is on the way with :object', who.runner, orders.first),
  row('k20', '18:51:30', 'ready', 'utensils', ':actor marked :object ready', who.cook, orders.second),
  row('k21', '18:52:02', 'ready', 'utensils', ':actor marked :object ready', who.cook, orders.third),
  row('k22', '18:52:30', 'dispatch', 'bike', ':actor is on the way with :object', who.runner, orders.second),
]

const aroundTown = [
  row('t1', '08:45:00', 'join', 'user-plus', ':actor joined :target', who.cook, null, elsewhere.desk),
  row('t2', '09:10:00', 'join', 'user-plus', ':actor joined :target', who.customer2, null, elsewhere.desk),
  otherApps[5],
  otherApps[4],
  ...['Starcourt at dusk', 'The Arcade line', 'Scoops Ahoy counter', 'Main Street parade', 'The quarry'].map((label, i) =>
    row(`t5${i}`, ['10:30:00', '10:50:00', '11:05:00', '11:20:00', '11:35:00'][i], 'upload', 'image', ':actor uploaded :object to :target', who.runner, photoOf(i, label), hawkinsPost)),
  otherApps[3],
  ...['The Goonies', 'Back to the Future', 'Ghostbusters'].map((label, i) =>
    row(`t6${i}`, ['12:10:00', '12:25:00', '12:40:00'][i], 'rent', 'tag', ':actor rented :object from :target', who.regular, tape(i, label), familyVideo)),
  ...[1980, 1981, 1982].map((n, i) =>
    row(`t7${i}`, ['13:00:00', '13:20:00', '13:40:00'][i], 'pay', 'receipt', ':actor marked :object paid', party.service, invoice(n))),
  otherApps[2],
  ...[212, 213].map((n, i) =>
    row(`t8${i}`, ['14:15:00', '14:40:00'][i], 'merge', 'git-merge', ':actor merged :object into :target', who.customer3, pull(n), elsewhere.repo)),
  otherApps[1],
  ...['Map the tunnels', 'Find the keycard', 'Crack the safe'].map((label, i) =>
    row(`t9${i}`, ['15:35:00', '15:50:00', '16:05:00'][i], 'complete', 'square-check', ':actor completed :object in :target', who.customer2, task(20 + i, label), elsewhere.project)),
  otherApps[0],
]

const newestFirst = (rows) => [...rows].sort((a, b) => b.published_at.localeCompare(a.published_at))
const worldLog = newestFirst([...kitchen, ...aroundTown])

// Group headlines, per verb and axis.
const heads = {
  place:    { repeat: ':actor placed :count orders with :target', actors: ':actors ordered from :target' },
  confirm:  { repeat: ':actor confirmed :count orders' },
  ready:    { repeat: ':actor marked :count orders ready' },
  dispatch: { repeat: ':actor is on the way with :count orders' },
  ask:      { repeat: ':actor asked about :target :count times', targets: ':actor asked about :targets' },
  upload:   { repeat: ':actor uploaded :count photos to :target' },
  rent:     { repeat: ':actor rented :count tapes from :target' },
  pay:      { repeat: ':actor marked :count invoices paid' },
  merge:    { repeat: ':actor merged :count pull requests into :target' },
  complete: { repeat: ':actor completed :count tasks in :target' },
  join:     { actors: ':actors joined :target' },
}
const uniq = (list) => list.filter((e, i) => e && list.findIndex((x) => x && x.id === e.id && x.type === e.type) === i)
const fold = (axis, members) => {
  const first = members[0]
  return group({
    id: `${axis}-${first.id}`, verb: first.verb, axis, count: members.length, glyph: first.glyph,
    published_at: members[0].published_at, headline_template: heads[first.verb][axis],
    actors: uniq(members.map((m) => m.actor)), objects: uniq(members.map((m) => m.object)).slice(0, 3),
    targets: uniq(members.map((m) => m.target)),
    distinct: {
      actors: uniq(members.map((m) => m.actor)).length,
      objects: uniq(members.map((m) => m.object)).length,
      targets: uniq(members.map((m) => m.target)).length,
    },
  })
}
const bucket = (rows, key) => rows.reduce((map, r) => map.set(key(r), [...(map.get(key(r)) ?? []), r]), new Map())
const idOf = (e) => (e ? `${e.type}:${e.id}` : '-')

// LIVE: repeats fold (one person, one verb, one target); nothing else does.
const repeats = (rows) => [...bucket(rows, (r) => `${idOf(r.actor)}|${r.verb}|${idOf(r.target)}`).values()]
  .map((members) => (members.length > 1 && heads[members[0].verb]?.repeat ? fold('repeat', members) : members))
  .flat()
const worldLive = newestFirst(repeats(worldLog))

// SUMMARY: also fold many people into one target (3 or more), and one person
// across targets (2 or more), before repeats.
const worldSummary = (() => {
  let rest = worldLog
  const out = []
  for (const members of bucket(rest, (r) => `${r.verb}|${idOf(r.target)}`).values()) {
    if (heads[members[0].verb]?.actors && uniq(members.map((m) => m.actor)).length >= 3) {
      out.push(fold('actors', members))
      rest = rest.filter((r) => !members.includes(r))
    }
  }
  for (const members of bucket(rest, (r) => `${idOf(r.actor)}|${r.verb}`).values()) {
    if (heads[members[0].verb]?.targets && uniq(members.map((m) => m.target)).length >= 2) {
      out.push(fold('targets', members))
      rest = rest.filter((r) => !members.includes(r))
    }
  }
  return newestFirst([...out, ...repeats(rest)])
})()
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

<FeedExample :items="worldLive" />

<a id="as-a-grouped-summary"></a>
<a id="aggregated-feeds"></a>

### Summary

A grouped digest: many people in one place, one person across many things.

<FeedExample :items="worldSummary" />

<a id="as-a-timeline"></a>
<a id="timeline-feeds"></a>

### Log

The atomic timeline: every activity, one row each.

<FeedExample :items="worldLog" />
