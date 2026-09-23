# Activity Streams 2.0

Storyfeed can serve each activity as a
[W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/) JSON-LD
document. All seven [entity roles](/basics/recording#roles) appear under their
AS2 property names. It writes AS2 documents; it does not import arbitrary ones.

The route is read-only and off by default:

```php
// config/storyfeed.php
'routes' => [
    'enabled' => false,
    'prefix' => 'storyfeed',
    'middleware' => [],
],
```

| Route | Serves |
|---|---|
| `GET /{prefix}/activities/{uid}` | a single `Activity` document, addressed by its ULID |

Add auth or throttling through `middleware`.

## Source, Outcome and Means

| Role | AS2 Meaning |
|---|---|
| [`origin`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-origin) | the source; Move, Remove and Delete can identify the source container |
| [`result`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-result) | an entity produced by the activity |
| [`instrument`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-instrument) | the means used, such as a service |

[Recording](/basics/recording#roles) shows which role to use.

## Serving a Collection

There is no collection route; a [named feed](/basics/named-feeds) decides what
a collection contains. `CollectionSerializer::collection()` turns a page of
activities into an `OrderedCollection` or `OrderedCollectionPage`, with
`partOf`, an opaque `next` cursor and no `totalItems`. You pass the page and
the IRI it lives at:

```php
collection(CursorPaginator $page, string $iri, ?string $cursor = null): array
```

::: warning
The prefix mints activity IRIs, so changing it changes document ids. Pick one
before you publish anything externally.
:::

## The `@context`

Documents reference `https://ns.storyfeed.dev`, which defines the package's own
terms (currently `sf:verb`).

## Verb Mapping

A verb enum can map each verb to an Activity Streams type:

```php
<?php

namespace App\Enums;

use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Concerns\AsFeedVerb;
use Storyfeed\Contracts\FeedVerb;

enum OrderActivity: string implements FeedVerb
{
    use AsFeedVerb;

    case Placed = 'place';
    case Confirmed = 'confirm';
    case Ready = 'ready';

    public function activityType(): ActivityType|string|null // [!code focus]
    { // [!code focus]
        return match ($this) { // [!code focus]
            self::Placed => ActivityType::Create, // [!code focus]
            self::Confirmed => ActivityType::Accept, // [!code focus]
            default => null, // [!code focus]
        }; // [!code focus]
    } // [!code focus]
}
```

- The mapping only sets the document's `type`. It never throws and never
  affects recording or validation.
- An unmapped verb serializes as `"type": "Activity"`, with the verb in
  `sf:verb`. A mapped extension type string is kept verbatim as `type`.
- Composite objects serialize as `OrderedCollection`.
- An entity's [media slots](/reference/payload#entity-media) serialize as AS2
  `Link` objects under `icon`, `image` and `preview`, with `mediaType`, `width`
  and `height`. A `url` typed as an image is a `Link` too. `$context->feed()`
  is `null` here, because a document is not read through a feed.

`Reader::activity()` reads a Storyfeed document back. It recovers the `uid`
from `id`, the verb from `sf:verb`, the `type`, and `published` as
`published_at`, to the whole second. The seven role values come back unchanged,
or `null` when absent. Top-level `summary` and `replies` are dropped, and
storage attributes are not rebuilt.

## Type Overrides

Per story:

```php
// app/Stories/OrderWasPlaced.php
public ActivityType|string|null $type = ActivityType::Create;
```

Per model, when the type belongs with the entity rather than the verb,
implement `HasActivityStreamsType` on the model.
