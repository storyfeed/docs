# Activity Streams 2.0

Storyfeed serializes to [W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/)
JSON-LD. One read-only endpoint, off by default:

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
- Unmapped verbs serialize as extension types, **preserved verbatim**. Unknown
  types are never dropped.
- Composite objects serialize as `OrderedCollection`.

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
