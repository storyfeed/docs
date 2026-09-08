# Activity Streams 2.0

Storyfeed serializes to [W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/)
JSON-LD for its recording model. All seven [entity roles](/basics/recording#roles)
serialize under their AS2 property names.
This is a document serialization surface, not a general AS2 importer.

One read-only endpoint, off by default:

```php
'routes' => [
    'enabled' => false,
    'prefix' => 'storyfeed',
    'middleware' => [],
],
```

| route | serves |
|---|---|
| `GET /{prefix}/activities/{uid}` | a single `Activity` document, addressed by its ULID |

Exposing an activity is an app decision — add auth or throttling via
`middleware`.

## Source, outcome and means

| role | AS2 meaning |
|---|---|
| [`origin`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-origin) | the source; Move, Remove and Delete can identify the source container |
| [`result`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-result) | an entity produced by the activity |
| [`instrument`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-instrument) | the means used; W3C Example 85 places a music `Service` here |

[Recording](/basics/recording#roles) shows how direction determines the role.

## Serving a collection

There is no collection route. `GET /{prefix}/feed` was removed in
`v0.8.0-alpha.2`: it served every published activity in the system, unscoped and
with no verb allowlist, which is the opposite of what a
[named feed](/basics/named-feeds) is for. It returns when a named feed can back
it.

The collection **shape** is unaffected: `CollectionSerializer::collection()`
still emits `OrderedCollection` / `OrderedCollectionPage` with `partOf`, an
opaque `next` cursor and no `totalItems`. It builds no query and owns no IRI —
both are arguments:

```php
collection(CursorPaginator $page, string $iri, ?string $cursor = null): array
```

A cursor-paginated set of activities, and the IRI they live at. Which activities
is the caller's decision, which is why the route was removed rather than
rescoped: nothing yet hands a named feed's activities to a serializer, and until
something does, the choice would be made by an endpoint rather than by a feed.

::: warning
The prefix mints activity IRIs, so changing it changes document ids. Pick one
before you publish anything externally.
:::

## The `@context`

Documents reference `https://ns.storyfeed.dev`, which defines the package's own
terms (currently `sf:verb`). It is add-only.

## Verb mapping

Verbs map to AS2 types via your enum's `activityType()` — see
[Verbs](/basics/verbs#activity-streams-types). The rules that matter:

- Mapping is **vocabulary transcription only**. It never throws and never gates
  recording or validation.
- Unmapped verbs serialize with the base `Activity` type; the raw verb travels
  as `sf:verb`. An unmapped `frobnicate` produces `"type": "Activity"` and
  `"sf:verb": "frobnicate"`. Explicitly mapped extension type strings are
  **preserved verbatim** as `type`.
- Composite objects serialize as `OrderedCollection`.
- An entity's [media slots](/reference/payload#entity-media) serialize as AS2
  `Link` objects under `icon`, `image` and `preview`, with `mediaType`, `width`
  and `height`. A `url` typed as an image is a `Link` too. `$context->feed()`
  is `null` in this serializer: a federation document has no surface.

Reading Storyfeed's own documents with `Reader::activity()` recovers the `uid`
from the document `id`, the verb from `sf:verb`, the emitted `type`, and
`published` as `published_at` (at the serializer's whole-second precision).
The serialized `actor`, `object`, `target`, `context`, `origin`, `result` and
`instrument` values pass through
unchanged, or return `null` when absent. That is the round-trip subset:
top-level `summary` and `replies` are dropped, and the reader does not
reconstruct every storage attribute or reproduce the whole document.

## Type overrides

Per-story:

```php
public ActivityType|string|null $type = ActivityType::Add;
```

Per-model, when the AS2 type belongs with the entity rather than the verb,
implement `HasActivityStreamsType` — it keeps the mapping next to
`toFeed()`/`feedMedia()` instead of in a central registry.

## Federation

ActivityPub federation is on the long-range roadmap. Nothing here requires it:
these endpoints are a serialization surface, not a federation implementation.
