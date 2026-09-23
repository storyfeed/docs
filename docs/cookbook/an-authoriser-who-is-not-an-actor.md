# Recording an Authoriser

When one person does something and another approves it, the doer is the actor
of the story. Record the approval as a separate activity that no feed shows,
so you can still look up who approved.

::: code-group
```php [Fluent Syntax]
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

        Storyfeed::activity() // the contributor's story // [!code focus]
            ->by($photo->user) // [!code focus]
            ->action('publish', $photo) // [!code focus]
            ->to($photo->menuItem) // [!code focus]
            ->publish(); // [!code focus]

        Storyfeed::activity() // the approval, in no feed // [!code focus]
            ->by($request->user()) // [!code focus]
            ->action('approve', $photo) // [!code focus]
            ->publish(); // [!code focus]

        return back();
    }
}
```

```php [Named Arguments]
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

        Storyfeed::record( // the contributor's story // [!code focus]
            verb: 'publish', // [!code focus]
            object: $photo, // [!code focus]
            actor: $photo->user, // [!code focus]
            target: $photo->menuItem, // [!code focus]
        ); // [!code focus]

        Storyfeed::record( // the approval, in no feed // [!code focus]
            verb: 'approve', // [!code focus]
            object: $photo, // [!code focus]
            actor: $request->user(), // [!code focus]
        ); // [!code focus]

        return back();
    }
}
```
:::

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::feeds([
    'kitchen' => fn (FeedBuilder $feed) => $feed
        ->only(['publish', 'reprice'])
        ->except('approve'),        // decided, not forgotten
]);
```

This fits moderation queues, four-eyes approval, and a draft someone else
releases. A role would put the approver in the sentence; a `data` key would
keep them out of the participant index. A separate activity does neither.

## Checking for an Existing Record

If the approved thing already records who released it, in a column or a status
field, use that. This recipe is for approvals with no such home: a change to a
menu, a release with no record of its own.

## Finding the Approver

The approver is the actor of a real row, so the participant index has them:

```php
// where the approver is shown: a controller or a view model
$approval = Activity::query()
    ->involving($photo)
    ->where('verb', 'approve')
    ->latest('published_at')
    ->first();

$approvedBy = $approval?->cachedActor;
```

The approval renders nowhere, because no feed admits its verb. It maps to the
Activity Streams `Accept` type, so the serialized document needs no extension
term. The contributor stays the actor of their own story.

## Showing the Approver on a Dense List

On one photo's page, the lookup is one more query. On a long list it is one
per row. There, also copy the approver's name into the story's `data` at
publish time, and keep the approval activity as the record. The `data` copy
can go stale; the activity is what `involving()` finds.

## What the Reader Sees

Nothing, unless you draw it. The approval has no headline because no feed
shows it. Draw the approver from the lookup as a name and a time under the
story, not as a row of its own.
