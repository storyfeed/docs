# Healing

A **healer** lets an app retire an existing story when its source is permanently
absent. The app describes the policy; core rechecks it against the current row
before applying a soft deletion.

## Before adopting

This version supports **permanent source absence only**: the source cannot return
with the same identity. A hard-deleted asset whose replacement gets a new ID fits
that scope. A restorable source does not. A detached asset whose row still exists
is not absent.

**The healer never treats the absence of a story as an instruction.** It does
not record missing stories, restore removed ones, replace compositions, or infer
what used to exist. An explicit retirement request for an activity that is
already deleted or gone is unchanged. Core keeps
[removal evidence](#removal-evidence-outlives-the-row) that says whether an
empty key was emptied on purpose; this version of the healer does not consult it.

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
no run record or retirement reason. An applied retirement soft-deletes through
the model, so it writes the same
[removal evidence](#removal-evidence-outlives-the-row) as any other deletion.

## Removal evidence outlives the row

A story's key is its verb plus its object: the identity `->replace()` supersedes
on. When the last live story on a key is deleted, core records the key in
`feed_removals`. Pruning removes the row; the record stays.

```php
use Storyfeed\Healing\Removals;

$removal = Removals::removed('asset.published', 'asset_reference', 81);
// with a model: Removals::removed('asset.published', $asset)

if ($removal !== null) {
    $removal->removedAt;   // when the last live story left the key
    $removal->publishedAt; // that story's own published_at
}
```

`removed()` returns `null` while a live story exists on the key, whatever the
table holds. A `null` therefore means a story is live, or nothing was ever
recorded there. A `Removal` means the key is empty because something removed it.
An activity without an object has no key; asking about one throws.

| what happened on the key | evidence |
|---|---|
| `delete()` or `forceDelete()` on the last live story | written |
| a `Feedable` deleted or force-deleted, for every key it empties | written |
| an applied `storyfeed:heal` retirement | written |
| `storyfeed:trickle --prune` retiring an activity | written |
| `->replace()` superseding an earlier story | none: the successor is live on the key |
| `storyfeed:prune` removing a row that was already soft-deleted | none: its removal, if it was one, was recorded when it left |
| `storyfeed:prune` removing a live row past the window | none: the [watermark](#the-retention-watermark) records it |
| a delete inside a transaction that rolls back | none |

Evidence is written per key, not per row, and only when the key empties. A bulk
delete adds one query and one upsert per chunk of 500 rows; deleting one model
adds two statements. A prune sweep writes nothing to the table, however many
rows it removes. Nothing in core deletes from `feed_removals`: the evidence has
no retention window. The cost is one small row per removed key.

### The retention watermark

A story older than the retention window is absent because it expired. Every
`storyfeed:prune` sweep records its cutoff after it completes, and a later sweep
with a longer window never lowers it.

```php
$expired = Removals::prunedBefore(); // null until a sweep has run

if ($expired !== null && $publishedAt < $expired) {
    // the story was pruned; do not re-derive it
}
```

`feed_removals` is a new table. Publish and run the migration; `storyfeed:doctor`
reports it missing until then. Evidence starts when the table exists: a story
soft-deleted before that carries none, and pruning it afterwards leaves the key
looking never recorded. A deletion that bypasses the model and the package's own
paths, such as raw SQL, writes nothing.

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
