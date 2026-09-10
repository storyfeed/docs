# The payload contract

Payload **v1**. Every item arrives fully described, so a renderer holds zero
domain knowledge. The payload is versioned independently of the package: no
breaking changes within a payload major; new majors are additive new
serializers with the old ones maintained.

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

## Entity object

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
with the snapshot. `label` comes from the snapshot unless the resolver supplies
an override. `type`, `id`, `component` and `data` come from the snapshot.
[Feedable models](/basics/feedable-models#snapshots-and-media) covers the resolver.

`FeedEntity` also accepts `content` (authored text), `mediaType` (its encoding),
and `attributedTo` (the author’s IRI). These snapshot keys appear only when
non-null; an empty `content` string is preserved.

### Entity media

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

| value | meaning |
|---|---|
| `media: null` | the entity has no media; the common case |
| `media: {…}` | all four image keys present, each an image object or `null`, plus `attachment` when set |
| `media.url !== null` | the thing behind `entity.url` is an image |
| `width`, `height` | advisory, for reserving the box before the bytes arrive; `null` when unknown, never `0` |

`entity.url` stays a string. When the resolver typed it as an image, `media.url`
carries the same location again with its `mediaType`, `width` and `height`.
The four keys are Activity Streams 2.0 property names with AS2's definitions:
a photo is `url` (the full image) plus `preview` (the derivative a list paints).
Group `exemplars` are ordinary entity objects and carry `media` the same way.

An optional `attachment` carries `type`, `href`, `mediaType`,
and `name` from `FeedResource`. Its default type is `Document`.

### One payload, one feed

A resolver's URL is authority for the feed named in its context and for no
other. The name is declared by the feed registry, never read from the request,
so the same snapshot resolves differently on each surface and neither payload
carries the other's URL. A kitchen feed may carry a signed operational link
that must never appear on the customer feed.

That guarantee ends at the payload boundary, and the node does not say which
feed minted it. Anything that stores or forwards a payload keys it by feed:
a cache keyed only by cursor, a digest that reuses one feed's page for another
audience, or a renderer that memoises entities across feeds by `type:id` serves
one feed's authority to another's audience.

## Activity node

```jsonc
{
  "kind": "activity",
  "id": "01J1K2M3N4P5Q6R7S8T9V0W1X2",  // public ULID (uid), not the internal PK
  "verb": "confirm",
  "published_at": "2026-08-10T14:03:22Z",
  "headline_template": ":actor confirmed :object for :target",
  "headline": null,                     // pre-rendered fallback; see below
  "glyph": "file-check",
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

## Group node

```jsonc
{
  "kind": "group",
  "id": "grp_01J1K2…",                 // stable within its window
  "axis": "actors",                     // unknown values: render as a generic group
  "count": 5,                           // true total members
  "verb": "upload",
  "published_at": "2026-08-10T14:03:22Z",  // max of members; the sort key
  "headline_template": ":actors uploaded :count files to :target",
  "headline": null,
  "glyph": "file-up",
  "actor": null,
  "object": null,
  "target": { /* the shared target entity */ },
  "context": null,
  "origin": null,
  "result": null,
  "instrument": null,
  "exemplars": {                        // every role is a LIST
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
exemplar list has exactly one entry, and its distinct count is exactly one.
Otherwise it is `null`. Each plural role has an exemplar list capped at three
and a distinct count; an absent role has `[]` and `0`.

The group node *shape* is frozen contract. The *curation policy* deciding which
groups exist (axes, thresholds, windows) is a server-side detail and free to
change, so a renderer can rely on the shape but not on which groups appear.

## Headlines

`headline_template` is primary; tokenize and substitute. `headline` is the
pre-rendered fallback for closure-authored grammar. When the template is
non-null, `headline` is null **by design**, so a test asserting a non-null
`headline` will fail on a perfectly good node.

Both null on a group node means the group cannot be honestly summarized.
Renderers **must** handle it — see
[Rendering](/basics/rendering#null-headline-groups).

Token availability per axis is in
[Aggregation](/deeper/aggregation). Authored aggregate grammar uses the axis’s
pinned roles; the [singular fallback](/deeper/grammar#the-anti-lie-rule) can also
keep a role token when the group contains exactly one distinct entity.

The emitted template belongs to the node. Noun substitution can change it even
when the grammar key is the same; cache rendered results by node rather than
assuming one emitted template per grammar key.

## Cursor semantics

- Opaque. Store and return them; they are not parseable.
- Ordered by `published_at`, newest first.
- **An empty `items` array is not the end of the feed.** Only a null
  `next_cursor` is. Follow while empty, bounded to a small hop count (five is a
  reasonable bound).

## Sync token

Cursor-grained and opaque. Store it; when a later page's token differs, settled
history was rewritten server-side — drop **all** accumulated nodes and refetch
from the head. Equality compare only; `null → non-null` is a change. It is a
resync *trigger*, not a reconciliation rule.

This rule also applies when [`storyfeed:curate --rehash`](/reference/commands#rehash-when-the-grouping-recipe-changes-underneath-existing-rows)
moves a group past a live cursor and the next page is empty. Check the token
before treating that response as the end of the feed. A client that ignores a
changed token does not conform to the payload contract.

## Degraded entities

An entity with no snapshot arrives with `label: null` and `url: null` rather
than being omitted. Activities are never withheld from the payload because an
entity is un-snapshotted. A resolver is never called for an entity with no
snapshot, so `media` is `null` too. A throwing `feedMedia()` degrades to
`url: null` and `media: null` with the exception reported server-side — a
renderer never sees an exception artifact.
