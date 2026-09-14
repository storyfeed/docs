# Schema

Seven tables, created by the published migrations. Useful when reasoning about
indexes and retention.

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
snapshots unless a [media resolver](/reference/feedable#the-contract)
opts into a live model lookup.
Written at publish, refreshed on model save, backfilled by `storyfeed:trickle`.

## `feed_groupings`

Grouping candidates, one row per activity per applicable axis, computed at
publish time. The `winner` column records the selected axis. Batch membership
rides these rows.

## `feed_parties`

Named participants with no model in your app.

## `feed_batches`

Bursts of activity by one actor, with `activities_count` and
`last_activity_at`. Closed by quiet window; closing fires `BatchClosed` and
mints composites.

## `feed_participants`

One row per (activity, filled role): `activity_id`, `role`, `entity_type`
(alias), `entity_id`, and a denormalized `published_at`. Indexed
`(entity_type, entity_id, published_at, activity_id)`, which is what makes
`involving()` a single ordered lookup instead of an OR across the morph
columns. Written in the publish transaction; backfilled by
`storyfeed:participants`.

## `feed_meta`

Package-owned bookkeeping — the sync token lives here.

## Migration Policy

Migrations are **published into your app**, which has one consequence worth
internalizing: any change to a create stub is invisible to every install that
already ran it. So schema changes ship as **additive, guarded `add_*`
migrations**, never edits to a create stub.

