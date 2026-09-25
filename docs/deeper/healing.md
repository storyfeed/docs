# Healing a Feed

## Introduction

A **healer** soft-deletes activities whose source is gone for good, such as an
activity about a file that was hard-deleted. Your healer picks the activities,
and `storyfeed:heal` retires them.

<a id="permanently-missing-sources"></a>

Use a healer only for sources that are **permanently** gone, such as a
hard-deleted asset. A source that can be restored doesn't qualify, and neither
does one whose row still exists.

A healer retires only the activities it names. A deleted Feedable model needs no healer: its activities
stay, and name a [tombstone](/deeper/deleted-models) instead.

> [!WARNING]
> **Healing rewrites settled history**
>
> Every retirement changes the feed's `sync_token`, so clients holding pages
> must refetch them, as under
> [`storyfeed:curate --rehash`](/reference/commands#rehashing-existing-rows).
> Preview first and run it at a quiet time. Healers are never scheduled for you.

<a id="defining-a-healer"></a>

## Defining Healers

### Selecting Candidates

A healer yields one `StoryRetirement` per activity that might need retiring.
Here the object is an `asset_reference`, whose `assets` table hard-deletes:

```php memo="app/Storyfeed/AssetHealer.php"
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
                label: "Asset activity {$activity->id}",
                activityId: $activity->id,
                whenAbsent: static fn (Activity $live): bool =>
                    $live->verb === 'publish'
                    && $live->object_type === 'asset_reference'
                    && ! DB::table('assets')
                        ->where('id', $live->object_id)
                        ->exists(),
                meta: ['reason' => 'source permanently absent'],
            );
        }
    }
}
```

`candidates()` and `whenAbsent` **must write nothing**, because they also run
during a preview. Query the source table directly, so a row hidden by a scope
or permissions doesn't look deleted.

### Rechecking Missing Sources

`whenAbsent` receives a freshly loaded, locked copy of the activity. Check it
and the source again there, and return `false` if the source exists now.

Activities must be on the default database connection.

## Registering Healers

Register the healer beside your feeds:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use App\Storyfeed\AssetHealer;
use Storyfeed\Facades\Storyfeed;

Storyfeed::healers([AssetHealer::class]);
```

A class or an instance works. `key()` names the healer for `--only`.

<a id="running-a-healer"></a>

## Running Healers

### Previewing Retirements

```shell
php artisan storyfeed:heal --dry-run
```

`--dry-run` prints each request's label, outcome and `meta`, and writes
nothing:

```
Dry run: preview only. Applying retirements rewrites history and bumps sync_token; accumulating clients must resync.
assets  Asset activity 81  retire  {"reason":"source permanently absent"}
assets  Asset activity 82  unchanged  {"reason":"source permanently absent"}
Would retire: 1; unchanged: 1.
```

| Outcome | When | Applying the Request |
|---|---|---|
| `retire` | the activity is live and `whenAbsent` returns true | soft-delete the activity and bump `sync_token` in the same transaction |
| `unchanged` | the activity is deleted or gone, or `whenAbsent` returns false | nothing |

### Applying Retirements

```shell
php artisan storyfeed:heal --only=assets
php artisan storyfeed:heal
```

Without `--only`, every healer runs. Each retirement commits on its own, so if
one fails, the earlier ones stand.

<a id="testing-a-healer"></a>

## Testing Healers

Test through the command. With `AssetHealer` registered, and two activities,
one whose asset exists and one whose asset was deleted:

```php memo="tests/Feature/FeedTest.php"
$this->artisan('storyfeed:heal', ['--dry-run' => true, '--only' => ['assets']])
    ->assertSuccessful();

expect($absentSourceStory->fresh()->trashed())->toBeFalse();

$this->artisan('storyfeed:heal', ['--only' => ['assets']])
    ->assertSuccessful();

expect($absentSourceStory->fresh()->trashed())->toBeTrue()
    ->and($presentSourceStory->fresh()->trashed())->toBeFalse();
```

Also test that a source whose row still exists stays `unchanged`.
