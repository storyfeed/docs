# Healing a Feed

A **healer** soft-deletes activities whose source is gone for good, such as an
activity about a file that was hard-deleted. The app decides which activities
to retire; `storyfeed:heal` checks each one against the current row and
applies it.

## Before Adopting

A healer is only for sources that are **permanently** gone and cannot return
with the same identity. A hard-deleted asset whose replacement gets a new ID
qualifies. A restorable source does not, and neither does a detached asset whose
row still exists.

A healer only retires activities it is told to. It never records, restores or
replaces activities, and asking it to retire an activity that is already deleted
changes nothing. Core does not look for missing sources and has no default
policy: a source disappearing does not by itself make an activity untrue.

::: warning Healing rewrites settled history
Every retirement bumps the feed's `sync_token`, like `storyfeed:curate --rehash`
and `storyfeed:bundle`, so clients that accumulate pages must discard them and
refetch, as described under
[`storyfeed:curate --rehash`](/reference/commands#rehashing-existing-rows).
A reader holding an earlier cursor may see an empty page before refetching.
Preview first and run it at a quiet time. Core does not schedule healers.
:::

## A Healer

The healer yields one retirement request per candidate activity. Here the object
is an `asset_reference`, backed by an `assets` table that hard-deletes:

```php
<?php

namespace App\Storyfeed;

use Illuminate\Support\Facades\DB;
use Storyfeed\Contracts\FeedHealer;
use Storyfeed\Healing\StoryRetirement;
use Storyfeed\Models\Activity;

class AssetHealer implements FeedHealer
{
    public function key(): string
    {
        return 'assets';
    }

    public function candidates(): iterable
    {
        foreach (Activity::query()
            ->where('verb', 'publish')
            ->where('object_type', 'asset_reference')
            ->lazyById() as $activity) {
            yield new StoryRetirement(
                label: "Asset story {$activity->id}",
                activityId: $activity->id,
                whenAbsent: static fn (Activity $live): bool =>
                    $live->verb === 'publish'
                    && $live->object_type === 'asset_reference'
                    && ! DB::table('assets')->where('id', $live->object_id)->exists(),
                meta: ['reason' => 'source permanently absent'],
            );
        }
    }
}
```

`candidates()` and `whenAbsent` **must write nothing**: they also run during a
preview. The source query must test that the row is truly gone, not hidden by
visibility, attachment, permissions or a model scope.

Before calling `whenAbsent`, core reloads the activity by ID inside a
transaction with `lockForUpdate()`, and passes that fresh row to the closure.
Check the row still matches your policy as well as checking the source. Do not
reuse an earlier result in the closure: if the source is present when the
closure runs, it must return `false`, even if a preview said `retire`. The lock
covers the activity, not the source.

Activities must be on the default database connection. A separate activity
connection is rejected in both preview and application.

Register the healer beside your feeds:

```php
// app/Providers/AppServiceProvider.php, boot()
use App\Storyfeed\AssetHealer;
use Storyfeed\Facades\Storyfeed;

Storyfeed::healers([AssetHealer::class]);
```

A class resolves through the container; an instance works too. `key()` names
the healer for `--only`, and registering the same key again replaces the
earlier one. `merge: false` replaces the whole registry.

## Running It

```bash
php artisan storyfeed:heal --dry-run
php artisan storyfeed:heal --only=assets
php artisan storyfeed:heal
```

`--dry-run` prints each request's label, outcome and metadata. It reads current
rows and evaluates the closures, without locks or writes. The applying run
evaluates everything again.

```
assets   Asset story 81   retire      {"reason":"source permanently absent"}
assets   Asset story 82   unchanged   {"reason":"source permanently absent"}
```

| Outcome | When | Applying the Request |
|---|---|---|
| `retire` | the activity is live and `whenAbsent` returns true | soft-delete the activity and bump `sync_token` in the same transaction |
| `unchanged` | the activity is deleted or gone, or `whenAbsent` returns false | nothing |

A model hook that vetoes the deletion makes the outcome `unchanged`.
Repeat `--only` to select several healers; an unknown key fails before any
healer runs. Without `--only`, every registered healer runs.

Each request commits on its own, so if a later one fails, earlier retirements
stay committed and their `sync_token` bumps stand. Core stores no record of the
run. A retirement soft-deletes through the model, like any other deletion.

## Testing a Healer

Test through the command. `FeedHealer` has only `key()` and `candidates()`;
there is no `run()` to call.

With `AssetHealer` registered, and two activities, one whose asset exists and
one whose asset was deleted:

```php
// tests/Feature/FeedTest.php
$this->artisan('storyfeed:heal', ['--dry-run' => true, '--only' => ['assets']])
    ->assertSuccessful();

expect($absentSourceStory->fresh()->trashed())->toBeFalse();

$this->artisan('storyfeed:heal', ['--only' => ['assets']])
    ->assertSuccessful();

expect($absentSourceStory->fresh()->trashed())->toBeTrue()
    ->and($presentSourceStory->fresh()->trashed())->toBeFalse();
```

Also test that a detached but present source is `unchanged`, that a source
present when the run applies blocks a retirement the preview reported, and that
running twice creates no activities, even after a retired one has been pruned.
