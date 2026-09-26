# Recording an Authoriser

When one person does something and another approves it, the doer is the actor
of the activity. Record the approval as its own activity and leave its verb out
of displayed feeds, so you can still look up who approved. If the approved thing
already records who released it, in a column or a status field, use that
instead.

<span id="checking-for-an-existing-record"></span>
<span id="choosing-an-approval-record"></span>

## Recording an Approval

```php memo="routes/feed.php"
use App\Models\Photo;
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Story;

Story::for(Photo::class)->verb('approve')
    ->type(ActivityType::Accept)
    ->headline(':actor approved :object'); // needed even when feeds leave it out

Story::for(Photo::class)->verb('publish')
    ->headline(':actor published :object to :target');
```

::: code-group
```php [Fluent Syntax]
Storyfeed::activity() // the contributor's activity
    ->by($photo->user) // [!code highlight]
    ->action('publish', $photo)
    ->to($photo->menuItem)
    ->publish();

Storyfeed::activity() // the approval; exclude its verb from displayed feeds
    ->by($request->user()) // [!code highlight]
    ->action('approve', $photo)
    ->publish();
```

```php [Named Arguments]
Storyfeed::record( // the contributor's activity
    verb: 'publish',
    object: $photo,
    actor: $photo->user, // [!code highlight]
    target: $photo->menuItem,
);

Storyfeed::record( // the approval; exclude its verb from displayed feeds
    verb: 'approve',
    object: $photo,
    actor: $request->user(), // [!code highlight]
);
```
:::

## Filtering Approval Activities

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Storyfeed::feeds([
    'shop' => fn (FeedBuilder $feed) => $feed->only(['publish', 'reprice']),
]);
```

The `shop` feed lists only `publish` and `reprice`, so the approval stays out.
A feed without `only()` leaves it out with `->except('approve')`.

This fits moderation queues, four-eyes approval, and a draft someone else
releases. A separate activity keeps the approver out of the published sentence
and findable with `involving()`.

## Finding the Approver

Read the photo's latest `approve` activity. The approver is its `actor`:

```php memo="Where the approver is shown: a controller or a view model"
use Storyfeed\Facades\Storyfeed;

$approval = Storyfeed::feed()
    ->involving($photo)
    ->verb('approve')
    ->log()
    ->limit(1)
    ->get()
    ->items()[0] ?? null;

$approvedBy = $approval['actor']['label'] ?? null;
$approvedAt = $approval['published_at'] ?? null;
```

`ActivityType::Accept` marks the approval as an Activity Streams `Accept`. The
contributor stays the actor of their own activity.

## Displaying Approvals

<span id="displaying-an-approval"></span>
<span id="displaying-an-approval-on-one-item"></span>
<span id="showing-the-approver-on-a-dense-list"></span>
<span id="displaying-approvals-in-lists"></span>

Show the approver from the lookup as a name and a time under the published
activity, not as a row of its own. The lookup is one query per photo, so on a
long list also copy the approver's name into the published activity's `data`.
The approval activity stays the record.
