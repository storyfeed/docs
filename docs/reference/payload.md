# The Payload Contract

The JSON a feed returns, payload **v1**. Every item arrives fully described, so
a renderer needs no knowledge of your domain.

## Envelope

```jsonc
{
  "payload_version": 1,
  "items": [ /* activity nodes and group nodes, newest first */ ],
  "next_cursor": "eyJ...",   // opaque string, or null at end of feed
  "sync_token": "01J3…",     // opaque string, or null
  "prev_cursor": null        // reserved, always null in v1
}
```

## Entity Object

Every role (`actor`, `object`, `target`, `context`, `origin`, `result`, `instrument`) is `null` or:

```jsonc
{
  "type": "delivery",                  // morph alias, never a class name
  "id": "42",                          // string-cast
  "label": "Delivery #1042",           // snapshot label, or the resolver's; null ⇒ degraded (no snapshot yet)
  "url": "https://…/deliveries/1042",  // minted at read time; null ⇒ not linkable
  "attributes": {},                    // link attributes, e.g. {"target": "_blank"}
  "modal": false,                      // hint: open as a modal
  "component": null,                   // backend-named body component
  "data": {},                          // snapshot data
  "media": null                        // live image slots and optional attachment
}
```

`url`, `attributes`, `modal` and `media` come from the model's static
resolver, `Feedable::feedMedia(FeedContext): ?FeedMedia`, called at read time
with the snapshot. `type`, `id`, `component`, `data` and `label` come from the
snapshot; the resolver can override `label`.
[Feedable API](/reference/feedable#feedcontext) covers the resolver.

`FeedEntity` also accepts `content` (authored text), `mediaType` (its encoding),
and `attributedTo` (the author’s IRI). These snapshot keys appear only when
non-null; an empty `content` string is preserved.

### Entity Media

```jsonc
"media": {
  "icon":    null,                       // small, representational, ~32×32, 1:1: an avatar, a logo
  "image":   null,                       // a larger visual representation of a NON-image resource
  "preview": {                           // a preview of the resource: the dense-feed thumbnail
    "src": "https://…/photos/88/thumb.jpg",
    "mediaType": "image/jpeg",
    "width": 400,                        // int, or null when unknown; never 0
    "height": 300,
    "alt": null                          // optional alt text; null is preserved
  },
  "url": {                               // the resource itself is an image; describes what `entity.url` points at
    "src": "https://…/photos/88/full.jpg",   // always equal to `entity.url`
    "mediaType": "image/jpeg",
    "width": 4032,
    "height": 3024,
    "alt": "Pad thai, table 4"
  }
}
```

| Value | Meaning |
|---|---|
| `media: null` | the entity has no media; the common case |
| `media: {…}` | all four image keys present, each an image object or `null`, plus `attachment` when set |
| `media.url !== null` | the thing behind `entity.url` is an image |
| `width`, `height` | advisory, for reserving the box before the bytes arrive; `null` when unknown, never `0` |

`entity.url` stays a string. When the resolver typed it as an image, `media.url`
carries the same location again with its `mediaType`, `width` and `height`.
The four keys are Activity Streams 2.0 property names with AS2's definitions:
a photo is `url` (the full image) plus `preview` (the derivative a list paints).
A group's `sample` entities are ordinary entity objects and carry `media` the same way.

An optional `attachment` carries `type`, `href`, `mediaType`,
and `name` from `FeedResource`. Its default type is `Document`.

### One Payload, One Feed

The resolver's context names the feed being read, so one snapshot can resolve
to a different URL on each feed. The name comes from the feed registry, never
from the request. A kitchen feed can carry a signed operational link that the
customer feed never shows.

A node does not say which feed produced it, so anything that stores or forwards
a payload must key it by feed. A cache keyed only by cursor, a digest that
reuses one feed's page for another audience, or a renderer that memoises
entities across feeds by `type:id` shows one feed's links to another feed's
audience.

## Activity Node

```jsonc
{
  "kind": "activity",
  "id": "01J1K2M3N4P5Q6R7S8T9V0W1X2",  // public ULID (uid), not the internal PK
  "verb": "confirm",
  "published_at": "2026-08-10T14:03:22Z",
  "headline_template": ":actor confirmed :object for :target",
  "headline": null,                     // pre-rendered fallback; see below
  "glyph": "circle-check",
  "glyph_intent": null,                 // the app's own word for what the glyph means
  "actor": { /* entity */ },
  "object": { /* entity */ },
  "target": { /* entity or null */ },
  "context": { /* entity or null */ },
  "origin": { /* entity or null */ },
  "result": { /* entity or null */ },
  "instrument": { /* entity or null */ },
  "data": {},
  "thread": null,                      // optional FeedThread conversation metadata
  "change": null                       // optional FeedChange before/after facts
}
```

## Group Node

```jsonc
{
  "kind": "group",
  "id": "grp_01J1K2…",                 // stable within its window
  "axis": "actors",                     // unknown values: render as a generic group
  "count": 5,                           // true total members
  "verb": "place",
  "published_at": "2026-08-10T14:03:22Z",  // max of members; the sort key
  "headline_template": ":actors placed :count orders with :target",
  "headline": null,
  "glyph": "shopping-bag",
  "glyph_intent": null,
  "actor": null,
  "object": null,
  "target": { /* the shared target entity */ },
  "context": null,
  "origin": null,
  "result": null,
  "instrument": null,
  "sample": {                           // every role is a LIST
    "actors": [ /* up to 3 entities */ ],
    "objects": [ /* up to 3 entities */ ],
    "targets": [ /* the shared target entity */ ],
    "contexts": [ /* one context entity */ ],
    "origins": [],
    "results": [],
    "instruments": []
  },
  "distinct": {
    "actors": 5, "objects": 3, "targets": 1, "contexts": 1,
    "origins": 0, "results": 0, "instruments": 0
  },
  "children": [ /* member activity nodes, newest first, possibly truncated */ ],
  "children_truncated": false
}
```

Each singular role key is an entity only when the axis pins the role, its
sample list has exactly one entry, and its distinct count is exactly one.
Otherwise it is `null`. Each plural role has a sample list capped at three
and a distinct count; an absent role has `[]` and `0`.

A renderer can rely on the group node's shape, but not on which groups appear:
the axes, thresholds and windows that decide them are server-side and can
change.

## Glyphs

`glyph` is a token naming an icon — the app's own name, resolved from the icon
registry. The package ships no icon set, and an unresolved pair is `null`.

`glyph_intent` is a second token beside it, from a registry of its own, saying
what that glyph means: `"success"`, `"danger"`, whatever word the app chose.
Like the verb it is free-form: no vocabulary is shipped or validated, and any
string passes through. It is `null` for every pair with no registered intent.
See [what a glyph means](/basics/headlines#what-a-glyph-means).

Both resolve on the same ladder and independently of each other:
`type.verb`, `type.*`, `*.verb`, `*.*`.

The Activity Streams 2.0 document carries neither: AS2 has no term for an icon
token, and `icon` there is an image on the entity.

## Headlines

Render from `headline_template`: tokenize it and substitute. `headline` is the
pre-rendered fallback for closure-authored grammar, and is null whenever the
template is non-null, so a test should not assert a non-null `headline`.

Both are null on a group node when no sentence is true of the whole group.
Renderers **must** handle it; see
[Rendering](/basics/rendering#a-group-with-no-sentence).

Token availability per axis is in
[Aggregation](/deeper/aggregation). Authored aggregate grammar uses the axis’s
pinned roles; the [singular fallback](/deeper/grammar#tokens-a-group-headline-may-use) can also
keep a role token when the group contains exactly one distinct entity.

Noun substitution can change the emitted template even for the same grammar
key, so cache rendered headlines per node, not per grammar key.

## Cursor Semantics

- Opaque. Store and return them; they are not parseable.
- Ordered by `published_at`, newest first.
- **An empty `items` array is not the end of the feed.** Only a null
  `next_cursor` is. Follow while empty, bounded to a small hop count (five is a
  reasonable bound).

## Sync Token

Cursor-grained and opaque. Store it; when a later page's token differs, settled
history was rewritten server-side — drop **all** accumulated nodes and refetch
from the head. Compare for equality only; `null → non-null` is a change.

This rule also applies when [`storyfeed:curate --rehash`](/reference/commands#rehashing-existing-rows)
moves a group past a live cursor and the next page is empty. Check the token
before treating that response as the end of the feed. A client that ignores a
changed token does not conform to the payload contract.

## Degraded Entities

An entity with no snapshot is not omitted, and neither is its activity. It
arrives with `label: null`, `url: null` and `media: null`, because the resolver
is not called without a snapshot. A throwing `feedMedia()` gives `url: null`
and `media: null`, and the exception is reported server-side.
