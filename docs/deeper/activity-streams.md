# Activity Streams 2.0

## Introduction

Storyfeed can serve each activity as a
[W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/) JSON-LD
document, with all seven [roles](/basics/recording#roles) under their AS2
names.

The Activity Streams document is separate from the normal
[feed payload](/basics/the-payload).

## Serving Activity Documents

### Enabling the Route

The read-only route is off by default. Enable it in the configuration:

```php
// config/storyfeed.php
'routes' => [
    'enabled' => true,
    'prefix' => 'storyfeed',
    'middleware' => [], // Add your application's access middleware.
],
```

### Route Middleware and Identifiers

| Route | Serves |
|---|---|
| `GET /{prefix}/activities/{uid}` | a single `Activity` document, addressed by its ULID |

Add auth or throttling through `middleware`.

> [!WARNING]
> The prefix is part of every activity's id, so changing it changes them all.
> Choose it before you share any documents.

<a id="serving-a-collection"></a>

## Serving Collections

There is no collection route. `CollectionSerializer::collection()` turns a page
of activities, such as a [named feed](/basics/named-feeds)'s, into an
`OrderedCollection` or `OrderedCollectionPage` with a `next` cursor. Pass the
page and its IRI:

```php
// In a controller, after obtaining an authorised page of Activity models.
use Storyfeed\Serialization\CollectionSerializer;

$document = app(CollectionSerializer::class)->collection($page, $iri, $cursor);
```

`$page` is an `Illuminate\Contracts\Pagination\CursorPaginator` of activity
models. `$iri` is the absolute URL your application serves for this collection;
`$cursor` is the incoming cursor string, or `null` for the first page.

## Activity Streams Fields

<a id="source-outcome-and-means"></a>

### Roles

| Role | AS2 Meaning |
|---|---|
| [`origin`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-origin) | the source; Move, Remove and Delete can identify the source container |
| [`result`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-result) | an entity produced by the activity |
| [`instrument`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-instrument) | the means used, such as a service |

<a id="the-context"></a>

### JSON-LD Context

Documents reference `https://ns.storyfeed.dev`, which defines `sf:verb`.

## Mapping Activity Types

<a id="verb-mapping"></a>

### Verb Mappings

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

### Type Overrides

On a Story class, import `Storyfeed\ActivityStreams\ActivityType` and set
its type property:

```php
// app/Stories/OrderWasPlaced.php
public ActivityType|string|null $type = ActivityType::Create;
```

On a model, implement `Storyfeed\Contracts\HasActivityStreamsType`.

## Reading Activity Documents

`Storyfeed\Serialization\Reader::activity()` reads a Storyfeed document back: the `uid`, verb, `type`,
roles, and `published_at` to the whole second. It drops `summary` and
`replies`.
