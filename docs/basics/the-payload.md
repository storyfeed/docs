# The Payload

A read returns one JSON document, and that document is everything the package
produces. No HTML, no view names, no knowledge of your app beyond what you
recorded.

The feeds you have been looking at are that document, drawn. Here they are as
data: the same examples from [Usage Examples](/guide/usage-examples), dissected.

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

Two of those four keys are strings you store and hand back rather than read.
[Reading Feeds](/basics/reading#pagination) covers what to do with them.

## One Activity

A customer places an order. Nothing is elided here: every key a node carries
is present, because a renderer reads a missing value as `null` rather than as
an undefined index.

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
beside it fully described. Substituting one into the other is all a renderer
does, which is why it needs no knowledge of orders or kitchens.

Every node below is the same shape. Only the keys that carry the difference
are shown.

## Three in a Row

One customer, three orders, one line. A group node, not an activity:

```jsonc
{
  "kind": "group",
  "axis": "repeat",
  "count": 3,
  "verb": "placed",
  "headline_template": ":actor placed :count orders with :target",
  "actor": { "type": "user", "label": "Steve Harrington", … },  // one actor, so the key is filled
  "object": null,                                               // three of them
  "exemplars": {
    "actors": [ /* him */ ],
    "objects": [ /* up to three orders, to name */ ],
    "targets": [ /* the kitchen */ ]
  },
  "distinct": { "actors": 1, "objects": 3, "targets": 1 },
  "children": [ /* the three activity nodes */ ],
  "children_truncated": false
}
```

## A Crowd

Five customers, the same kitchen. The difference is one key:

```jsonc
{
  "axis": "actors",
  "count": 5,
  "headline_template": ":actors placed :count orders with :target",
  "actor": null,                       // five of them; there is no single answer
  "target": { /* the kitchen they share */ },
  "distinct": { "actors": 5, "objects": 5, "targets": 1 }
}
```

A group carries a singular role key only where it genuinely has one entity in
that role. `distinct` is the true total from the query, so it is what a
renderer counts with, never the length of the exemplar list it was handed.

## Someone Who Is Not a User

A payment provider marks an order paid. It is an ordinary entity with no page
of its own:

```jsonc
{
  "verb": "paid",
  "headline_template": ":actor marked :object paid",
  "actor": {
    "type": "storyfeed.party",
    "id": "1",
    "label": "Stripe",
    "url": null,                       // a party has nowhere to link
    "data": {},
    "media": null
  }
}
```

And when nobody acted at all, `actor` is `null` and the template never names
one.

## The Words Someone Wrote

```jsonc
{
  "verb": "noted",
  "headline_template": ":actor sent a note about :object",
  "thread": {
    "text": "Can I pick this up at six instead of seven?",
    "by": "Steve Harrington",
    "kind": "note",
    "replies": null,                   // null means nobody counted
    "truncated": false
  }
}
```

## A Form Inside `data`

A detail sits inside the app's own `data`, at a key the app chose, marked by
two reserved keys:

```jsonc
{
  "verb": "order.placed",
  "headline_template": ":actor placed :object with :target",
  "data": {
    "$body": "Storyfeed/Body/Excerpt",
    "$v": 1,
    "text": "Ring the bell twice, the gate sticks.",
    "from": "Instructions",
    "truncated": false
  }
}
```

`$v` travels all the way to the renderer, which upgrades the block before
drawing it. [What an Activity Shows](/basics/activity-content) covers the
forms.

## A Photograph

The picture is on the entity, minted at read time, never stored:

```jsonc
{
  "verb": "menu.photo_published",
  "headline_template": ":actor added a photo of :target",
  "object": {
    "type": "photo",
    "label": "chicken-curry.jpg",
    "url": "/media/chicken-curry.jpg",
    "media": {
      "icon": null,
      "image": null,
      "preview": {                     // the derivative a feed paints
        "src": "/media/chicken-curry-400.jpg",
        "mediaType": "image/jpeg",
        "width": 400,
        "height": 300,
        "alt": null
      },
      "url": {                         // the resource itself IS an image
        "src": "/media/chicken-curry.jpg",
        "mediaType": "image/jpeg",
        "width": 4032,
        "height": 3024,
        "alt": null
      }
    }
  }
}
```

## An Entity, in Every Role

| Key | Holds |
|---|---|
| `type` | the morph alias, as recorded |
| `id` | the entity's key, as a string |
| `label` | what `toFeed()` cached |
| `url` | minted at read time by `feedMedia()`, or null |
| `attributes` | anything the resolver attached to the link |
| `modal` | a hint that the link opens in place |
| `component` | a frontend component the app named |
| `data` | the app's own map, including any detail |
| `media` | the images the resolver minted, or null |

## What Is Not in It

No markup. No class names, no colours, no sizes. No translated strings: the
template is what your app registered, and substituting and translating are the
renderer's.

`component` is the one hint the payload carries, and it is a name your app
chose for its own renderer to resolve. The package neither ships nor validates
one.

[The Payload Contract](/reference/payload) is the exhaustive version: every
key, every type, and what may change.
