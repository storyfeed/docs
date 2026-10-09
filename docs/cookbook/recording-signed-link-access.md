# Recording Signed-Link Access

Record a signed-link fetch without assigning the intended recipient as actor.
Keep the recipient searchable while distinguishing the request from its performer.

<script setup>
import { logOf } from '../.vitepress/theme/world'
import { unverifiedFetch, verifiedFetch } from '../.vitepress/theme/recipes/signed-links'
</script>

## Recording an Unverified Fetch

The app stores an `IssuedLink` with `document`, `recipient`, and `shop`
relationships. Its `accessEvents` relationship stores one `AccessEvent` per
request. Make these models [feedable](/basics/feedable-models), along with the
document, user, and shop models. Give access events a label and no body.

Define headlines for the observed fetch. A request with a `Purpose: prefetch`
header suggests automation; the header does not establish who sent the request:

```php memo="routes/feed.php"
use App\Models\AccessEvent;
use Storyfeed\ActivityContext;
use Storyfeed\Facades\Story;

Story::for(AccessEvent::class)->verb('fetch')
    ->headline(fn (ActivityContext $activity) =>
        ':actor fetched :target using the link sent to '.$activity->string('recipient_name')
    )
    ->anonymousHeadline(function (ActivityContext $activity): string {
        $suffix = $activity->string('automation')->toString() === 'likely'
            ? ' (automation suspected)'
            : '';

        return 'The link sent to '.$activity->string('recipient_name')
            .' recorded a fetch of :target'.$suffix;
    });
```

The signed route below records the request before returning the file. The
`recipient_id` and name come from the issued-link record, not request input:

```php memo="routes/web.php"
use App\Models\IssuedLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Storyfeed\Facades\Storyfeed;

Route::get('/document-links/{issuedLink}', function (Request $request, IssuedLink $issuedLink) {
    $event = $issuedLink->accessEvents()->create([
        'requested_at' => now(),
        'automation' => $request->header('Purpose') === 'prefetch' ? 'likely' : 'unknown',
    ]);

    Storyfeed::activity()
        ->by(null) // A valid signature identifies the link, not the visitor.
        ->action('fetch', $event)
        ->to($issuedLink->document)
        ->origin($issuedLink)
        ->context($issuedLink->shop)
        ->data([
            'recipient_id' => (string) $issuedLink->recipient->getKey(),
            'recipient_name' => $issuedLink->recipient->name,
            'automation' => $event->automation,
            'observation' => 'fetch',
        ])
        ->publish();

    return Storage::download($issuedLink->document->path);
})->middleware('signed');
```

<FeedExample :items="[unverifiedFetch]" expanded />

This example request carries `Purpose: prefetch`. Requests without that
header store `unknown` and omit the automation suffix. A classifier may
supply a different inference, but a human-looking request still does not
establish a performer. A forwarded link may be used by someone other than
its intended recipient.

| Field | Recorded Value | Meaning |
|---|---|---|
| `actor` | `null` | the request did not establish a performer |
| `object` | access-event model | the observed fetch |
| `target` | document model | the document requested |
| `origin` | issued-link model | the link through which access occurred |
| `context` | shop model | the container used for retrieval |
| `data.recipient_id` | intended recipient's key | whose link was used |
| `data.recipient_name` | intended recipient's name at the time | wording for the headline |
| `data.automation` | `likely` or `unknown` | an inference from a request signal |
| `data.observation` | `fetch` | what the app observed |

For an app organized by client, a feedable client can fill `context` instead
of the shop. The intended recipient remains on the link and in event data.
The recipient is not a participant in the fetch solely because their link
was used.

`by(null)` suppresses the ambient actor even if the browser has a session.
[Activities Without an Actor](/cookbook/activities-without-an-actor) explains
the anonymous APIs. A string passed to a role creates or reuses a named
party; it does not verify identity. Keep recipient names and addresses in
[data](/cookbook/recording-value-changes), rather than string roles.

## Retrieving Fetch Evidence

Retrieve the document's fetches as individual activities:

