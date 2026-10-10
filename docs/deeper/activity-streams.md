# Activity Streams 2.0

## Introduction

Storyfeed can serve each activity as a
[W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/) JSON-LD
document, using AS2 names for every [role](/basics/recording#roles).

The Activity Streams document is separate from the normal
[feed payload](/basics/reading#the-payload).

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

The route responds with `application/activity+json`. A request whose `Accept`
header allows none of `application/activity+json`, `application/ld+json`,
`application/json` or `*/*` receives a 406 response.

> [!WARNING]
> The prefix is part of every activity's ID. Choose it before sharing
> documents, since changing it changes all their IDs.

<a id="serving-a-collection"></a>

## Serving Collections

Use `CollectionSerializer::collection()` to convert cursor-paginated
activities into an `OrderedCollection` or an `OrderedCollectionPage` with a
`next` link. Your application selects the activities and serves the route:

```php memo="app/Http/Controllers/ShopActivityController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Storyfeed\Models\Activity;
use Storyfeed\Serialization\CollectionSerializer;

class ShopActivityController extends Controller
{
    public function __invoke(Request $request, Shop $shop, CollectionSerializer $serializer): JsonResponse
    {
        $page = Activity::query()
            ->published()
            ->involving($shop) // without a scope, this is every activity
            ->orderBy('published_at', 'desc')
            ->orderBy('id', 'desc')
            ->cursorPaginate(20);

        $document = $serializer->collection(
            $page,
            route('shops.activity', $shop),
            $request->query('cursor'),
        );

        return response()
            ->json($document, options: JSON_UNESCAPED_SLASHES)
            ->header('Content-Type', 'application/activity+json');
    }
}
```

Pass the collection's absolute URL as the second argument and the incoming
cursor as the third. Use `null` for the first page.

## Activity Streams Fields

<a id="source-outcome-and-means"></a>

<a id="origin-result-and-instrument"></a>

### Origin, Result, Instrument, Location and Generator

| Role | AS2 Meaning |
|---|---|
| [`origin`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-origin) | the source; Move, Remove and Delete can identify the source container |
| [`result`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-result) | an entity produced by the activity |
| [`instrument`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-instrument) | the means used, such as a service |
| [`location`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-location) | where the activity happened |
| [`generator`](https://www.w3.org/TR/activitystreams-vocabulary/#dfn-generator) | the application that produced the activity |

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

| Field | Effect |
|---|---|
| `type` and deletion rules | The mapping sets the document's type. Without an app or built-in AS2 mapping, the type is `Activity`. Intransitive types also fall back to `Activity` when an object is present. `Delete`, `Remove`, `Undo` and `Reject` have no constitutive roles by default; other types use the object. Explicit rules can override this; see [Deleted Models](/deeper/deleted-models). |
| `sf:verb` | Always holds the verb. The JSON-LD context, `https://ns.storyfeed.dev`, defines it. |
| `summary` | The activity's headline as one HTML-escaped sentence. Omitted when the verb has no headline. |
| `startTime`, `endTime` | The activity's `starts_at` and `ends_at` in UTC, each only when recorded. |
| `duration` | The time from `startTime` to `endTime` in days and time, such as `P1DT2H`. Only when both are recorded. |
| composite `object` | Serializes as `OrderedCollection`. |
| entity media | [Media](/reference/payload#entity-media) serialize as AS2 `Link` objects under `icon`, `image` and `preview`. During serialization, `$context->feed()` in `feedMedia()` returns `null`. |

### Type Overrides

On a Story class, set `$type`:

```php memo="app/Stories/OrderWasPlaced.php"
<?php

namespace App\Stories;

use App\Models\Order;
use App\Models\User;
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\PendingActivity;
use Storyfeed\Stories\Story;

class OrderWasPlaced extends Story
{
    public ActivityType|string|null $type = ActivityType::Create;

    public function __construct(
        public Order $order,
        public User $customer,
    ) {}

    public function toFeedActivity(): ?PendingActivity
    {
        return $this->activity($this->order)
            ->by($this->customer)
            ->to($this->order->shop);
    }

    public function headline(): string
    {
        return ':actor placed :object with :target';
    }
}
```

### Entity Object Types

A model declares the AS2 object type its entities serialize as by
implementing `Storyfeed\Contracts\HasActivityStreamsType`:

```php memo="app/Models/Shop.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\ActivityStreams\ObjectType;
use Storyfeed\Contracts\HasActivityStreamsType;

class Shop extends Model implements HasActivityStreamsType
{
    public static function activityStreamsType(): ObjectType|string
    {
        return ObjectType::Organization;
    }
}
```

## Reading Activity Documents

The `Reader` parses a Storyfeed document back into activity attributes:

```php memo="Where you read a document: a controller, a job, a test"
use Storyfeed\Serialization\Reader;

$attributes = app(Reader::class)->activity($document);
```

It returns the `uid`, verb, `type` and roles, and `published_at`, `starts_at`
and `ends_at` to the whole second. A role the document lacks is `null`. Other
document properties, such as `summary`, are not returned.
