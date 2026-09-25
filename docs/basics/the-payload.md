# The Payload

<script setup>
import { scenes, who, where, orders, notes, party, photos, dishes, activity, group } from '../.vitepress/theme/samples'
import { INSTRUCTIONS } from '../.vitepress/theme/manifest'

const repeated = group({ id: 'payload-repeat', axis: 'repeat', verb: 'place', count: 3,
  published_at: scenes.order.published_at, glyph: 'shopping-bag',
  headline_template: ':actor placed :count orders with :target',
  actors: [who.regular], objects: [orders.first, orders.second, orders.third], targets: [where.kitchen],
  distinct: { actors: 1, objects: 3, targets: 1 } })
const crowd = group({ id: 'payload-crowd', axis: 'actors', verb: 'place', count: 5,
  published_at: scenes.order.published_at, glyph: 'shopping-bag',
  headline_template: ':actors ordered from :target',
  actors: [who.regular, who.customer2, who.customer3], objects: [orders.first, orders.second, orders.third],
  targets: [where.kitchen], distinct: { actors: 5, objects: 5, targets: 1 } })
const paid = activity({ ...scenes.order, id: 'payload-paid', verb: 'pay', actor: party.service,
  headline_template: ':actor marked :object paid', glyph: 'credit-card' })
const quoted = activity({ ...scenes.order, id: 'payload-quote', verb: 'note',
  headline_template: ':actor sent a note about :object', glyph: 'message-circle',
  thread: { text: notes.pickup.label, by: who.regular.label, kind: 'note', replies: null, truncated: false } })
const body = activity({ ...scenes.order, id: 'payload-body',
  object: { ...orders.first, body: [{ $body: 'Storyfeed/Body/Excerpt', $v: 1,
    text: INSTRUCTIONS.first, from: 'Instructions', truncated: false }] } })
const photograph = activity({ ...scenes.order, id: 'payload-photo', verb: 'publish', glyph: 'image',
  headline_template: ':actor added a photo of :target', actor: who.cook,
  object: photos.curry, target: dishes.chickenCurry })
</script>

## Introduction

Reading a feed returns one JSON document: the activities, newest first, with
everything a renderer needs to draw them. The response contains activity nodes and group nodes.

<a id="the-envelope"></a>

## The Response Envelope

Return the feed from a route:

```php
// routes/web.php
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function () {
    return Storyfeed::feed()->get();
});
```

The response is the following JSON:

<FeedExample payload :items="[scenes.order]" />

Your app sends `next_cursor` back to read the next page. See
[Reading Feeds](/basics/reading#pagination).

<a id="one-activity"></a>

## Activity Nodes

A customer places an order. Every key is always present:

<FeedExample expanded :items="[scenes.order]" />

A renderer puts the entities' labels into the sentence's tokens. Each example
below shows the complete node that draws it.

### Entity Fields

| Key | Holds |
|---|---|
| `type` | the morph alias, as recorded |
| `id` | the entity's key, as a string |
| `label` | the label the snapshot holds |
| `url` | resolved at read time by `feedMedia()`, or null |
| `attributes` | anything the resolver attached to the link |
| `modal` | a hint that the link opens in place |
| `data` | the app's own map |
| `media` | the images the resolver returned, or null |
| `body` | the entity's bodies, or null |
| `tombstone` | null, or what a [deleted model](/deeper/deleted-models) left behind |

<a id="activities-by-a-payment-provider"></a>

### Parties and Missing Actors

A payment provider marks an order paid:

<FeedExample expanded :items="[paid]" />

When nobody acted, `actor` is `null`.

## Group Nodes

A group represents several activities in one node.

### Repeated Activities

One customer, three orders, one group node:

<FeedExample expanded :items="[repeated]" />

<a id="activities-by-several-people"></a>

### Activities by Several Actors

Five customers, the same kitchen:

<FeedExample expanded :items="[crowd]" />

A group fills a singular role only when the grouping axis fixes the role and the group
has exactly one entity in it. For
how many there are, read `distinct`; `sample` holds only a few.

## Activity Content

### Quoted Text

<FeedExample expanded :items="[quoted]" />

### Entity Bodies

An entity's `body` list carries structured content. Each body names its type
and version with `$body` and `$v`.

<FeedExample expanded :items="[body]" />

<a id="a-photograph"></a>

### Media

The picture is on the entity:

<FeedExample expanded :items="[photograph]" />

<a id="data-and-presentation"></a>

## Presentation Values

Storyfeed supplies data rather than HTML. A headline declared with a translation
key is translated on read; its role tokens remain for the renderer to fill in.
