# The Payload Contract

## Introduction

Payload v1 describes each feed node for rendering without domain-specific knowledge.

<span id="envelope"></span>

## Response Envelope

```jsonc
{
  "payload_version": 1,
  "items": [ /* activity nodes and group nodes, newest first */ ],
  "next_cursor": "eyJ...",   // opaque string, or null at end of feed
  "sync_token": "01J3…"      // opaque string, or null
}
```

Empty PHP maps such as `data` and `attributes` serialize as `[]`; populated
string-keyed maps serialize as JSON objects.

<span id="entity-object"></span>

## Entities

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

The static `Feedable::feedMedia(FeedContext): ?FeedMedia` resolver supplies
`url`, `attributes`, `modal`, and `media` when the feed is retrieved. It receives
the snapshot, which supplies `type`, `id`, `data`, and `label`; the resolver
may override `label`. The `body` list contains stored bodies followed by
resolved bodies, each identifying its type with `$body`.
See [Activity Content](/basics/activity-content#built-in-body-types) and
[Feedable API](/reference/feedable#feedcontext).

`FeedEntity` also accepts `content` (authored text), `mediaType` (its encoding),
and `attributedTo` (the author’s IRI). These snapshot keys appear only when
non-null; an empty `content` string is preserved.

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
    "deleted": "1985-07-04T12:00:00.000000Z",
    // true when the trickle found the deletion
    "approximate": false,
    // reserved; always null
    "removedBy": null
  }
}
```

A role has one of these states:

| State | Shape |
|---|---|
| Empty | `null`; for the actor, this means anonymous: no actor was recorded |
| Degraded | the model's own `type`, `label: null`, `url: null`, `tombstone: null` |
| Tombstoned | `type: "storyfeed.tombstone"`, `url: null`, `tombstone: {…}` |

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
  // the resource itself is an image; describes what `entity.url` points at
  "url": {
    // always equal to `entity.url`
    "src": "https://…/photos/88/full.jpg",
    "mediaType": "image/jpeg",
    "width": 4032,
    "height": 3024,
    "alt": "Pad thai, table 4"
  },
  "files": []
}
```

| Value | Meaning |
|---|---|
| `media: null` | the entity has no media; the common case |
| `media: {…}` | all four image keys present, each an image object or `null`, plus `files` (an empty list when none) |
| `media.url !== null` | `entity.url` identifies an image |
| `width`, `height` | dimensions for reserving display space before loading; `null` when unknown, never `0` |

