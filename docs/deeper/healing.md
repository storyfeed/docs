# Healing a Feed

## Introduction

A **healer** selects activities whose source has been permanently deleted,
such as a file that no longer exists. The `storyfeed:heal` command soft-deletes
the selected activities. Healing does not edit an activity's verb, roles, or
data. To change how stored activities appear, see
[Correcting Historical Presentation](#correcting-historical-presentation).

<a id="permanently-missing-sources"></a>

Use a healer only when the source is permanently gone. Sources that can be
restored or still exist in the database do not qualify.

A healer soft-deletes only the activities it selects. Deleted Feedable
models need no healer: their activities remain with a
[tombstone](/deeper/deleted-models).

> [!WARNING]
> **Healing makes clients refetch their pages**
>
> Each soft-deletion changes the feed's `sync_token`, so clients must refetch
> their pages, as with
> [rebuilding groups](/reference/commands#rehashing-groups).
> Preview changes and run healing during low traffic. Healers are not scheduled
> automatically.

## Choosing a Maintenance Operation

| Operation | Trigger | Effect on Activities | Changes `sync_token` | Runs When |
|---|---|---|---|---|
| `storyfeed:heal` | a registered healer confirms a permanently absent source | soft-deletes selected activities | each soft-deletion | run manually; no package schedule |
| `storyfeed:trickle --prune` | an uncached role cannot resolve, such as a model missing `Feedable` | soft-deletes unresolved activities | not for these soft-deletions | run manually or schedule in the app; pruning is opt-in |
| `storyfeed:prune` | an activity exceeds its retention window | permanently deletes expired activities, including soft-deleted ones | when groups change or composite members are released | run manually or schedule in the app |
| tombstones | a Feedable model is deleted | keeps activities and replaces references to the model; `forgetWhenMissing()` can permanently delete redundant activities | when references move or activities are forgotten | model events; scheduled `trickle` discovers deletions without events |

Without `--prune`, `trickle` reports unresolved roles and keeps their activities
unless `storyfeed.trickle.prune` is enabled. Check a model's
[Feedable setup](/basics/feedable-models) before removing those activities.
A deleted Feedable model normally receives a
[tombstone](/deeper/deleted-models), including during `trickle`. That separate
operation can change `sync_token` even without `--prune`.

See [Retention](/deeper/retention) for retention windows and
[Scheduling Maintenance](/reference/commands#scheduling-maintenance) for schedules.

## Correcting Historical Presentation

To correct a headline for a recorded verb, change its definition in
`routes/feed.php`:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object[ at :target]');
```

<script setup>
import { scene } from '../.vitepress/theme/world'
const corrected = { ...scene.order, headline_template: ':actor placed :object at :target' }
</script>

<FeedExample :items="[corrected]" />

Storyfeed resolves the headline when it retrieves the feed. The new definition
applies to existing activities with that object type and verb. Use a
[dynamic headline](/basics/the-feed-file#dynamic-headlines) to choose wording
from stored activity data, or a
[fallback](/basics/the-feed-file#definition-precedence) for verbs without a
specific definition. Rebuild the [definition cache](/basics/the-feed-file#caching-definitions)
if the app caches definitions.

Storyfeed has no supported API or command for rewriting a stored activity's
verb, roles, or data and refreshing all dependent records. Correct the
[recording code](/basics/recording) for future activities. Headline definitions
can change the presentation of existing facts; they cannot supply a role or
fact that was never recorded.

`storyfeed:rebuild` refreshes entity snapshots and cached links from `toFeed()`;
it does not re-compose activities. `storyfeed:participants` rebuilds the
index used by `involving()` from stored roles and ancestry. Neither command
corrects the recorded verb, roles, or data. Group maintenance is separate:
[`curate --rehash` and `curate --rebuild-bursts`](/reference/commands#rehashing-groups)
update grouping, not activity composition.

<a id="defining-a-healer"></a>

## Defining Healers

> [!NOTE]
> Healers work on activities stored on the default database connection. On any
> other connection, `storyfeed:heal` throws.

### Selecting Candidates

Yield one `ActivityRetirement` for each activity to check. Here, an
`asset_reference` object refers to an asset that is permanently deleted from
its table:

```php memo="app/Storyfeed/AssetHealer.php"
<?php

namespace App\Storyfeed;

use Illuminate\Support\Facades\DB;
use Storyfeed\Contracts\FeedHealer;
use Storyfeed\Healing\ActivityRetirement;
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
            yield new ActivityRetirement(
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

`candidates()` and `whenAbsent` must not write data, since previews also run
them. Query the source table directly so scopes or permissions cannot hide
an existing record.

### Rechecking Missing Sources

The activity or source may change after `candidates()` runs. Before deletion,
`whenAbsent` receives a fresh, locked activity. Check the activity and source
again, returning `false` if the source exists.

## Registering Healers

Register the healer in your service provider:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use App\Storyfeed\AssetHealer;
use Storyfeed\Facades\Storyfeed;

Storyfeed::healers([AssetHealer::class]);
```

Pass a class or instance. The value returned by `key()` identifies the healer
for `--only`.

<a id="running-a-healer"></a>

## Running Healers

### Previewing Soft-Deletions {#previewing-retirements}

```shell
php artisan storyfeed:heal --pretend
```

Use `--pretend` to print each request's label, outcome, and `meta` without
writing changes:

```
Preview only. Applying retirements rewrites history and bumps sync_token; accumulating clients must resync.
assets  Asset activity 81  retire  {"reason":"source permanently absent"}
assets  Asset activity 82  unchanged  {"reason":"source permanently absent"}
Would retire: 1; unchanged: 1.
```

| Outcome | When | Applying the Request |
|---|---|---|
| `retire` | the activity is live and `whenAbsent` returns true | soft-deletes the activity and changes `sync_token` |
| `unchanged` | the activity is deleted or gone, or `whenAbsent` returns false | nothing |

### Applying Soft-Deletions {#applying-retirements}

```shell
php artisan storyfeed:heal --only=assets
php artisan storyfeed:heal
```

Without `--only`, all healers run. Each soft-deletion commits separately, so
a failure does not undo earlier changes.

<a id="testing-a-healer"></a>

## Testing Healers

Test the command with `AssetHealer` registered. Given `$existingAssetActivity` for an existing asset and `$deletedAssetActivity`
for a permanently deleted one:

```php memo="tests/Feature/FeedTest.php"
$this->artisan('storyfeed:heal', ['--pretend' => true, '--only' => ['assets']])
    ->assertSuccessful();

expect($deletedAssetActivity->fresh()->trashed())->toBeFalse();

$this->artisan('storyfeed:heal', ['--only' => ['assets']])
    ->assertSuccessful();

expect($deletedAssetActivity->fresh()->trashed())->toBeTrue()
    ->and($existingAssetActivity->fresh()->trashed())->toBeFalse();
```
