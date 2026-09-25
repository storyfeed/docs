# Schema

## Introduction

The published migrations create nine tables. `storyfeed:install` publishes
them, or publish them yourself:

```bash
php artisan vendor:publish --tag=storyfeed-migrations
```

Table names can be changed in [Configuration](/reference/configuration#tables-and-models).
The migrations create the indexes Storyfeed's reads use.

## Activity Storage

### `feed_activities`

One row per activity, soft-deleted by `deleteFromFeed()`. The `uid` column is
the ULID a payload's `id` carries. Role columns store morph aliases, so an
alias that changes or disappears from the morph map leaves the activity
unresolved.

### `feed_snapshots`

One row per model: the label, data and bodies `toFeed()` produced. A feed
read takes each entity's label and link from here, not from the live model. [`storyfeed:trickle`](/reference/commands#scheduled)
fills and refreshes it, and [`storyfeed:rebuild`](/reference/commands#rebuilding-snapshots)
rebuilds it. Its model key column is an unsigned big integer, and does not hold UUID keys.

## Grouping and Batching

### `feed_groupings`

The grouping candidates for each activity and the axis chosen for it.
[`storyfeed:curate --rehash`](/reference/commands#rehashing-existing-rows) rebuilds it.

### `feed_batches`

Bursts of activity by one actor, open until the quiet window closes them.

### `feed_batch_locks`

One row per batched actor, so two publishes at once by one actor join the same
batch.

## Participants

### `feed_parties`

Named participants with no model in your app.

### `feed_participants`

One row per activity and filled role: the index `involving()` and
`$model->storyfeed()` read. [`storyfeed:participants`](/reference/commands#other-maintenance-commands)
rebuilds it.

## Deletion and Metadata

### `feed_tombstones`

One row per deleted model, which its activities point at instead. Its alias is
`storyfeed.tombstone`, whatever your morph map says. See [Deleted Models](/deeper/deleted-models).

### `feed_meta`

Storyfeed's own bookkeeping, including the sync token.
