# Healing

A **healer** lets an app retire an existing story when its source is permanently
absent. The app describes the policy; core rechecks it against the current row
before applying a soft deletion.

## Before adopting

This version supports **permanent source absence only**: the source cannot return
with the same identity. A hard-deleted asset whose replacement gets a new ID fits
that scope. A restorable source does not. A detached asset whose row still exists
is not absent.

The healer cannot distinguish a deliberate story removal from a gap after
pruning has erased the removal evidence. **It never treats the absence of a story
as an instruction.** It does not record missing stories, restore removed ones,
replace compositions, or infer what used to exist. An explicit retirement request
for an activity that is already deleted or gone is unchanged.

Retirement is app policy. A source disappearing does not by itself make a
historical story untrue: the app must decide which stories should be retired.
Core does not discover missing sources or apply a default deletion policy.

::: warning Healing rewrites settled history
`storyfeed:heal` is a third `sync_token` writer, alongside `storyfeed:curate --rehash` and `storyfeed:bundle`.
Every applied retirement bumps the feed's `sync_token`, so accumulating clients
must discard their accumulated pages and refetch — the same resync contract as
[`storyfeed:curate --rehash`](/reference/commands#rehash-when-the-grouping-recipe-changes-underneath-existing-rows).
A reader holding an earlier cursor may see an empty page before refetching.
Preview first, prefer a quiet period, and avoid a fixed reading window. Core does
not schedule healers.
:::

## A healer

Enumerate existing stories, including those whose sources have disappeared.
This example uses a synthetic `asset_reference` object backed by a hard-deleting
`assets` table. The alias and the source lookup are app-owned.

```php
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
            ->where('verb', 'asset.published')
            ->where('object_type', 'asset_reference')
            ->lazyById() as $activity) {
            yield new StoryRetirement(
                label: "Asset story {$activity->id}",
                activityId: $activity->id,
                whenAbsent: static fn (Activity $live): bool =>
                    $live->verb === 'asset.published'
                    && $live->object_type === 'asset_reference'
                    && ! DB::table('assets')->where('id', $live->object_id)->exists(),
                meta: ['reason' => 'source permanently absent'],
            );
        }
    }
}
```

`candidates()` and `whenAbsent` **must write nothing**. They run during preview as
well as application. The source query must test real absence, not visibility,
attachment, permissions, or a model scope that hides a still-present row.

Core reloads the activity by its physical ID and takes `lockForUpdate()` inside
a transaction before calling `whenAbsent`. Activities must use the default database connection,
where the participant index and sync token are written; a separate activity
connection is rejected in preview and application. The callback receives that fresh row,
so check its policy eligibility as well as its source. Do not capture an earlier
absence result in the closure: a source present at execution time must yield
`false`, even if a preview previously reported `retire`. The lock protects the
activity; it does not lock an absent source or make a restorable source permanent.

Register the healer beside your feeds:

```php
use App\Storyfeed\AssetHealer;
use Storyfeed\Facades\Storyfeed;

Storyfeed::healers([AssetHealer::class]);
```

Classes resolve through the container. Instances are also accepted. The healer's
`key()` names it for selection; later registration of the same key replaces the
earlier registration. Use `merge: false` to replace the whole registry.

## Running it

```bash
php artisan storyfeed:heal --dry-run
php artisan storyfeed:heal --only=assets
php artisan storyfeed:heal
```

Start with `--dry-run`. It walks the selected healers and prints every request's
label, outcome, and optional metadata. It reads current rows and evaluates the
predicates without locks or writes. A preview is not a reservation: the applying
run evaluates policy again.

```
assets   Asset story 81   retire      {"reason":"source permanently absent"}
assets   Asset story 82   unchanged   {"reason":"source permanently absent"}
```

| outcome | when | applying the request |
|---|---|---|
| `retire` | the activity is live and the predicate confirms permanent source absence | soft-delete that activity and bump `sync_token` in the same transaction |
| `unchanged` | the activity is deleted or gone, or the predicate is false | nothing |

An app model hook can veto deletion; the applying run then reports `unchanged`.
Repeat `--only` to select several keys. An unknown key fails before any healer
runs. No selection runs every registered healer; an empty registry does nothing.

Each request commits separately. If a later request fails, earlier retirements
remain committed with their resync signal. Results stream in memory; core stores
no run record, retirement reason, resurrection flag, or removal tombstone.

## Removal evidence has a lifetime

A live sibling on the same verb-plus-object key describes **current key state**,
not provenance. A superseded row can lose its live sibling when the successor is
deleted. The rows alone do not then explain why no live story remains.

Pruning can also permanently delete soft-deleted activities. Once that evidence
is gone, an empty key cannot reveal whether a story was deliberately removed or
never recorded. This is why this healer only acts on explicit requests about
existing live activities, and offers no gap-filling or resurrection guarantee.

Broader healing would need a separate retention contract: either durable removal
evidence that survives pruning, or changed deletion semantics that preserve the
necessary evidence. Neither choice is part of this version.

## Testing a healer

Exercise the registered command, rather than trying to run the `FeedHealer`
interface. Its methods are `key()` and `candidates()`; it has no `run()` method or
single interface binding.

With an `AssetHealer` registered and two existing activity fixtures, one backed
by a present asset and the other by a permanently deleted asset:

```php
$this->artisan('storyfeed:heal', ['--dry-run' => true, '--only' => ['assets']])
    ->assertSuccessful();

expect($absentSourceStory->fresh()->trashed())->toBeFalse();

$this->artisan('storyfeed:heal', ['--only' => ['assets']])
    ->assertSuccessful();

expect($absentSourceStory->fresh()->trashed())->toBeTrue()
    ->and($presentSourceStory->fresh()->trashed())->toBeFalse();
```

Also assert that a detached-but-present source is unchanged, and that a source
present by execution time prevents a previously previewed retirement. Repeating
a run must not create stories, including after a removed story has been pruned.
A healer that yields nothing makes no claim about any existing row.
