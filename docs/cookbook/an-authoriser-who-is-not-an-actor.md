# Recording an Authoriser

When one person does something and another approves it, the doer is the actor
of the activity. Record the approval separately and exclude its verb from each displayed feed,
so you can still look up who approved.

<span id="checking-for-an-existing-record"></span>

## Choosing an Approval Record

If the approved thing already records who released it, in a column or a status
field, use that. This recipe is for approvals with no such home: a change to a
menu, a release with no record of its own.

## Recording an Approval

```php memo="routes/feed.php"
use App\Models\Photo;
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Story;

Story::for(Photo::class)->verb('approve')
    ->type(ActivityType::Accept)
    ->headline(':actor approved :object');

Story::for(Photo::class)->verb('publish')
    ->headline(':actor published :object to :target');
```

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/PhotoApprovalController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Photo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PhotoApprovalController extends Controller
{
    public function store(Request $request, Photo $photo): RedirectResponse
    {
        $photo->update(['approved_at' => now()]);

        Storyfeed::activity() // the contributor's activity
            ->by($photo->user)
            ->action('publish', $photo)
            ->to($photo->menuItem)
            ->publish();

        Storyfeed::activity() // the approval; exclude its verb from displayed feeds
            ->by($request->user())
            ->action('approve', $photo)
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/PhotoApprovalController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Photo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PhotoApprovalController extends Controller
{
    public function store(Request $request, Photo $photo): RedirectResponse
    {
        $photo->update(['approved_at' => now()]);

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

        return back();
    }
}
```
:::

## Filtering Approval Activities

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Storyfeed::feeds([
    'shop' => fn (FeedBuilder $feed) => $feed
        ->only(['publish', 'reprice'])
        ->except('approve'),        // decided, not forgotten
]);
```

The `shop` feed excludes the approval. Other feeds must also exclude it
if it should remain hidden.

This fits moderation queues, four-eyes approval, and a draft someone else
releases. A role would put the approver in the sentence, and a `data` key can't
be read with `involving()` or `actor()`. A separate activity does neither.

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

### Displaying an Approval on One Item

Give the approval a headline even when displayed feeds exclude it: recording
checks its definition. Show the approver from the lookup as a name and a time
under the activity, not as a row of its own.

<span id="showing-the-approver-on-a-dense-list"></span>

### Displaying Approvals in Lists

On one photo's page, the lookup is one more query. On a long list it is one
per row. There, also copy the approver's name into the published activity's
`data`, and keep the approval activity as the record. The `data` copy can go
stale; the approval activity is what `involving()` finds.
