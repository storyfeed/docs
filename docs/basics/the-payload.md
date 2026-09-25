# The Payload

<script setup>
import { scene, liveOf } from '../.vitepress/theme/world'

const repeated = liveOf(scene.guide.usageExamples.repeatOrders)[0]
const crowd = liveOf(scene.busyPlace)[0]
const paid = scene.basics.recording.paid
const note = scene.basics.activityContent.note
const quoted = { ...note,
  thread: { text: note.object.label, by: note.actor.label, kind: 'note', replies: null, truncated: false } }
const body = scene.basics.activityContent.ready
const photograph = scene.basics.activityContent.photo
</script>

## Introduction

Reading a feed returns one JSON document: the activities, newest first, with
everything a renderer needs to draw them. The response contains activity nodes and group nodes.

<a id="the-envelope"></a>

## The Response Envelope

Return the feed from a route:

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function () {
    return Storyfeed::feed()->get();
});
```

The response is the following JSON:

<FeedExample payload :items="[scene.order]" />

Your app sends `next_cursor` back to read the next page. See
[Reading Feeds](/basics/reading#pagination).

<a id="one-activity"></a>

## Activity Nodes

A customer places an order. Every key is always present:

<FeedExample expanded :items="[scene.order]" />

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

Several people, the same place:

<FeedExample expanded :items="[crowd]" />

A group fills a singular role only when the grouping axis fixes the role and the group
has exactly one entity in it. For
how many there are, read `distinct`; `sample` holds only a few.

### Digest Rows

`summary()` returns groups with `axis: "summary"`. A row carries its calendar
`period` and per-verb `phrases`, each with its own count and headline fields.
`phrases_truncated` says whether more phrases exist. A row spanning several
verbs has no row-level verb or glyph; draw its actor and join its phrases.

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
