# Introduction

Storyfeed is an implementation of the activity feed pattern in Laravel.
Activities are recorded explicitly, displayed as a log, a live feed or a
summary, and serialized following
[W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/).

<script setup>
// Node-shaped examples: the same shape `Storyfeed::feed()->get()` returns, so the
// widgets below are the demo app's real renderer reading a real payload rather
// than a diagram of one. Every example is a scene from the site's world pack,
// and every name in the prose is a role, so the page reads the same in any pack.
import { scene, role, logOf, liveOf, summaryOf } from '../.vitepress/theme/world'

// One fact, three headlines: the verb stays `place`; only the wording moves.
const sameFact = [
  ':actor sent :object to :target',
  'A new order, :object, came in to :target from :actor',
  ':target received :object from :actor',
].map((headline_template, i) => ({ ...scene.order, id: `h${i}`, headline_template }))

// A short, wide feed: a few days across many apps, and one row from long ago.
// The three feeds below are COMPUTED from these rows, so a group's count is
// always the rows it stands for. The long feeds are later in the docs.
const worldLog = logOf(scene.glance)
const worldLive = liveOf(scene.glance)
const worldSummary = summaryOf(scene.glance)
</script>

<a id="what-is-an-activity"></a>

## Activities

An activity is a recorded fact, shaped like a sentence with named roles:

<FeedExample :items="[scene.order]" />

The **actor** is who did it. The **verb** is what happened. The **object** is
what it was done to, and the **target** is what it was aimed at.

> **{{ role.customer.label }}** *(actor)* **placed** *(verb)* **{{ scene.order.object.label }}** *(object)*
> with **{{ role.shop.label }}** *(target)*

**{{ role.customer.label }}** is the party that initiated the **placing** of **{{ scene.order.object.label }}**, with **{{ role.shop.label }}**.

### Different Ways to Render the Same Activity

The summary headline of the activity may take different forms, but the underlying fact is always the same.

<FeedExample :items="[sameFact[0]]">

**{{ role.customer.label }}** *(actor)* **sent** *(verb)* **{{ scene.order.object.label }}** *(object)* to **{{ role.shop.label }}** *(target)*

</FeedExample>

<FeedExample :items="[sameFact[1]]">

A new order, **{{ scene.order.object.label }}** *(object)*, **came in** *(verb)* to **{{ role.shop.label }}** *(target)* from **{{ role.customer.label }}** *(actor)*

</FeedExample>

<FeedExample :items="[sameFact[2]]">

**{{ role.shop.label }}** *(target)* **received** *(verb)* **{{ scene.order.object.label }}** *(object)* from **{{ role.customer.label }}** *(actor)*

</FeedExample>


<a id="examples-of-activities"></a>

### Other Examples

<FeedExample :items="[scene.question]">

**{{ scene.question.actor.label }}** *(actor)* **asked** *(verb)* about **{{ scene.question.target.label }}** *(target)*

</FeedExample>

<FeedExample :items="[scene.otherApps.task]">

**{{ scene.otherApps.task.actor.label }}** *(actor)* **completed** *(verb)* **{{ scene.otherApps.task.object.label }}** *(object)* on **{{ scene.otherApps.task.target.label }}** *(target)*

</FeedExample>

<FeedExample :items="[scene.otherApps.code]">

**{{ scene.otherApps.code.actor.label }}** *(actor)* **merged** *(verb)* **{{ scene.otherApps.code.object.label }}** *(object)* into **{{ scene.otherApps.code.target.label }}** *(target)*

</FeedExample>

<FeedExample :items="[scene.otherApps.billing]">

**{{ scene.otherApps.billing.actor.label }}** *(actor)* **marked** **{{ scene.otherApps.billing.object.label }}** *(object)* **paid** *(verb)*

</FeedExample>

<FeedExample :items="[scene.otherApps.signature]">

**{{ scene.otherApps.signature.actor.label }}** *(actor)* **signed** *(verb)* **{{ scene.otherApps.signature.object.label }}** *(object)*

</FeedExample>

<FeedExample :items="[scene.otherApps.support]">

**{{ scene.otherApps.support.actor.label }}** *(actor)* **assigned** *(verb)* **{{ scene.otherApps.support.object.label }}** *(object)* to **{{ scene.otherApps.support.target.label }}** *(target)*

</FeedExample>

<FeedExample :items="[scene.otherApps.team]">

**{{ scene.otherApps.team.actor.label }}** *(actor)* **joined** *(verb)* **{{ scene.otherApps.team.target.label }}** *(target)*

</FeedExample>

## Recording Activities

After [installing Storyfeed](/guide/installation), record an activity where the order is placed:

::: code-group
<<< @/snippets/publish.php {php memo="Where the order is placed: a controller, an action, a listener"} [Fluent Syntax]
<<< @/snippets/publish.named-arguments.php {php memo="Where the order is placed: a controller, an action, a listener"} [Named Arguments]
:::

<FeedExample :items="[scene.order]" />

<a id="examples-of-feeds"></a>

## Displaying Feeds

The same recorded activities display three ways. [Reading Feeds](/basics/reading) shows how to choose one.

### Live

The familiar feed, and the typical home page: repeats collapse, so one person doing the same thing again reads as one row.

<FeedExample :items="worldLive" days />

<a id="as-a-grouped-summary"></a>
<a id="aggregated-feeds"></a>

### Summary

A grouped digest: many people in one place, one person across many things.

<FeedExample :items="worldSummary" days />

<a id="as-a-timeline"></a>
<a id="timeline-feeds"></a>

### Log

The atomic timeline: every activity, one row each.

<FeedExample :items="worldLog" days />