`entity.url` remains a string. If it represents an image, `media.url` contains
the same location with `mediaType`, `width`, and `height`. The four media keys
use Activity Streams 2.0 definitions: for a photo, `url` identifies the full
image and `preview` its thumbnail. Group `sample` entities use the same media
structure.

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
`url: null`, and `media: null`; their resolver is not called.
[`storyfeed:trickle`](/reference/commands#scheduled) creates missing snapshots.
If `feedMedia()` throws, Storyfeed reports the exception and returns
`url: null` and `media: null`.

<span id="activity-node"></span>

## Activity Nodes

```jsonc
{
  "kind": "activity",
  // a ULID
  "id": "01J1K2M3N4P5Q6R7S8T9V0W1X2",
  "verb": "confirm",
  "published_at": "1985-07-04T14:03:22.000000Z",
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
| `headline_template` | string or null | the headline, with its tokens; see [Headlines](#headlines) |
| `headline` | string or null | the pre-rendered fallback; see [Headlines](#headlines) |
| `glyph` | string or null | the icon token; see [Icons](#glyphs) |
| `glyph_intent` | string or null | the icon's meaning; see [Icons](#glyphs) |
| `actor`, `object`, `target`, `context`, `origin`, `result`, `instrument` | entity or null | the [entity](#entities) in each role |
| `data` | map or null | what the recording call passed to `data()` |
| `thread` | object or null | the utterance the activity is about; see [Threads](#threads) |
| `tombstoned` | list | the roles (`"object"`, `"target"`, …) whose entity is a tombstone; `[]` when none |
| `redundant` | boolean | `true` when a tombstoned role is selected for redundancy checks: the object by default, none for a removal verb, or what the verb's `missing()` selects |
| `missing_headline_template` | string or null | the verb's [`->missingHeadline()`](/deeper/deleted-models#headlines-for-deleted-objects), when `redundant` is `true` and the verb declares one; otherwise `null`. `headline_template` keeps its value either way |
| `missing_headline` | string or null | the finished text when `->missingHeadline()` is a closure that returns text without role tokens, as `headline` is for `headline_template`; otherwise `null` |

A redundant activity still records what happened, but a relevant model has
been deleted. Your renderer may display the original or missing headline.

### Threads

Set `thread` with `FeedThread` to include something someone said:

| Key | Type | Holds |
|---|---|---|
| `text` | string | the utterance to show, as recorded; Storyfeed does not shorten it |
| `by` | string or null | its author, when the headline does not already name them |
| `kind` | string or null | the app's word for the act, such as `"replied"` |
| `replies` | int or null | the size of the conversation, or `null` when not counted |
| `truncated` | boolean | `true` when the app shortened `text` |

<span id="group-node"></span>

## Group Nodes

```jsonc
{
  "kind": "group",
  // stable within its window
  "id": "grp_3f9a…",
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

| Key | Type | Holds |
|---|---|---|
| `kind` | string | always `"group"` |
| `id` | string | `grp_` and a hash; stable within its window |
| `axis` | string | the axis that grouped the members, or `"summary"` on a [summary row](#digest-rows). Render an unknown value as a generic group |
| `count` | int | the true number of members |
| `verb` | string or null | the members' verb; `null` on a summary row spanning several verbs |
| `published_at` | string | the newest member's; the sort key |
| `headline_template`, `headline` | string or null | the group headline; both `null` when no sentence is true of the whole group |
| `glyph`, `glyph_intent` | string or null | as on an activity node; `null` when `verb` is |
| `actor`, `object`, `target`, `context`, `origin`, `result`, `instrument` | entity or null | the role's one entity, when every member shares it; see below |
| `sample` | map of lists | distinct entities per role, limited by `grouping.sample_limits` (default three) and the loaded members; live ones before tombstoned ones |
| `distinct` | map of ints | per role, the true count of distinct entities across all members |
| `children` | list | member activity nodes, newest first, at most `grouping.children_limit` |
| `children_truncated` | boolean | `true` when `count` is more than the `children` included |
| `tombstoned` | list | the roles with at least one tombstone among their distinct entities |
| `redundant` | boolean | `true` only when every member is redundant |
| `distinct_tombstoned` | map of ints | per role, how many of the `distinct` entities are tombstones |

A singular role contains an entity only when the grouping rule uses that
role, every member shares it, its sample has one entry, and its distinct
count is one. Otherwise it is `null`. Each plural role has a limited sample
and a distinct count; empty roles use `[]` and `0`.

Renderers may rely on the group node's structure. Which groups appear depends
on server-side rules, thresholds, and periods that may change.

### Summary Rows {#digest-rows}

A `summary()` group uses the group shape above with `axis: "summary"` and
these additional fields:

| Key | Holds |
|---|---|
| `period` | `"hour"`, `"day"`, `"week"` or `"month"`, the calendar period passed to `summary()`; `"day"` by default |
| `phrases` | per-verb summaries, ordered by when each verb first occurred, limited by `grouping.summary.phrases` (default three) |
| `phrases_truncated` | `true` when more per-verb phrases exist than are included |

Each entry in `phrases` carries its own fields:

| Key | Holds |
|---|---|
| `verb`, `count` | the verb and its total activity count |
| `headline_template`, `headline` | the headline declared as `summary.{type}.{verb}` or `summary.{verb}`; both nullable |
| `glyph`, `glyph_intent` | presentation for this phrase's verb; both nullable |
| `sample`, `distinct` | sampled entities and true distinct counts per plural role, as on the group |

The summary node's `headline_template` and `headline` come from `summary.*`
and may both be null. Nodes spanning several verbs have `verb: null`,
`glyph: null`, and `glyph_intent: null`; their phrases retain those values.
To render a summary row, display the actor followed by the joined phrases.
Actors whose entire period contains the same single activity may share a
summary node; use `sample.actors` and `distinct.actors` when `actor` is null.

When `phrases_truncated` is true, calculate remaining activities with
`count - sum(phrases[*].count)`. Use this total for “and N more”; it counts
activities, not omitted verbs. `grouping.children_limit` separately limits
`children`, with `children_truncated` indicating omitted members.

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
change the token during pagination. Check it even when `items` is empty and
`next_cursor` is non-null. Clients must handle changed tokens to comply with
the payload contract.
