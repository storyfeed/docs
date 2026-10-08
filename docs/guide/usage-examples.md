# What You Can Build

These examples show the feed each feature produces. Follow the links to learn
how to build them.

<script setup>
import { scene, everything, logOf, liveOf } from '../.vitepress/theme/world'

const content = scene.basics.activityContent
const withKeyValue = { ...content.confirmed,
  object: { ...content.confirmed.object, body: [{ $body: 'Storyfeed/Body/KeyValue', $v: 2,
    title: content.confirmed.object.label, items: [
    { key: 'Pickup', value: '12:10 pm', verbatim: false, placeholder: null },
    { key: 'Items', value: '1', verbatim: false, placeholder: null },
    { key: 'Reference', value: content.confirmed.object.id, verbatim: true, placeholder: null },
  ] }] } }

const paidByWebhook = logOf([scene.cookbook.actorless.paid])
const orderStory = logOf(scene.deeper.latestPerObject.timeline)
const live = liveOf(everything())
</script>

<a id="one-activity"></a>
<a id="recording-activities"></a>
<a id="adding-activity-content"></a>
<a id="activities-with-content-previews"></a>

## Showing Content Previews

A [KeyValue body](/basics/activity-content#text-and-labelled-values) adds the
order's labelled pickup details below its headline.

<FeedExample :items="[withKeyValue]" />

<a id="actors-beyond-your-users"></a>

## Recording Services as Actors

A [named party](/deeper/parties#declaring-parties) records a payment service as
the actor when its webhook reports that an order was paid.

<FeedExample :items="paidByWebhook" />

## Filtering a Feed by Entity

An [entity filter](/basics/reading#filtering-by-entity-or-role) gathers the
activities involving one order into its own timeline.

<FeedExample :items="orderStory" />

<a id="grouping-activities"></a>
<a id="a-week-at-a-glance"></a>

## Grouping Busy Activity

[Live](/basics/reading#live) combines one action per row within a burst.
Several people acting on one thing take precedence over one person acting
across things in a place, followed by repeats.

<FeedExample :items="live" days height="420" />