```php memo="Where document access is shown: a controller or view model"
use Storyfeed\Facades\Storyfeed;

$evidence = Storyfeed::feed()
    ->target($document)
    ->only('fetch')
    ->log()
    ->get();
```

<FeedExample :items="logOf([unverifiedFetch, verifiedFetch])" />

Display the timestamp and recorded request details. The activity records a
request handled by the route; it does not prove the download completed, the
document was read, or its terms were accepted. Use separate events for those
outcomes when the app can establish them. See
[Choosing What to Group](/cookbook/choosing-what-to-group#keep-content-and-evidence-visible)
for keeping evidence visible.

## Finding a Recipient's Link Access

To retrieve access through one issued link, use `involving($issuedLink)`.
To search across a recipient's links, constrain the recorded recipient key:

```php memo="Where recipient access is shown: a controller or view model"
use Illuminate\Database\Eloquent\Builder;
use Storyfeed\Facades\Storyfeed;

$recipientAccess = Storyfeed::feed()
    ->only('fetch')
    ->query(fn (Builder $query) => $query->where(
        'data->recipient_id', (string) $recipient->getKey(),
    ))
    ->log()
    ->get();
```

This query answers whose issued links were used. An `actor($recipient)`
filter answers who performed an activity and should not find these anonymous
fetches. Activity Streams serialization also uses the stored actor, regardless
of the headline's wording. `involving($recipient)` does not follow the issued link's recipient
relationship automatically. The data query makes that relationship explicit.

## Recording an Authenticated Performer

For a separate route requiring both `signed` and `auth` middleware, record the
user established by authentication. Apply the app's document authorization
before recording or returning the file. The authenticated user may differ
from the intended recipient.

The authenticated route creates the same event after authorization:

::: code-group
```php [Fluent Syntax] memo="routes/web.php"
use App\Models\IssuedLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Storyfeed\Facades\Storyfeed;

Route::get('/document-links/{issuedLink}/authenticated', function (Request $request, IssuedLink $issuedLink) {
    Gate::authorize('view', $issuedLink->document);

    $event = $issuedLink->accessEvents()->create([
        'requested_at' => now(),
        'automation' => $request->header('Purpose') === 'prefetch' ? 'likely' : 'unknown',
    ]);
    $data = [
        'recipient_id' => (string) $issuedLink->recipient->getKey(),
        'recipient_name' => $issuedLink->recipient->name,
        'automation' => $event->automation,
        'observation' => 'fetch',
    ];

    Storyfeed::activity()
        ->by($request->user()) // Established by auth, not the link or classifier.
        ->action('fetch', $event)
        ->to($issuedLink->document)
        ->origin($issuedLink)
        ->context($issuedLink->shop)
        ->data($data)
        ->publish();

    return Storage::download($issuedLink->document->path);
})->middleware(['signed', 'auth']);
```

```php [Named Arguments] memo="routes/web.php"
use App\Models\IssuedLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Storyfeed\Facades\Storyfeed;

Route::get('/document-links/{issuedLink}/authenticated', function (Request $request, IssuedLink $issuedLink) {
    Gate::authorize('view', $issuedLink->document);

    $event = $issuedLink->accessEvents()->create([
        'requested_at' => now(),
        'automation' => $request->header('Purpose') === 'prefetch' ? 'likely' : 'unknown',
    ]);
    $data = [
        'recipient_id' => (string) $issuedLink->recipient->getKey(),
        'recipient_name' => $issuedLink->recipient->name,
        'automation' => $event->automation,
        'observation' => 'fetch',
    ];

    Storyfeed::record(
        verb: 'fetch',
        object: $event,
        actor: $request->user(), // Established by auth, not the link or classifier.
        target: $issuedLink->document,
        context: $issuedLink->shop,
        origin: $issuedLink,
        data: $data,
    );

    return Storage::download($issuedLink->document->path);
})->middleware(['signed', 'auth']);
```
:::

<FeedExample :items="[verifiedFetch]" expanded />

Authentication justifies recording the user as the request's actor. The
headline still describes a fetch. Authentication alone does not establish
that the user read or accepted the document.
