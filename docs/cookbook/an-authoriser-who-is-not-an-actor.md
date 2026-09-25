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
use Storyfeed\Facades\Story;

Story::for(Photo::class)->verb('approve')->headline(':actor approved :object');
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
    'kitchen' => fn (FeedBuilder $feed) => $feed
        ->only(['publish', 'reprice'])
        ->except('approve'),        // decided, not forgotten
]);
```

The `kitchen` feed excludes the approval. Other feeds must also exclude it
if it should remain hidden.

This fits moderation queues, four-eyes approval, and a draft someone else
releases. A role would put the approver in the sentence; a `data` key would
keep them out of the participant index. A separate activity does neither.

## Finding the Approver

The approver is the actor of a real row, so the participant index has them:

```php memo="where the approver is shown: a controller or a view model"
use Storyfeed\Models\Activity;

$approval = Activity::query()
    ->involving($photo)
    ->where('verb', 'approve')
    ->latest('published_at')
    ->first();

$approvedBy = $approval?->cachedActor;
```

The approval maps to the Activity Streams `Accept` type, so the serialized document needs no extension
term. The contributor stays the actor of their own story.

## Displaying Approvals

<span id="displaying-an-approval"></span>

### Displaying an Approval on One Item

Give the approval a headline even when displayed feeds exclude it;
recording validates its definition. Draw the approver from the lookup as a name and a time under the
story, not as a row of its own.

<span id="showing-the-approver-on-a-dense-list"></span>

### Displaying Approvals in Lists

On one photo's page, the lookup is one more query. On a long list it is one
per row. There, also copy the approver's name into the story's `data` at
publish time, and keep the approval activity as the record. The `data` copy
can go stale; the activity is what `involving()` finds.
