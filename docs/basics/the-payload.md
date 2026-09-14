# The Payload

A read returns one JSON document, and that document is everything the package
produces. No HTML, no view names, no knowledge of your app beyond what you
recorded. When you are done, you know exactly what a renderer receives.

<script setup>
import { who, where, orders, activity, group, scenes } from '../.vitepress/theme/samples'

const crowd = group({
  id: 'pl1', verb: 'placed', axis: 'actors', count: 5, glyph: 'shopping-bag',
  published_at: '2026-08-14T14:35:00.000000Z',
  headline_template: ':actors placed :count orders with :target',
  actors: [who.regular, who.customer2, who.customer3], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 5, objects: 5, targets: 1 },
})
</script>

## The Envelope

```php
// a controller, or wherever the feed is read
$page = Storyfeed::feed()->involving($kitchen)->get();
```

```jsonc
{
  "payload_version": 1,
  "items": [ /* newest first */ ],
  "next_cursor": "eyJ...",   // opaque; null at the end of the feed
  "sync_token": null         // opaque; changes when settled history is rewritten
}
```

Four keys, and two of them are strings you store and hand back rather than
read. [Reading Feeds](/basics/reading#pagination) covers what to do with them.

## One Activity

This row:

<FeedStream :items="[scenes.order]" :grouped="false" />

is this node:

```json
{
  "kind": "activity",
  "id": "01K3M8QF4T7Z2YB6N1D9V0XA5C",
  "verb": "placed",
  "published_at": "2026-08-14T14:30:00.000000Z",
  "headline_template": ":actor placed :object with :target",
  "headline": null,
  "glyph": "shopping-bag",
  "glyph_intent": null,
  "actor": {
    "type": "user",
    "id": "4",
    "label": "Steve Harrington",
    "url": "/users/4",
    "attributes": {},
    "modal": false,
    "component": null,
    "data": {},
    "media": null
  },
  "object": {
    "type": "order",
    "id": "1",
    "label": "Order #1042",
    "url": "/orders/1",
    "attributes": {},
    "modal": false,
    "component": null,
    "data": {},
    "media": null
  },
  "target": {
    "type": "kitchen",
    "id": "1",
    "label": "Nancy's Kitchen",
    "url": "/kitchens/1",
    "attributes": {},
    "modal": false,
    "component": null,
    "data": {},
    "media": null
  },
  "context": null,
  "data": {},
  "thread": null
}
```

The sentence arrives with its tokens still in it, and the entities arrive
beside it fully described: a type, a label, a link. Substituting one into the
other is all a renderer does, which is why it needs no knowledge of orders or
kitchens.

`headline` is the pre-rendered fallback, and it is null whenever
`headline_template` is set.

## An Entity

The same object appears in every role, and always in this shape:

| Key | Holds |
|---|---|
| `type` | the morph alias, as recorded |
| `id` | the entity's key, as a string |
| `label` | what `toFeed()` cached |
| `url` | minted at read time by `feedMedia()`, or null |
| `attributes` | anything the resolver attached to the link |
| `modal` | a hint that the link opens in place |
| `component` | a frontend component the app named |
| `data` | the app's own map, including any [detail](/basics/activity-content) |
| `media` | the images the resolver minted, or null |

Every key is always present. A renderer reads a missing value as `null`, never
as an undefined index.

## One Group

<FeedStream :items="[crowd]" :grouped="false" />

```jsonc
{
  "kind": "group",
  "id": "grp_01K3M8QF4T7Z2YB6N1D9V0XA5C",
  "axis": "actors",
  "count": 5,
  "verb": "placed",
  "published_at": "2026-08-14T14:35:00.000000Z",
  "headline_template": ":actors placed :count orders with :target",
  "headline": null,
  "glyph": "shopping-bag",
  "glyph_intent": null,
  "target": { /* the one kitchen they share */ },
  "actor": null,                       // five of them; there is no single answer
  "exemplars": {
    "actors": [ /* up to three, to name */ ],
    "objects": [ /* up to three */ ],
    "targets": [ /* the shared kitchen */ ]
  },
  "distinct": { "actors": 5, "objects": 5, "targets": 1 },
  "children": [ /* member activity nodes, newest first */ ],
  "children_truncated": false
}
```

A group carries a singular role key only where the group genuinely has one
entity in that role, and `null` everywhere else, because there is no single
answer to give. `distinct` is the true total from the query, so it is what a
renderer counts with — not the length of the exemplar list it was handed.

## What Is Not in It

No markup. No class names, no colours, no sizes. No translated strings: the
template is what your app registered, and substituting and translating are the
renderer's.

`component` is the one hint the payload carries, and it is a name your app
chose for its own renderer to resolve. The package neither ships nor validates
one.

[The Payload Contract](/reference/payload) is the exhaustive version: every
key, every type, and what may change.
