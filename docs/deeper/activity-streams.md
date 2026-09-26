# Activity Streams 2.0

## Introduction

Storyfeed can serve each activity as a
[W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/) JSON-LD
document, using AS2 names for all seven [roles](/basics/recording#roles).

The Activity Streams document is separate from the normal
[feed payload](/basics/the-payload).

## Serving Activity Documents

### Enabling the Route

Enable the read-only route in `config/storyfeed.php`:

```php memo="config/storyfeed.php"
'routes' => [
    'enabled' => true,
    'prefix' => 'storyfeed',
    'middleware' => [], // Add your application's access middleware.
],
```

### Route Middleware and Identifiers

| Route | Returns |
|---|---|
| `GET /{prefix}/activities/{uid}` | one `Activity` document, identified by its ULID |

Add authentication or throttling to `middleware`.

> [!WARNING]
> The prefix is part of every activity's ID. Choose it before sharing
> documents, since changing it changes all their IDs.

<a id="serving-a-collection"></a>

## Serving Collections

Use `CollectionSerializer::collection()` to convert cursor-paginated
activities into an `OrderedCollection` or an `OrderedCollectionPage` with a
`next` link. Your application selects the activities and serves the route:

```php memo="A controller that serves the collection"
use Storyfeed\Models\Activity;
use Storyfeed\Serialization\CollectionSerializer;

$page = Activity::query()
    ->published()
    ->involving($project) // without a scope, this is every activity
    ->orderBy('published_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(20);

$document = app(CollectionSerializer::class)
    ->collection($page, route('projects.activity', $project), $request->query('cursor'));
```

Pass the collection's absolute URL as the second argument and the incoming
cursor as the third. Use `null` for the first page.

## Activity Streams Fields

<a id="source-outcome-and-means"></a>

### Origin, Result and Instrument

| Role | AS2 Meaning |
|---|---|
| [`origin`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-origin) | the source; Move, Remove and Delete can identify the source container |
| [`result`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-result) | an entity produced by the activity |
| [`instrument`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-instrument) | the means used, such as a service |

## Mapping Activity Types

<a id="verb-mapping"></a>
<a id="the-context"></a>

### Verb Mappings

Map verbs to Activity Streams types in your verb enum:

```php memo="app/Enums/OrderActivity.php"
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

- The mapping sets only the document's `type`.
- Without an app or built-in AS2 mapping, the type is `Activity` and `sf:verb`
  holds the verb. The document's JSON-LD context, `https://ns.storyfeed.dev`,
  defines `sf:verb`. Intransitive types also fall back to `Activity` when an
  object is present.
- Composite objects serialize as `OrderedCollection`.
- Entity [media](/reference/payload#entity-media) serialize as AS2 `Link`
  objects under `icon`, `image`, and `preview`. During serialization,
  `$context->feed()` in `feedMedia()` returns `null`.

### Type Overrides

On a Story class, import `Storyfeed\ActivityStreams\ActivityType` and set `$type`:

```php memo="app/Stories/OrderWasPlaced.php"
public ActivityType|string|null $type = ActivityType::Create;
```

On a model, implement `Storyfeed\Contracts\HasActivityStreamsType`.

## Reading Activity Documents

`Storyfeed\Serialization\Reader::activity()` parses a Storyfeed document,
preserving its `uid`, verb, `type`, roles, and `published_at` to the whole
second. It discards `summary` and `replies`.
