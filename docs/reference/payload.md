# The Payload Contract

## Introduction

Payload v1 describes each feed node for rendering without domain-specific knowledge.

<span id="envelope"></span>

## Response Envelope

`get()` returns a collection whose JSON is a plain array of nodes, newest
first. `cursorPaginate()` and `members()` return Laravel's cursor paginator,
with two keys after Laravel's own:

```jsonc
{
  "data": [ /* activity nodes and group nodes, newest first */ ],
  "path": "https://example.com/feed",
  "per_page": 30,
  // opaque string, or null at the end of the feed
  "next_cursor": "eyJ...",
  "next_page_url": "https://example.com/feed?cursor=eyJ...",
  // always null: a feed pages forward only
  "prev_cursor": null,
  "prev_page_url": null,
  "payload_version": 1,
  // opaque string, or null
  "sync_token": "01J3…"
}
```

`simplePaginate()` returns Laravel's simple paginator, with the nodes in
`data` and the same two keys after Laravel's.

Empty PHP maps such as `data` and `link.attributes` serialize as `[]`; populated
string-keyed maps serialize as JSON objects.

<span id="entity-object"></span>

## Entities

Every role (`actor`, `object`, `target`, `context`, `origin`, `result`, `instrument`, `location`, `generator`) is `null` or:

```jsonc
{
  // morph alias, never a class name
  "type": "delivery",
  // string-cast; null for an entity with no model that was recorded without an id
  "id": "42",
  // snapshot label, or the resolver's; null ⇒ degraded (no snapshot yet)
  "label": "Delivery #1042",
  // resolved at read time; null ⇒ not linkable
  "link": {
    "href": "https://…/deliveries/1042",
    // hint: open as a modal
    "modal": false,
    // link attributes, e.g. {"target": "_blank"}
    "attributes": []
  },
  // snapshot data
  "data": [],
  // picture slots, files and the avatar; never null
  "media": { /* see Media */ },
  // a list of bodies, or null when there are none
  "body": null,
  // null, or what a deleted entity left behind
  "tombstone": null
}
```

