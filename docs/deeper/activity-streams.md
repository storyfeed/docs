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

```php memo="config/storyfeed.php"
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

`CollectionSerializer::collection()` turns a cursor-paginated page of
activities into an `OrderedCollection`, or an `OrderedCollectionPage` with a
`next` link. Your application chooses which activities, and serves the route:

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

The second argument is the absolute URL your application serves the
collection at; the third is the incoming cursor, or `null` for the first page.

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

A verb enum can map each verb to an Activity Streams type:

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

- The mapping only sets the document's `type`.
- A verb with neither an app mapping nor a built-in AS2 mapping serializes
  as `"type": "Activity"`, with the verb in `sf:verb`, which the documents'
  JSON-LD context, `https://ns.storyfeed.dev`, defines. An intransitive type
  also falls back to `Activity` when the activity has an object.
- Composite objects serialize as `OrderedCollection`.
- An entity's [media](/reference/payload#entity-media) serializes as AS2
  `Link` objects under `icon`, `image` and `preview`. While serializing,
  `$context->feed()` in `feedMedia()` is `null`.

### Type Overrides

On a Story class, import `Storyfeed\ActivityStreams\ActivityType` and set
its type property:

```php memo="app/Stories/OrderWasPlaced.php"
public ActivityType|string|null $type = ActivityType::Create;
```

On a model, implement `Storyfeed\Contracts\HasActivityStreamsType`.

## Reading Activity Documents

`Storyfeed\Serialization\Reader::activity()` reads a Storyfeed document back: the `uid`, verb, `type`,
roles, and `published_at` to the whole second. It drops `summary` and
`replies`.
