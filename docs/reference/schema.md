# Schema

Seven tables, created by the published migrations.

## `feed_activities`

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

## `feed_snapshots`

Denormalized entity labels, data, and optional body fields. Reads use these
snapshots unless a [media resolver](/reference/feedable#the-contract) loads the
live model. Written at publish, refreshed on model save, backfilled by
`storyfeed:trickle`.

The `meta` column is a JSON column that holds Storyfeed's own extras for a
snapshot: today, the model's route key, when it is not the primary key.
Nothing is ever queried or indexed through `meta`; anything a query filters,
sorts or joins on is a real column, like `shape`. Your `toFeed()` values stay
in `data`. The two are never merged, and `$context->data()` never returns
`meta`.

## `feed_groupings`

Grouping candidates, one row per activity per applicable axis, computed at
publish time. The `winner` column records the selected axis. Batch membership
rides these rows.

## `feed_parties`

Named participants with no model in your app.

## `feed_batches`

Bursts of activity by one actor, with `activities_count` and
`last_activity_at`. Closed by quiet window; closing fires `BatchClosed` and
creates composites.

## `feed_participants`

One row per (activity, filled role): `activity_id`, `role`, `entity_type`
(alias), `entity_id`, and a denormalized `published_at`. Indexed
`(entity_type, entity_id, published_at, activity_id)`, so `involving()` is a
single ordered lookup. Written in the publish transaction; backfilled by
`storyfeed:participants`.

## `feed_meta`

Package-owned bookkeeping — the sync token lives here.