The static `Feedable::feedMedia(FeedContext): ?FeedMedia` resolver supplies
`link` and `media` when the feed is retrieved. It receives
the snapshot, which supplies `type`, `id`, `data`, and `label`; the resolver
may override `label`. The `body` list contains stored bodies followed by
resolved bodies, each identifying its type with `$body`.
See [Activity Content](/basics/activity-content#built-in-body-types) and
[Feedable API](/reference/feedable#feedcontext).

`FeedEntity` also accepts `content` (authored text), `mediaType` (its encoding),
and `attributedTo` (the author’s IRI). These snapshot keys appear only when
non-null; an empty `content` string is preserved.

Party nodes may carry an external home in the same `link` field in any role.
Without an external home, `link` is `null`. See
[Linking a Party](/deeper/parties#linking-a-party).

<span id="tombstoned-entities"></span>

### Tombstones

Deleted models are replaced by tombstones in existing activities.
See [Deleted Models](/deeper/deleted-models) for the lifecycle.

```jsonc
"object": {
  // always this alias
  "type": "storyfeed.tombstone",
  // the tombstone's key, not the deleted model's
  "id": "17",
  // null, unless the model kept its label
  "label": null,
  // always null
  "link": null,
  "data": [],
  // the avatar on a neutral grey
  "media": { "icon": null, "image": null, "preview": null, "initials": "?", "color": "#6b7280", "files": [], "slots": [] },
  "body": null,
  "tombstone": {
    // the deleted model's morph alias
    "formerType": "order",
    // ISO 8601, or null when unknown
    "deleted": "1985-07-04T12:00:00.000000Z",
    // true when the trickle found the deletion
    "approximate": false
  }
}
```

A role has one of these states:

| State | Shape |
|---|---|
| Empty | `null`; for the actor, this means anonymous: no actor was recorded |
| Degraded | the model's own `type`, `label: null`, `link: null`, `tombstone: null` |
| Tombstoned | `type: "storyfeed.tombstone"`, `link: null`, `tombstone: {…}` |
| No model | an entity recorded as an array: its `type` and `label` as recorded, `link` from its `url`, `id` as given or `null`, and the derived avatar. Never hydrated or refreshed; without an `id` it is in no `involving()` index |

When `approximate` is true, `deleted` records when `storyfeed:trickle` found
the model missing. It is not the exact deletion time. Headlines, icons, and
intents use `formerType`, so `order.place` still applies to a deleted order.

<span id="entity-media"></span>

### Media

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
  // the avatar's text and disc colour, for an entity without an icon
  "initials": "PT",
  "color": "#0f766e",
  "files": [],
  // custom slots by name, from FeedMedia::slot()
  "slots": []
}
```

| Value | Meaning |
|---|---|
| `icon`, `image`, `preview` | an image object, or `null` |
| `initials`, `color` | the avatar's text and its disc colour as lowercase `#rrggbb`; set whenever `icon` is `null` |
| `files` | a list of resources; an empty list when none |
| `slots` | a map of custom slots, each an image object or a resource; empty when there are none |
| `width`, `height` | dimensions for reserving display space before loading; `null` when unknown, never `0` |

Every entity has an avatar. When `feedMedia()` declares no icon, Storyfeed
fills in what it left undeclared: `initials` from the label (the first letter
of the first and last words, uppercase) and a `color` from the entity's type
and id, so the same entity gets the same tile on every page. A party's colour
follows its key. A tombstone, and an entity with no label, take `#6b7280`;
with no label the initials are `?`. Declared values win.

The three image keys use Activity Streams 2.0 definitions: for a photo,
`preview` is its thumbnail. A picture appears only where a body names its
slot. Group `sample` entities use the same media structure.

`files` is a list of resources carrying `type`, `href`, `mediaType`,
and `name` from `FeedResource`. Each resource defaults to type `Document`.

<span id="one-payload-one-feed"></span>

### Feed-Specific Resolution

The resolver context includes the registered feed name, allowing one snapshot
to produce different URLs per feed. This name comes from the registry, not
the request. For example, a shop feed may include a signed operational link
that is absent from the customer feed.

Nodes do not identify their source feed, so include the feed name in payload cache keys.

### Degraded Entities

Entities without snapshots remain in the payload with `label: null`,
`link: null`, and a `?` avatar; their resolver is not called.
[`storyfeed:trickle`](/reference/commands#scheduled) creates missing snapshots.
If `feedMedia()` throws, Storyfeed reports the exception and returns
`link: null` and the derived avatar.

<span id="activity-node"></span>

## Activity Nodes

```jsonc
{
  "kind": "activity",
  // a ULID
  "id": "01J1K2M3N4P5Q6R7S8T9V0W1X2",
  "verb": "confirm",
  "published_at": "1985-07-04T14:03:22.000000Z",
  // the time range the activity describes, or null
  "starts_at": null,
  "ends_at": null,
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
  "location": { /* entity or null */ },
  "generator": { /* entity or null */ },
  // the role whose entity the row shows, or null
  "featured": "object",
  "data": null,
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

| Key | Type | Holds |
|---|---|---|
| `kind` | string | always `"activity"` |
| `id` | string | the activity's stable, opaque id |
| `verb` | string | the recorded verb |
| `published_at` | string | ISO 8601 with microseconds |
| `starts_at`, `ends_at` | string or null | the time range set with `startsAt()` and `endsAt()`, ISO 8601 with microseconds; either end may be `null` |
| `headline_template` | string or null | the headline, with its tokens; see [Headlines](#headlines) |
| `headline` | string or null | the pre-rendered fallback; see [Headlines](#headlines) |
| `glyph` | string or null | the icon token; see [Icons](#glyphs) |
| `glyph_intent` | string or null | the icon's meaning; see [Icons](#glyphs) |
| `actor`, `object`, `target`, `context`, `origin`, `result`, `instrument`, `location`, `generator` | entity or null | the [entity](#entities) in each role |
| `featured` | string or null | the role whose entity the row shows: `"object"` unless the activity [features another role](/basics/activity-content#featuring-another-role); `null` for none |
| `data` | map or null | what the recording call passed to `data()` |
| `tombstoned` | list | the roles (`"object"`, `"target"`, …) whose entity is a tombstone; `[]` when none |
| `redundant` | boolean | `true` when a tombstoned role is selected for redundancy checks: the object by default, none for a removal verb, or what the verb's `missing()` selects |
| `missing_headline_template` | string or null | the verb's [`->missingHeadline()`](/deeper/deleted-models#headlines-for-deleted-objects), when `redundant` is `true` and the verb declares one; otherwise `null`. `headline_template` keeps its value either way |
| `missing_headline` | string or null | the finished text when `->missingHeadline()` is a closure that returns text without role tokens, as `headline` is for `headline_template`; otherwise `null` |

A redundant activity still records what happened, but a relevant model has
been deleted. Your renderer may display the original or missing headline.

<a id="threads"></a>
<span id="group-node"></span>

## Group Nodes

```jsonc
{
  "kind": "group",
  // opaque and stable; members() reads the group back from it
  "id": "grp_djIfcmVwZWF0…",
  // unknown values: render as a generic group
  "axis": "actors",
  // true total members
  "count": 5,
  "verb": "place",
  // max of members; the sort key
  "published_at": "1985-07-04T14:03:22.000000Z",
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
  "location": null,
  "generator": null,
  // the role every member features, when the axis pins it; else null
  "featured": null,
  // every role is a LIST
  "sample": {
    "actors": [ /* up to 3 entities */ ],
    "objects": [ /* up to 3 entities */ ],
    "targets": [ /* the shared target entity */ ],
    "contexts": [ /* one context entity */ ],
    "origins": [],
    "results": [],
    "instruments": [],
    "locations": [],
    "generators": [],
    // each sampled member's featured entity, newest first
    "featured": [ /* up to 3 entities */ ]
  },
  "distinct": {
    "actors": 5, "objects": 3, "targets": 1, "contexts": 1,
    "origins": 0, "results": 0, "instruments": 0,
    "locations": 0, "generators": 0, "featured": 5
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
    "origins": 0, "results": 0, "instruments": 0,
    "locations": 0, "generators": 0, "featured": 0
  }
}
```

| Key | Type | Holds |
|---|---|---|
| `kind` | string | always `"group"` |
| `id` | string | `grp_` and an opaque key; stable, and accepted by [`members()`](/basics/reading#group-members) |
| `axis` | string | the axis that grouped the members: a [built-in axis](/deeper/aggregation#built-in-axes) (`actors`, `actors_target`, `targets`, `object`, `repeat` or `composite`) or a [custom axis](/deeper/custom-axes)'s name. Render an unknown value as a generic group |
| `count` | int | the true number of members |
| `verb` | string | the members' verb |
| `published_at` | string | the newest member's; the sort key |
| `headline_template`, `headline` | string or null | the group headline; both `null` when no sentence is true of the whole group |
| `glyph`, `glyph_intent` | string or null | as on an activity node |
| `actor`, `object`, `target`, `context`, `origin`, `result`, `instrument`, `location`, `generator` | entity or null | the role's one entity, when every member shares it; see below |
| `featured` | string or null | the role every member features, when that role holds one entity across the group; otherwise `null` |
| `sample` | map of lists | distinct entities per role, limited by `grouping.sample_limits` (default three) and the loaded members; live ones before tombstoned ones |
| `sample.featured` | list | each sampled member's featured entity, newest first, one per member, so an entity can repeat; limited by `grouping.sample_limits.featured` (default three) |
| `distinct` | map of ints | per role, the true count of distinct entities across all members; `featured` counts the members that feature an entity |
| `children` | list | member activity nodes, newest first, at most `grouping.children_limit`; [`members()`](/basics/reading#group-members) pages through all of them |
| `children_truncated` | boolean | `true` when `count` is more than the `children` included |
| `tombstoned` | list | the roles with at least one tombstone among their distinct entities |
| `redundant` | boolean | `true` only when every member is redundant |
| `distinct_tombstoned` | map of ints | per role, how many of the `distinct` entities are tombstones; `featured`, how many featured entities are |

A singular role contains an entity only when the grouping rule uses that
role, every member shares it, its sample has one entry, and its distinct
count is one. Otherwise it is `null`. Each plural role has a limited sample
and a distinct count; empty roles use `[]` and `0`.

Which activities group together, and when, is grouping policy, not part of
the payload contract; see [Aggregation](/deeper/aggregation).

<a id="digest-rows"></a>

[Live](/basics/reading#live) groups one action within a burst, using the
group shape above.

## Presentation Fields

### Icons {#glyphs}

`glyph` contains the icon token declared with
[`icon()`](/basics/the-feed-file#adding-an-icon). Storyfeed includes no icon
set and returns `null` when no icon is defined for the type and verb.

`glyph_intent` contains the token declared with `intent()`, such as `"success"`
or `"danger"`. It describes the icon's meaning. Any string is accepted; Storyfeed
provides no fixed vocabulary or validation. Without a declaration, it is `null`.
See [icon meanings](/basics/rendering#glyphs-and-intents).

Icons and intents are resolved independently in this order: `type.verb`,
`type.*`, `*.verb`, then `*.*`.

Activity Streams 2.0 documents include neither token; their `icon` contains
the entity's icon image.

### Headlines

Render `headline_template` by replacing its tokens. `headline` contains
finished text and is null when `headline_template` is set. For activity nodes,
a closure returning role tokens sets `headline_template`; a closure without
them sets `headline`. For group nodes, closures always set `headline`.
Tests for activity closures returning tokens should check `headline_template`.

Both fields are null when no headline describes every group member.
Renderers must handle this case; see
[Rendering](/basics/rendering#groups-without-headlines).

See [Aggregation](/deeper/aggregation) for allowed group tokens. Singular
tokens require a shared grouping role. The
[singular fallback](/deeper/aggregation#group-headline-tokens) may also retain
a role token when the group has exactly one distinct entity for that role.

Noun substitution can change the emitted template even for the same headline
definition, so cache rendered headlines per node, not per definition.

<a id="headline-links"></a>

#### Links in a Headline

A rendered headline is a sentence that contains entity links. Don't wrap it
in a link to make the row tappable: an `<a>` cannot contain another `<a>`, so
the browser closes the outer link at the first entity link and splits the
sentence. Don't enlarge it with a `min-height` either: on a flex container
that wraps, a minimum height moves the sentence off its line.

Entity links inside the headline need no minimum target size, because
[WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
exempts a target in a sentence. A link alone on its own line is not exempt and
needs a 24 by 24 pixel target at level AA.

## Pagination and Synchronization

<span id="cursor-semantics"></span>

### Cursors

- Store cursors and return them unchanged; do not parse them.
- Results are ordered by `published_at`, newest first.
- `next_cursor: null` marks the end.

<span id="sync-token"></span>

### Sync Tokens

Store the opaque sync token with the cursor and compare tokens for equality.
If a later page's token differs, discard all accumulated nodes and fetch from
the start. A change from `null` to a non-null value also requires this.

[`storyfeed:curate --rehash`](/reference/commands#rehashing-existing-rows) can
change the token during pagination. Check it even when `data` is empty and
`next_cursor` is non-null. Clients must handle changed tokens to comply with
the payload contract.
