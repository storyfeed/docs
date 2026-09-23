# The Payload

<script setup>
import { scenes } from '../.vitepress/theme/samples'
</script>

Reading a feed returns one JSON document: the activities, newest first, with
everything a renderer needs to draw them. Here are the
[Usage Examples](/guide/usage-examples) as that JSON.

## The Envelope

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

## One Activity

A customer places an order. Every key is always present:

<FeedExample expanded :items="[scenes.order]" />

A renderer puts the entities' labels into the sentence's tokens. The nodes
below show only the keys that differ.

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
  "headline_template": ":actors ordered from :target",
  "actor": null,                       // five of them; there is no single answer
  "target": { /* the kitchen they share */ },
  "distinct": { "actors": 5, "objects": 5, "targets": 1 }
}
```

A group fills a role key like `actor` only when that role has one entity. For
how many there are, read `distinct`; `sample` holds only a few.

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

When nobody acted, `actor` is `null`.

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

## A Body Inside `data`

A body sits in the app's own `data`, marked by two reserved keys:

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

[What an Activity Shows](/basics/activity-content) covers these forms.

## A Photograph

The picture is on the entity:

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
| `label` | the label the snapshot holds |
| `url` | resolved at read time by `feedMedia()`, or null |
| `attributes` | anything the resolver attached to the link |
| `modal` | a hint that the link opens in place |
| `data` | the app's own map |
| `media` | the images the resolver returned, or null |
| `body` | the entity's bodies, or null |
| `tombstone` | null, or what a [deleted model](/deeper/deleted-models) left behind |

## What Is Not in It

No markup, class names, colours, sizes or translated strings. Filling in and
translating the headline are the renderer's job.

Every key and type: [The Payload Contract](/reference/payload).
