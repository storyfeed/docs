# The Payload

<script setup>
import { scene, liveOf } from '../.vitepress/theme/world'

const repeated = liveOf(scene.guide.usageExamples.repeatOrders)[0]
</script>

## Introduction

Reading a feed returns one JSON document: the activities, newest first, with
everything a renderer needs to draw them. The response contains activity nodes
and group nodes. [The Payload Contract](/reference/payload) lists every key.

<a id="the-envelope"></a>

## The Response Envelope

A page of the feed holding one activity is the following JSON:

<FeedExample payload :items="[scene.order]" />

Your app sends `next_cursor` back to read the next page. See
[Reading Feeds](/basics/reading#pagination), and the
[Response Envelope](/reference/payload#response-envelope) for every key.

<a id="one-activity"></a>

## Activity Nodes

A customer places an order. Every key is always present:

<FeedExample expanded :items="[scene.order]" />

<a id="entity-fields"></a>
<a id="activities-by-a-payment-provider"></a>
<a id="parties-and-missing-actors"></a>

Each role holds an entity: its `type`, `id`, `label`, `url` and the rest of
the fields [Entities](/reference/payload#entities) lists. A role nobody filled
is `null`; when nobody acted, `actor` is `null`.

<a id="group-nodes"></a>

## Group Nodes

A [group](/basics/reading#groups) represents several activities in one node.
One customer, three orders, one group node:

<FeedExample expanded :items="[repeated]" />

<a id="repeated-activities"></a>
<a id="activities-by-several-people"></a>
<a id="activities-by-several-actors"></a>
<a id="digest-rows"></a>

`count` says how many activities the group holds. For how many entities fill a
role, read `distinct`; `sample` holds only a few. A `summary()` row is a group
with `axis: "summary"` and one phrase per verb.
[Group Nodes](/reference/payload#group-nodes) lists every key.

<a id="activity-content"></a>
<a id="quoted-text"></a>
<a id="entity-bodies"></a>
<a id="a-photograph"></a>
<a id="media"></a>
<a id="data-and-presentation"></a>
<a id="presentation-values"></a>

Quoted text, bodies and pictures arrive in the same nodes;
[Activity Content](/basics/activity-content) shows each one with its payload.
[Rendering](/basics/rendering) draws them.
