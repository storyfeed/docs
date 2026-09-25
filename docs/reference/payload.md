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

Empty PHP maps such as `data` and `attributes` serialize as `[]`; populated
string-keyed maps serialize as JSON objects.

## Entity Object

Every role (`actor`, `object`, `target`, `context`, `origin`, `result`, `instrument`) is `null` or:

```jsonc
{
  // morph alias, never a class name
  "type": "delivery",
  // string-cast
  "id": "42",
  // snapshot label, or the resolver's; null ⇒ degraded (no snapshot yet)
  "label": "Delivery #1042",
  // resolved at read time; null ⇒ not linkable
  "url": "https://…/deliveries/1042",
  // link attributes, e.g. {"target": "_blank"}
  "attributes": {},
  // hint: open as a modal
  "modal": false,
  // snapshot data
  "data": {},
  // live image slots and optional attachment
  "media": null,
  // a list of bodies, or null when there are none
  "body": null,
  // null, or what a deleted entity left behind
  "tombstone": null
}
```

`url`, `attributes`, `modal` and `media` come from the model's static
resolver, `Feedable::feedMedia(FeedContext): ?FeedMedia`, called at read time
with the snapshot. `type`, `id`, `data` and `label` come from the snapshot;
the resolver can override `label`. `body` lists the stored bodies, then the
resolver's; each is a map naming its body type in `$body`
([Activity Body Content](/deeper/body#existing-body-types)).
[Feedable API](/reference/feedable#feedcontext) covers the resolver.

`FeedEntity` also accepts `content` (authored text), `mediaType` (its encoding),
and `attributedTo` (the author’s IRI). These snapshot keys appear only when
non-null; an empty `content` string is preserved.

### Tombstoned Entities

A deleted model's activities stay, and each reference to it points at a
tombstone. [Deleted Models](/deeper/deleted-models) covers when that happens.

```jsonc
"object": {
  // always this alias
  "type": "storyfeed.tombstone",
  // the tombstone's key, not the deleted model's
  "id": "17",
  // null, unless the model kept its label
  "label": null,
  // always null
  "url": null,
  "attributes": {},
  "modal": false,
  "data": {},
  "media": null,
  "body": null,
  "tombstone": {
    // the deleted model's morph alias
    "formerType": "order",
    // ISO 8601, or null when unknown
    "deleted": "2026-09-23T12:00:00.000000Z",
    // true when the trickle found the deletion
    "approximate": false,
    // reserved; always null
    "removedBy": null
  }
}
```

An entity is in one of three states:

| State | Shape |
|---|---|
| Anonymous | the role is `null` |
| Degraded | the model's own `type`, `label: null`, `url: null`, `tombstone: null` |
| Tombstoned | `type: "storyfeed.tombstone"`, `url: null`, `tombstone: {…}` |

When `approximate` is true, `deleted` is when the trickle found the deletion,
not when it happened. The headline, glyph and intent of an activity whose
object is a tombstone resolve with `formerType`, so `order.place` still
applies.

### Entity Media

```jsonc
"media": {
  // small, representational, ~32×32, 1:1: an avatar, a logo
  "icon": null,
  // a larger visual representation of a NON-image resource
  "image": null,
  // a preview of the resource: the dense-feed thumbnail
  "preview": {
    "src": "https://…/photos/88/thumb.jpg",
    "mediaType": "image/jpeg",
    // int, or null when unknown; never 0
    "width": 400,
    "height": 300,
    // optional alt text; null is preserved
    "alt": null
  },
  // the resource itself is an image; describes what `entity.url` points at
  "url": {
    // always equal to `entity.url`
    "src": "https://…/photos/88/full.jpg",
    "mediaType": "image/jpeg",
    "width": 4032,
    "height": 3024,
    "alt": "Pad thai, table 4"
  },
  "attachments": []
}
```

| Value | Meaning |
|---|---|
| `media: null` | the entity has no media; the common case |
| `media: {…}` | all four image keys present, each an image object or `null`, plus `attachments` (an empty list when none) |
| `media.url !== null` | the thing behind `entity.url` is an image |
| `width`, `height` | advisory, for reserving the box before the bytes arrive; `null` when unknown, never `0` |

`entity.url` stays a string. When the resolver typed it as an image, `media.url`
carries the same location again with its `mediaType`, `width` and `height`.
The four keys are Activity Streams 2.0 property names with AS2's definitions:
a photo is `url` (the full image) plus `preview` (the derivative a list paints).
A group's `sample` entities are ordinary entity objects and carry `media` the same way.

`attachments` is a list of resources carrying `type`, `href`, `mediaType`,
and `name` from `FeedResource`. Each resource defaults to type `Document`.

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
  // public ULID (uid), not the internal PK
  "id": "01J1K2M3N4P5Q6R7S8T9V0W1X2",
  "verb": "confirm",
  "published_at": "2026-08-10T14:03:22Z",
  "headline_template": ":actor confirmed :object for :target",
  // pre-rendered fallback; see below
  "headline": null,
  "glyph": "circle-check",
  // the app's own word for what the glyph means
  "glyph_intent": null,
  "actor": { /* entity */ },
  "object": { /* entity */ },
  "target": { /* entity or null */ },
  "context": { /* entity or null */ },
  "origin": { /* entity or null */ },
  "result": { /* entity or null */ },
  "instrument": { /* entity or null */ },
  "data": {},
  // optional FeedThread conversation metadata
  "thread": null,
  // optional FeedChange before/after facts
  "change": null,
  // the roles holding a tombstone, in role order
  "tombstoned": [],
  // one of them is a role the verb is about
  "redundant": false,
  // the verb's reading once redundant
  "missing_headline_template": null,
  // the same, pre-rendered
  "missing_headline": null
}
```

| Key | Holds |
|---|---|
| `tombstoned` | the roles (`"object"`, `"target"`, …) whose entity is a tombstone; `[]` when none |
| `redundant` | `true` when one of those roles is a role the verb is about: the object by default, none for a removal verb, or what the verb's `->missing()` names |
| `missing_headline_template` | the verb's [`->missingHeadline()`](/deeper/deleted-models#headlines-for-deleted-objects), when `redundant` is `true` and the verb declares one; otherwise `null`. `headline_template` keeps its value either way |
| `missing_headline` | the pre-rendered fallback for a closure-authored `->missingHeadline()`, as `headline` is for `headline_template`; otherwise `null` |

Storyfeed gives the facts, never its own wording. `redundant` is the fact that
the activity's news is gone while the activity is still true as history, and
`missing_headline_template` is the app's own sentence for it, when the verb
declares one. A renderer may show either reading.

## Group Node

```jsonc
{
  "kind": "group",
  // stable within its window
  "id": "grp_01J1K2…",
  // unknown values: render as a generic group
  "axis": "actors",
  // true total members
  "count": 5,
  "verb": "place",
  // max of members; the sort key
  "published_at": "2026-08-10T14:03:22Z",
  "headline_template": ":actors ordered from :target",
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
  // every role is a LIST
  "sample": {
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
  "children_truncated": false,
  // roles with a tombstone among the distinct entities
  "tombstoned": [],
  // true when every member is redundant
  "redundant": false,
  // per role, how many distinct entities are tombstones
  "distinct_tombstoned": {
    "actors": 0, "objects": 0, "targets": 0, "contexts": 0,
    "origins": 0, "results": 0, "instruments": 0
  }
}
```

| Key | Holds |
|---|---|
| `sample` | distinct entities per role, limited by `grouping.sample_limits` (default three) and the loaded members; live ones before tombstoned ones |
| `distinct` | per role, the true count of distinct entities across all members |
| `tombstoned` | the roles with at least one tombstone among their distinct entities |
| `redundant` | `true` only when every member is redundant |
| `distinct_tombstoned` | per role, how many of the `distinct` entities are tombstones |

Each singular role key is an entity only when the axis pins the role, its
sample list has exactly one entry, and its distinct count is exactly one.
Otherwise it is `null`. Each plural role has a limited sample list
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
See [what a glyph means](/basics/rendering#glyphs-and-intents).

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
[Rendering](/basics/rendering#groups-without-headlines).

Token availability per axis is in
[Aggregation](/deeper/aggregation). Authored aggregate grammar uses the axis’s
pinned roles; the [singular fallback](/deeper/aggregation#group-headline-tokens) can also
keep a role token when the group contains exactly one distinct entity.

Noun substitution can change the emitted template even for the same grammar
key, so cache rendered headlines per node, not per grammar key.

## Cursor Semantics

- Opaque. Store and return them; they are not parseable.
- Ordered by `published_at`, newest first.
- `next_cursor: null` means the end.

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
