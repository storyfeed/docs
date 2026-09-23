# Activity Streams 2.0

Storyfeed can serve each activity as a
[W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/) JSON-LD
document, with all seven [roles](/basics/recording#roles) under their AS2
names.

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

## Serving a Collection

There is no collection route. `CollectionSerializer::collection()` turns a page
of activities, such as a [named feed](/basics/named-feeds)'s, into an
`OrderedCollection` or `OrderedCollectionPage` with a `next` cursor. Pass the
page and its IRI:

```php
collection(CursorPaginator $page, string $iri, ?string $cursor = null): array
```

::: warning
The prefix is part of every activity's id, so changing it changes them all.
Choose it before you share any documents.
:::

## The `@context`

Documents reference `https://ns.storyfeed.dev`, which defines `sf:verb`.

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

    public function activityType(): ActivityType|string|null
    {
        return match ($this) {
            self::Placed => ActivityType::Create,
            self::Confirmed => ActivityType::Accept,
            default => null,
        };
    }
}
```

- The mapping only sets the document's `type`.
- An unmapped verb serializes as `"type": "Activity"`, with the verb in
  `sf:verb`.
- Composite objects serialize as `OrderedCollection`.
- An entity's [media](/reference/payload#entity-media) serializes as AS2
  `Link` objects under `icon`, `image` and `preview`. While serializing,
  `$context->feed()` in `feedMedia()` is `null`.

`Reader::activity()` reads a Storyfeed document back: the `uid`, verb, `type`,
roles, and `published_at` to the whole second. It drops `summary` and
`replies`.

## Type Overrides

Per story:

```php
// app/Stories/OrderWasPlaced.php
public ActivityType|string|null $type = ActivityType::Create;
```

Per model: implement `HasActivityStreamsType`.
