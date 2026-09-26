# The Payload

<script setup>
import { scene, liveOf } from '../.vitepress/theme/world'

const repeated = liveOf(scene.guide.usageExamples.repeatOrders)[0]
</script>

## Introduction

The feed payload is a JSON document containing activity and group items,
ordered newest first. See [The Payload Contract](/reference/payload) for all fields.

<a id="the-envelope"></a>

## The Response Envelope

A page containing one activity has this payload:

<FeedExample payload :items="[scene.order]" />

Pass `next_cursor` to retrieve the next page. See
[Reading Feeds](/basics/reading#pagination) for pagination and
[Response Envelope](/reference/payload#response-envelope) for all response fields.

<a id="one-activity"></a>

## Activity Items {#activity-nodes}

The following item represents a customer placing an order:

<FeedExample expanded :items="[scene.order]" />

<a id="entity-fields"></a>
<a id="activities-by-a-payment-provider"></a>
<a id="parties-and-missing-actors"></a>

Each role contains an entity with fields such as `type`, `id`, `label`, and
`url`. See [Entities](/reference/payload#entities) for the complete structure.
An empty role is `null`. An anonymous activity has no recorded actor, so its
`actor` is `null`.

<a id="group-nodes"></a>

## Group Items {#group-nodes}

A [group](/basics/reading#groups) represents several activities in one item.
This example groups three orders placed by one customer:

<FeedExample expanded :items="[repeated]" />

<a id="repeated-activities"></a>
<a id="activities-by-several-people"></a>
<a id="activities-by-several-actors"></a>
<a id="digest-rows"></a>

The `count` field contains the activity count. The `distinct` field counts
entities in each role, while `sample` contains a limited selection. Summary
items use `axis: "summary"` and include per-verb phrases. See
[Group Items](/reference/payload#group-nodes) for the fields.

<a id="activity-content"></a>
<a id="quoted-text"></a>
<a id="entity-bodies"></a>
<a id="a-photograph"></a>
<a id="media"></a>
<a id="data-and-presentation"></a>
<a id="presentation-values"></a>

These items also contain quoted text, bodies, and images. See
[Activity Content](/basics/activity-content) for their payloads and
[Rendering](/basics/rendering) to display them.
