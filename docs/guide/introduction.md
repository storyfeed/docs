# Introduction

Storyfeed is an implementation of the activity feed pattern in Laravel.
Activities are recorded explicitly, displayed as a log, a live feed or a
summary, and serialized following
[W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/).

<script setup>
// Node-shaped examples: the same shape `Storyfeed::feed()->get()` returns, so the
// widgets below are the demo app's real renderer reading a real payload rather
// than a diagram of one. Every row comes from the Hawkins catalogue (world.ts),
// and the site's clock is its present: the Fourth of July, 1985, evening.
import { cast, venues, fare, things, tasks, pick, logOf, liveOf, summaryOf } from '../.vitepress/theme/world'

// Section 2 reuses one activity from the catalogue, so the roles arrive on a
// sentence the reader has already read.
const [placed, asked] = pick(['j84', 'j85'])
const oneActivity = [asked, placed]

// One fact, three headlines: the verb stays `place`; only the wording moves.
const sameFact = [
  ':actor sent :object to :target',
  'A new order, :object, came in to :target from :actor',
  ':target received :object from :actor',
].map((headline_template, i) => ({ ...placed, id: `h${i}`, headline_template }))

// The same shape in other apps, same cast: a task tracker, a code host,
// billing, e-signature, a support desk, a team.
const otherApps = pick(['j65', 'j75', 'k22', 'j01', 'j51', 'j89'])

// A few days in Hawkins, one or two moments per place, and one from further
// back. The three feeds below are COMPUTED from these rows, so a group's count
// is always the rows it stands for. The long feeds are later in the docs.
const worldLog = logOf(pick([
  'k42', 'k38', 'k35', 'k34', 'k33', 'k31', 'k22', // today: the Fun Fair
  'k09', 'k03',                                    // yesterday
  'j42', 'j37', 'j36', 'j31',                      // Saturday: Weathertop
  'w10',                                           // October 1984
]))
const worldLive = liveOf(worldLog)
const worldSummary = summaryOf(worldLog)
</script>

<a id="what-is-an-activity"></a>

## Activities

An activity is a recorded fact, shaped like a sentence with named roles:

<FeedExample :items="[oneActivity[1]]" />

The **actor** is who did it. The **verb** is what happened. The **object** is
what it was done to, and the **target** is what it was aimed at.

> **{{ cast.scout.label }}** *(actor)* **placed** *(verb)* **{{ placed.object.label }}** *(object)*
> with **{{ venues.scoops.label }}** *(target)*

**{{ cast.scout.label }}** is the party that initiated the **placing** of **{{ placed.object.label }}**, with **{{ venues.scoops.label }}**.

### Different Ways to Render the Same Activity

The summary headline of the activity may take different forms, but the underlying fact is always the same.

<FeedExample :items="[sameFact[0]]">

**{{ cast.scout.label }}** *(actor)* **sent** *(verb)* **{{ placed.object.label }}** *(object)* to **{{ venues.scoops.label }}** *(target)*

</FeedExample>

<FeedExample :items="[sameFact[1]]">

A new order, **{{ placed.object.label }}** *(object)*, **came in** *(verb)* to **{{ venues.scoops.label }}** *(target)* from **{{ cast.scout.label }}** *(actor)*

</FeedExample>

<FeedExample :items="[sameFact[2]]">

**{{ venues.scoops.label }}** *(target)* **received** *(verb)* **{{ placed.object.label }}** *(object)* from **{{ cast.scout.label }}** *(actor)*

</FeedExample>


<a id="examples-of-activities"></a>

### Other Examples

<FeedExample :items="[oneActivity[0]]">

**{{ cast.scout.label }}** *(actor)* **asked** *(verb)* about **{{ fare.butterscotch.label }}** *(target)*

</FeedExample>

<FeedExample :items="[otherApps[0]]">

**{{ cast.linguist.label }}** *(actor)* **completed** *(verb)* **{{ tasks.crack.label }}** *(object)* on **{{ things.board.label }}** *(target)*

</FeedExample>

<FeedExample :items="[otherApps[1]]">

**{{ cast.radio.label }}** *(actor)* **merged** *(verb)* **{{ otherApps[1].object.label }}** *(object)* into **{{ things.repo.label }}** *(target)*

</FeedExample>

<FeedExample :items="[otherApps[2]]">

**{{ otherApps[2].actor.label }}** *(actor)* **marked** **{{ otherApps[2].object.label }}** *(object)* **paid** *(verb)*

</FeedExample>

<FeedExample :items="[otherApps[3]]">

**{{ cast.scooper.label }}** *(actor)* **signed** *(verb)* **{{ things.contract.label }}** *(object)*

</FeedExample>

<FeedExample :items="[otherApps[4]]">

**{{ cast.clerk.label }}** *(actor)* **assigned** *(verb)* **{{ otherApps[4].object.label }}** *(object)* to **{{ cast.teacher.label }}** *(target)*

</FeedExample>

<FeedExample :items="[otherApps[5]]">

**{{ cast.scout.label }}** *(actor)* **joined** *(verb)* **{{ things.troop.label }}** *(target)*

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
