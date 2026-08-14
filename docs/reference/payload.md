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

Every role (`actor`, `object`, `target`, `context`) is `null` or:

```jsonc
{
  "type": "delivery",                  // morph alias, never a class name
  "id": "42",                          // string-cast
  "label": "Delivery #1042",           // null ⇒ degraded (no snapshot yet)
  "url": "https://…/deliveries/1042",  // regenerated at read time; null ⇒ not linkable
  "attributes": {},                    // link attributes, e.g. {"target": "_blank"}
  "modal": false,                      // hint: open as a modal
  "component": null,                   // backend-named body component
  "data": {}                           // snapshot data
}
```

## Activity node

```jsonc
{
  "kind": "activity",
  "id": "01J1K2M3N4P5Q6R7S8T9V0W1X2",  // public ULID (uid), not the internal PK
  "verb": "confirm",
  "published_at": "2026-08-10T14:03:22Z",
  "headline_template": ":actor confirmed :object for :target",
  "headline": null,                     // pre-rendered fallback; see below
  "icon": "file-check",
  "actor": { /* entity */ },
  "object": { /* entity */ },
  "target": { /* entity or null */ },
  "context": { /* entity or null */ },
  "data": {}
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
  "icon": "file-up",
  "exemplars": {                        // every role is a LIST
    "actors": [ /* up to 3 entities */ ],
    "objects": [ /* a pinned role has exactly one */ ],
    "targets": [ /* a role null across members is [] */ ],
    "contexts": []
  },
  "distinct": { "actors": 5, "objects": 3, "targets": 4, "contexts": 1 },
  "children": [ /* member activity nodes, newest first, possibly truncated */ ],
  "children_truncated": false
}
```

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
[Aggregation](/deeper/aggregation); the rule is that a singular role token is
safe iff the axis pins that role.

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

## Degraded entities

An entity with no snapshot arrives with `label: null` and `url: null` rather
than being omitted. Activities are never withheld from the payload because an
entity is un-snapshotted, and a broken `toFeedLink()` degrades to `url: null`
with the exception reported server-side — a renderer never sees an exception
artifact.
