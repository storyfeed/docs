# Schema

## Introduction

The published migrations create nine tables for activities, snapshots and
feed maintenance. Table names can be changed in [Configuration](/reference/configuration#tables-and-models).

## Activity Storage

### `feed_activities`

The atomic timeline.

| Column |  |
|---|---|
| `id` | internal PK; event snapshots carry it, feed nodes use `uid` |
| `uid` | public ULID — the id in the payload, and the durable address of a fact |
| `verb` | free-form string, indexed |
| `{actor,object,target,context,origin,result,instrument}_type` / `_id` | nullable morphs, storing **aliases** |
| `cached_{role}_id` | nullable snapshot row id for each of the seven roles |
| `data` | activity-level JSON payload |
| `published_at` | the sort key; nullable, stamped at publish |
| timestamps, `deleted_at` | soft deletes |

### `feed_snapshots`

Denormalized entity labels, data, and optional body fields. Reads use these
snapshots unless a [media resolver](/reference/feedable#the-contract) loads the
live model. Written at publish, refreshed on model save, backfilled by
`storyfeed:trickle`.

| Column | Holds |
|---|---|
| `id` | internal snapshot key |
| `model_type`, `model_id` | morph alias and unsigned bigint model key, unique together; `model_id` does not store UUIDs |
| `label` | nullable entity label |
| `data` | nullable JSON snapshot data |
| `body` | nullable JSON body list |
| `content`, `media_type`, `attributed_to` | nullable authored text, its encoding and author IRI |
| `source_updated_at` | nullable source-model timestamp with microsecond precision |
| `shape` | nullable 40-character snapshot shape fingerprint |
| `meta` | nullable JSON extras |
| `component` | unused, nullable string |
| `created_at`, `updated_at` | snapshot timestamps |

The `meta` column is a JSON column that holds Storyfeed's own extras for a
snapshot: today, the model's route key, when it is not the primary key.
Nothing is ever queried or indexed through `meta`; anything a query filters,
sorts or joins on is a real column, like `shape`. Your `toFeed()` values stay
in `data`. The two are never merged, and `$context->data()` never returns
`meta`. The `component` column is unused.

## Grouping and Batching

### `feed_groupings`

Grouping candidates, one row per activity per applicable axis, computed at
publish time. The `winner` column records the selected axis. Batch membership
rides these rows.

### `feed_batches`

Bursts of activity by one actor, with `activities_count` and
`last_activity_at`, a scheduled `closes_at`, and `closed_at` once closed.
The quiet window sets `closes_at`; closing fires `BatchClosed` and can create
composites.

### `feed_batch_locks`

One row per actor that has been batched, keyed `(actor_type, actor_id)`, with
the ids of the actor's open batches. A publish takes the actor's row before
choosing a batch, so two publishes at once by one actor join the same batch.
The key is a string, so UUID and ULID actors fit. Nothing in the feed reads it.

## Participants

### `feed_parties`

Named participants with no model in your app.

### `feed_participants`

One row per (activity, filled role): `activity_id`, `role`, `entity_type`
(alias), `entity_id`, and a denormalized `published_at`. Indexed
`(entity_type, entity_id, published_at, activity_id)`, so `involving()` is a
single ordered lookup. Written in the publish transaction; backfilled by
`storyfeed:participants`.

## Deletion and Metadata

### `feed_tombstones`

What a deleted model leaves behind, one row per deleted model. Every reference
to the model, in every role column, its `cached_*_id` and `feed_participants`,
points at its tombstone instead. See [Deleted Models](/deeper/deleted-models).

| Column |  |
|---|---|
| `id` | the tombstone's key, and the entity `id` in the payload |
| `model_type` / `model_id` | the deleted model's alias and key; unique together. The key is a string, so UUID and ULID keys fit |
| `restorable` | true while the model can come back (a soft delete); false once it is gone for good |
| `approximate` | true when the trickle found the deletion, so `deleted_at` is when it was found |
| `deleted_at` | when the model was deleted, or found deleted |
| `label` | the model's label, only when it asked for `keepLabel()` |
| `meta` | JSON, Storyfeed's own extras |
| timestamps | |

Its alias is `storyfeed.tombstone`, whatever your morph map says.

### `feed_meta`

Package-owned bookkeeping — the sync token lives here.
