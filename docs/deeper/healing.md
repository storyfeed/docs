# Healing a Feed

A **healer** soft-deletes activities whose source is gone for good, such as an
activity about a file that was hard-deleted. Your healer picks the activities,
and `storyfeed:heal` retires them.

## When to Use a Healer

Use a healer only for sources that are **permanently** gone, such as a
hard-deleted asset. A source that can be restored doesn't qualify, and neither
does one whose row still exists.

Storyfeed never looks for missing sources itself. A healer retires only the
activities it names.

::: warning Healing rewrites settled history
Every retirement changes the feed's `sync_token`, so clients holding pages
must refetch them, as under
[`storyfeed:curate --rehash`](/reference/commands#rehashing-existing-rows).
Preview first and run it at a quiet time. Healers are never scheduled for you.
:::

## A Healer

A healer yields one `StoryRetirement` per activity that might need retiring.
Here the object is an `asset_reference`, whose `assets` table hard-deletes:

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

`candidates()` and `whenAbsent` **must write nothing**, because they also run
during a preview. Query the source table directly, so a row hidden by a scope
or permissions doesn't look deleted.

`whenAbsent` receives a freshly loaded, locked copy of the activity. Check it
and the source again there, and return `false` if the source exists now.

Activities must be on the default database connection.

Register the healer beside your feeds:

```php
// app/Providers/AppServiceProvider.php, boot()
use App\Storyfeed\AssetHealer;
use Storyfeed\Facades\Storyfeed;

Storyfeed::healers([AssetHealer::class]);
```

A class or an instance works. `key()` names the healer for `--only`.

## Running It

```bash
php artisan storyfeed:heal --dry-run
php artisan storyfeed:heal --only=assets
php artisan storyfeed:heal
```

`--dry-run` prints each request's label, outcome and `meta`, and writes
nothing:

```
assets   Asset story 81   retire      {"reason":"source permanently absent"}
assets   Asset story 82   unchanged   {"reason":"source permanently absent"}
```

| Outcome | When | Applying the Request |
|---|---|---|
| `retire` | the activity is live and `whenAbsent` returns true | soft-delete the activity and bump `sync_token` in the same transaction |
| `unchanged` | the activity is deleted or gone, or `whenAbsent` returns false | nothing |

Without `--only`, every healer runs. Each retirement commits on its own, so if
one fails, the earlier ones stand.

## Testing a Healer

Test through the command. With `AssetHealer` registered, and two activities,
one whose asset exists and one whose asset was deleted:

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

Also test that a source whose row still exists stays `unchanged`.
