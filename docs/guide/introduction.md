# Introduction

Storyfeed is an implementation of the activity feed pattern in Laravel.
Activities are recorded explicitly, displayed as a live feed, a summary or
a log, and serialized following
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

<a id="different-ways-to-render-the-same-activity"></a>

### Different Headlines for the Same Activity

Your app chooses the headline; the fact stays the same. In each of these, the
verb is still `place`. Only the headline's wording changes.

<FeedExample :items="[sameFact[0]]">

**{{ role.customer.label }}** *(actor)* **sent** *(headline)* **{{ scene.order.object.label }}** *(object)* to **{{ role.shop.label }}** *(target)*

</FeedExample>

<FeedExample :items="[sameFact[1]]">

A new order, **{{ scene.order.object.label }}** *(object)*, **came in** *(headline)* to **{{ role.shop.label }}** *(target)* from **{{ role.customer.label }}** *(actor)*

</FeedExample>

<FeedExample :items="[sameFact[2]]">

**{{ role.shop.label }}** *(target)* **received** *(headline)* **{{ scene.order.object.label }}** *(object)* from **{{ role.customer.label }}** *(actor)*

</FeedExample>

<a id="examples-of-activities"></a>
<a id="other-examples"></a>

<a id="activities-in-other-apps"></a>

### Examples From Other Apps

<FeedExample :items="[scene.otherApps.task]">

**{{ scene.otherApps.task.actor.label }}** *(actor)* **completed** *(verb)* **{{ scene.otherApps.task.object.label }}** *(object)* on **{{ scene.otherApps.task.target.label }}** *(target)*

</FeedExample>

<FeedExample :items="[scene.otherApps.signature]">

**{{ scene.otherApps.signature.actor.label }}** *(actor)* **signed** *(verb)* **{{ scene.otherApps.signature.object.label }}** *(object)*

</FeedExample>

<FeedExample :items="[scene.otherApps.team]">

**{{ scene.otherApps.team.actor.label }}** *(actor)* **joined** *(verb)* **{{ scene.otherApps.team.target.label }}** *(target)*

</FeedExample>

## Recording Activities

After [installing Storyfeed](/guide/installation), and with the models and headline from the [Quickstart](/guide/quickstart) in place, record an activity where the order is placed:

::: code-group
<<< @/snippets/publish.php {php memo="Where the order is placed: a controller, an action, a listener"} [Fluent Syntax]
<<< @/snippets/publish.named-arguments.php {php memo="Where the order is placed: a controller, an action, a listener"} [Named Arguments]
:::

<FeedExample :items="[scene.order]" />

<a id="examples-of-feeds"></a>

## Displaying Feeds

The same recorded activities display three ways. [Reading Feeds](/basics/reading) shows how to choose one.

### Live

The familiar feed, and the default. Repeats fold into one row, and so do
several people doing the same thing at one place.

<FeedExample :items="worldLive" days height="420" />

<a id="as-a-grouped-summary"></a>
<a id="aggregated-feeds"></a>

### Summary

A digest: one row per person per day, saying everything they did.

<FeedExample :items="worldSummary" days height="420" />

<a id="as-a-timeline"></a>
<a id="timeline-feeds"></a>

### Log

The timeline: every activity, one row each.

<FeedExample :items="worldLog" days height="420" />
