# Activity Streams 2.0

Storyfeed serializes to [W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/)
JSON-LD. Two read-only endpoints, off by default:

```php
'routes' => [
    'enabled' => false,
    'prefix' => 'storyfeed',
    'middleware' => [],
],
```

| route | serves |
|---|---|
| `GET /{prefix}/activities/{uid}` | a single `Activity` document |
| `GET /{prefix}/feed` | an `OrderedCollection` (accepts `cursor`) |

Exposing a feed is an app decision — add auth or throttling via `middleware`.

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
`toFeed()`/`toFeedLink()` instead of in a central registry.

## Federation

ActivityPub federation is on the long-range roadmap. Nothing here requires it:
these endpoints are a serialization surface, not a federation implementation.
