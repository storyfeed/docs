# The Payload

<script setup>
import { scenes } from '../.vitepress/theme/samples'
</script>

Reading a feed returns one JSON document: the activities, newest first, each
with everything a renderer needs to draw it. The package produces nothing else.
Below are the examples from [Usage Examples](/guide/usage-examples) as that
JSON.

## The Envelope

Return the feed from a route:

```php
// routes/web.php
Route::get('/', function () {
    return Storyfeed::feed()->get();
});
```

The response is the following JSON:

<FeedExample payload :items="[scenes.order]" />

`next_cursor` and `sync_token` are opaque: your app stores them and sends them
back on the next read. [Reading Feeds](/basics/reading#pagination) covers both.

## One Activity

A customer places an order. Every key a node carries is always present:

<FeedExample expanded :items="[scenes.order]" />

The sentence arrives with its tokens in it and the entities beside it. A
renderer substitutes the labels into the sentence. The nodes below have the
same shape and show only the keys that differ.

## Three in a Row

One customer, three orders, one group node:

```jsonc
{
  "kind": "group",
  "axis": "repeat",
  "count": 3,
  "verb": "place",
  "headline_template": ":actor placed :count orders with :target",
  "actor": { "type": "user", "label": "Steve Harrington", … },  // one actor, so the key is filled
  "object": null,                                               // three of them
  "sample": {
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

Five customers, the same kitchen:

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

A group fills a singular role key only when that role has one entity. To say
how many entities a group holds, use `distinct`, which is the true total; the
`sample` lists hold only a few.

## Someone Who Is Not a User

A payment provider marks an order paid:

```jsonc
{
  "verb": "pay",
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

When nobody acted, `actor` is `null` and the template names no actor.

## The Words Someone Wrote

```jsonc
{
  "verb": "note",
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

A detail sits in the app's own `data`, marked by two reserved keys:

```jsonc
{
  "verb": "place",
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

The renderer upgrades the block by `$v` before drawing it.
[What an Activity Shows](/basics/activity-content) covers the forms.

## A Photograph

The picture is on the entity, minted at read time:

```jsonc
{
  "verb": "publish",
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

No markup, class names, colours, sizes or translated strings. Substituting and
translating the template are the renderer's job. `component` is a name your
app chose for its own renderer to resolve; the package neither ships nor
validates one.

Every key and type: [The Payload Contract](/reference/payload).
