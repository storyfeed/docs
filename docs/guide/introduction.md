# Introduction

Storyfeed provides activity feeds for Laravel. You explicitly record activities
and display them as a live feed, a summary, or a log. Storyfeed also serializes
activities as [W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/)
documents.

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

An activity records an action and the entities involved. Each entity has a role:

<FeedExample :items="[scene.order]" />

The **actor** performs the action. The **verb** identifies the action. The
**object** is the entity acted on, and the **target** is the entity the action
is directed at.

> **{{ role.customer.label }}** *(actor)* **placed** *(verb)* **{{ scene.order.object.label }}** *(object)*
> with **{{ role.shop.label }}** *(target)*

<a id="different-ways-to-render-the-same-activity"></a>

### Different Headlines for the Same Activity

You may change an activity's headline without changing its recorded verb or
roles. Each example below uses the `place` verb:

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

After [installing Storyfeed](/guide/installation) and completing the
[Quickstart](/guide/quickstart), publish an activity where your application
places the order:

::: code-group
<<< @/snippets/publish.php {php memo="Where the order is placed: a controller, an action, a listener"} [Fluent Syntax]
<<< @/snippets/publish.named-arguments.php {php memo="Where the order is placed: a controller, an action, a listener"} [Named Arguments]
:::

<FeedExample :items="[scene.order]" />

<a id="examples-of-feeds"></a>

## Displaying Feeds

You may display the same activities in three modes. See
[Reading Feeds](/basics/reading) to select a mode.

### Live

Live mode is the default. It groups repeated actions and activities from
several actors with the same target into single rows.

<FeedExample :items="worldLive" days height="420" />

<a id="as-a-grouped-summary"></a>
<a id="aggregated-feeds"></a>

### Summary

Summary mode groups activities by actor and day, with one phrase per verb.
Actors with the same single activity may share a row.

<FeedExample :items="worldSummary" days height="420" />

<a id="as-a-timeline"></a>
<a id="timeline-feeds"></a>

### Log

Log mode displays each activity in a separate row.

<FeedExample :items="worldLog" days height="420" />
