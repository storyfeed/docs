# Schema

Six tables, created by the published migrations. Useful when reasoning about
indexes and retention.

## `feed_activities`

The atomic timeline.

| column | |
|---|---|
| `id` | internal PK, never exposed |
| `uid` | public ULID — the id in the payload, and the durable address of a fact |
| `verb` | free-form string, indexed |
| `{actor,object,target,context}_type` / `_id` | nullable morphs, storing **aliases** |
| `cached_{role}_id` | FK to the snapshot row |
| `data` | activity-level JSON payload |
| `published_at` | the sort key; nullable, stamped at publish |
| timestamps, `deleted_at` | soft deletes |

## `feed_snapshots`

Denormalized entity labels and data, so reads never touch your domain tables.
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

## `feed_meta`

Package-owned bookkeeping — the sync token lives here.

## Migration policy

Migrations are **published into your app**, which has one consequence worth
internalizing: any change to a create stub is invisible to every install that
already ran it.

So until 1.0, schema changes ship as **additive, guarded `add_*` migrations**,
never edits to a create stub. There will be exactly one consolidation at 1.0,
with an explicit upgrade step.

### If you published before v0.5

::: warning
Early versions folded a column into its create stub. If you published
migrations before that fold and later republish, you can end up with both the
folded stub *and* your standalone `add_*` migration — and `migrate:fresh` dies
mid-run on the duplicate column. Delete the orphaned `add_*` file, then run a
full rebuild to confirm.

Verify a republish with `php artisan migrate:fresh` locally **before** deploying
it. Applies to installs that published before v0.5; the 1.0 consolidation
resolves it.
:::
