# Schema

## Introduction

Storyfeed's migrations create nine tables. Publish them with `storyfeed:install`
or the following command:

```bash
php artisan vendor:publish --tag=storyfeed-migrations
```

Set table names in [Configuration](/reference/configuration#tables-and-models).
The migrations include indexes for feed queries.

## Activity Storage

### `feed_activities`

Stores one record per activity. `deleteFromFeed()` soft-deletes these records.
The `uid` ULID becomes the payload's `id`. Role columns store morph aliases;
removing or changing an alias leaves affected roles unresolved.

### `feed_snapshots`

Stores each model's label, data, and bodies from `toFeed()`. Feed retrieval
uses these snapshots to resolve entity labels and links.
[`storyfeed:trickle`](/reference/commands#scheduled) creates and refreshes
snapshots; [`storyfeed:rebuild`](/reference/commands#rebuilding-snapshots)
rebuilds them. Model keys are unsigned big integers; UUID keys are not supported.

## Grouping and Batching

### `feed_groupings`

Stores candidate groups and the selected axis for each activity.
Rebuild it with [`storyfeed:curate --rehash`](/reference/commands#rehashing-existing-rows).

### `feed_batches`

Stores an actor's activities as batches, open until the configured window
has elapsed.

### `feed_batch_locks`

Stores one lock per batched actor so concurrent publications join the same batch.

## Participants

### `feed_parties`

Named participants with no model in your app.

### `feed_participants`

Indexes each activity's filled roles for `involving()` and
`$model->storyfeed()` queries. Rebuild it with
[`storyfeed:participants`](/reference/commands#other-maintenance-commands).

## Deletion and Metadata

### `feed_tombstones`

Stores a tombstone for each deleted model, referenced by its activities.
The alias is always `storyfeed.tombstone`, regardless of the morph map.
See [Deleted Models](/deeper/deleted-models).

### `feed_meta`

Stores Storyfeed metadata, including the sync token.
