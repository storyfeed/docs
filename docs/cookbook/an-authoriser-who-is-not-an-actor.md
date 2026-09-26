# Recording an Authoriser

When one person acts and another approves, keep the person who acted as the
activity's actor. Record approval separately and exclude it from displayed
feeds so you can still query who approved. If the model already stores the
approver in a column or status field, use that record.

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
    ->by($photo->user)
    ->action('publish', $photo)
    ->to($photo->menuItem)
    ->publish();

Storyfeed::activity() // the approval; exclude its verb from displayed feeds
    ->by($request->user())
    ->action('approve', $photo)
    ->publish();
```

```php [Named Arguments]
Storyfeed::record( // the contributor's activity
    verb: 'publish',
    object: $photo,
    actor: $photo->user,
    target: $photo->menuItem,
);

Storyfeed::record( // the approval; exclude its verb from displayed feeds
    verb: 'approve',
    object: $photo,
    actor: $request->user(),
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

The `shop` feed includes only `publish` and `reprice`, excluding approvals.
For a feed without `only()`, call `except('approve')`.

Use this for moderation, approval by a second person, or drafts released by
someone else. Separate activities preserve each person's role and let you
find the approval with `involving()`.

## Finding the Approver

In your controller or view model, retrieve the photo's latest `approve`
activity in log mode. Its `actor` is the approver:

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

`ActivityType::Accept` maps the approval to Activity Streams `Accept`.
The contributor remains the actor of the publication activity.

## Displaying Approvals

<span id="displaying-an-approval"></span>
<span id="displaying-an-approval-on-one-item"></span>
<span id="showing-the-approver-on-a-dense-list"></span>
<span id="displaying-approvals-in-lists"></span>

Display the approver's name and approval time under the published activity.
The lookup requires one query per photo, so for long lists, also copy the
approver's name into the published activity's `data`. Keep the approval
activity as the original record.
