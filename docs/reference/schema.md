# Schema

## Introduction

Storyfeed's migrations create <!-- schema:count -->nine<!-- /schema --> tables. Publish them with `storyfeed:install`
or the following command:

```bash
php artisan vendor:publish --tag=storyfeed-migrations
```

Set table names in [Configuration](/reference/configuration#tables-and-models).
The migrations include indexes for feed queries. They declare no foreign key
constraints: the keys below are the ones Storyfeed joins on.
[Storage Architecture](/reference/storage) shows which rows a publish writes and how a
feed is retrieved from them.

## Tables at a Glance

<!-- schema:diagram -->
<div class="er-wrap">
<svg class="er" viewBox="0 0 724 1075" role="img" aria-labelledby="er-title" xmlns="http://www.w3.org/2000/svg">
<title id="er-title">The 9 tables Storyfeed creates, and how they reference each other</title>
<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="ah"/></marker></defs>
<path class="e" d="M380 117 H340 V51 H313" marker-end="url(#arr)"/>
<path class="e d" d="M380 139 H358 V481 H313" marker-end="url(#arr)"/>
<path class="e d" d="M358 341 H313" marker-end="url(#arr)"/>
<path class="e" d="M680 408 H698 V51 H683" marker-end="url(#arr)"/>
<path class="e" d="M680 638 H698 V408"/>
<path class="e d" d="M680 452 H714 V868 H683" marker-end="url(#arr)"/>
<path class="e d" d="M310 853 H350 V846 H377" marker-end="url(#arr)"/>
<text class="el" x="10" y="1045">solid: an id column Storyfeed joins on · dashed: a morph reference, or a key</text>
<text class="el" x="10" y="1063">held in another column · no foreign key constraints are declared</text>
<text class="el" x="676" y="337" text-anchor="end">batch rows: hash = feed_batches.uid</text>
<g transform="translate(380,10)">
<rect class="box" width="300" height="310" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_activities</text>
<text class="c" x="12" y="46">id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">uid</text>
<text class="n" x="288" y="68" text-anchor="end">ULID · unique</text>
<text class="c" x="12" y="90">verb</text>
<text class="n" x="288" y="90" text-anchor="end">index</text>
<text class="c" x="12" y="112">cached_{role}_id</text>
<text class="n" x="288" y="112" text-anchor="end">snapshot × 7</text>
<text class="c" x="12" y="134">{role}_type, {role}_id</text>
<text class="n" x="288" y="134" text-anchor="end">morph × 7</text>
<text class="c" x="12" y="156">data</text>
<text class="n" x="288" y="156" text-anchor="end">json</text>
<text class="c" x="12" y="178">published_at</text>
<text class="n" x="288" y="178" text-anchor="end">timestamp(6)</text>
<text class="c" x="12" y="200">created_at, updated_at</text>
<text class="c" x="12" y="222">deleted_at</text>
<text class="n" x="288" y="222" text-anchor="end">soft delete</text>
<line class="sep" x1="8" x2="292" y1="232" y2="232"/>
<text class="i" x="12" y="248" xml:space="preserve">(published_at, id)</text>
<text class="i" x="12" y="266" xml:space="preserve">({role}_type, {role}_id,</text>
<text class="i" x="12" y="284" xml:space="preserve">   published_at, id)</text>
<text class="i" x="12" y="302" xml:space="preserve">   actor, object, target, context</text>
</g>
<g transform="translate(10,10)">
<rect class="box" width="300" height="234" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_snapshots</text>
<text class="c" x="12" y="46">id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">model_type, model_id</text>
<text class="n" x="288" y="68" text-anchor="end">unique</text>
<text class="c" x="12" y="90">label</text>
<text class="c" x="12" y="112">data, body</text>
<text class="n" x="288" y="112" text-anchor="end">json</text>
<text class="c" x="12" y="134">content, media_type</text>
<text class="c" x="12" y="156">attributed_to</text>
<text class="c" x="12" y="178">shape</text>
<text class="n" x="288" y="178" text-anchor="end">index</text>
<text class="c" x="12" y="200">source_updated_at</text>
<text class="c" x="12" y="222">meta</text>
<text class="n" x="288" y="222" text-anchor="end">json</text>
</g>
<g transform="translate(10,300)">
<rect class="box" width="300" height="124" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_parties</text>
<text class="c" x="12" y="46">id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">key</text>
<text class="n" x="288" y="68" text-anchor="end">unique</text>
<text class="c" x="12" y="90">name, type</text>
<text class="c" x="12" y="112">data</text>
<text class="n" x="288" y="112" text-anchor="end">json</text>
</g>
<g transform="translate(10,440)">
<rect class="box" width="300" height="146" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_tombstones</text>
<text class="c" x="12" y="46">id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">model_type, model_id</text>
<text class="n" x="288" y="68" text-anchor="end">unique</text>
<text class="c" x="12" y="90">restorable, approximate</text>
<text class="n" x="288" y="90" text-anchor="end">bool</text>
<text class="c" x="12" y="112">deleted_at, label</text>
<text class="c" x="12" y="134">meta</text>
<text class="n" x="288" y="134" text-anchor="end">json</text>
</g>
<g transform="translate(380,345)">
<rect class="box" width="300" height="204" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_groupings</text>
<text class="c" x="12" y="46">id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">activity_id</text>
<text class="n" x="288" y="68" text-anchor="end">→ activity</text>
<text class="c" x="12" y="90">bucket</text>
<text class="n" x="288" y="90" text-anchor="end">axis name</text>
<text class="c" x="12" y="112">hash</text>
<text class="n" x="288" y="112" text-anchor="end">group key</text>
<text class="c" x="12" y="134">winner</text>
<text class="n" x="288" y="134" text-anchor="end">bool or null</text>
<line class="sep" x1="8" x2="292" y1="144" y2="144"/>
<text class="i" x="12" y="160" xml:space="preserve">unique (activity_id, bucket)</text>
<text class="i" x="12" y="178" xml:space="preserve">(bucket, hash)</text>
<text class="i" x="12" y="196" xml:space="preserve">(winner, bucket, hash)</text>
</g>
<g transform="translate(380,575)">
<rect class="box" width="300" height="204" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_participants</text>
<text class="c" x="12" y="46">id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">activity_id</text>
<text class="n" x="288" y="68" text-anchor="end">→ activity</text>
<text class="c" x="12" y="90">role</text>
<text class="c" x="12" y="112">entity_type, entity_id</text>
<text class="c" x="12" y="134">published_at</text>
<text class="n" x="288" y="134" text-anchor="end">copied</text>
<line class="sep" x1="8" x2="292" y1="144" y2="144"/>
<text class="i" x="12" y="160" xml:space="preserve">unique (activity_id, role)</text>
<text class="i" x="12" y="178" xml:space="preserve">(entity_type, entity_id,</text>
<text class="i" x="12" y="196" xml:space="preserve">   published_at, activity_id)</text>
</g>
<g transform="translate(380,805)">
<rect class="box" width="300" height="208" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_batches</text>
<text class="c" x="12" y="46">id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">uid</text>
<text class="n" x="288" y="68" text-anchor="end">ULID · unique</text>
<text class="c" x="12" y="90">actor_type, actor_id</text>
<text class="c" x="12" y="112">opened_at, closes_at</text>
<text class="c" x="12" y="134">closed_at</text>
<text class="n" x="288" y="134" text-anchor="end">null = open</text>
<text class="c" x="12" y="156">activities_count</text>
<line class="sep" x1="8" x2="292" y1="166" y2="166"/>
<text class="i" x="12" y="182" xml:space="preserve">(actor_type, actor_id, closed_at)</text>
<text class="i" x="12" y="200" xml:space="preserve">(closed_at, closes_at)</text>
</g>
<g transform="translate(10,790)">
<rect class="box" width="300" height="102" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_batch_locks</text>
<text class="c" x="12" y="46">actor_type, actor_id</text>
<text class="n" x="288" y="46" text-anchor="end">PK</text>
<text class="c" x="12" y="68">open_batches</text>
<text class="n" x="288" y="68" text-anchor="end">json</text>
<text class="c" x="12" y="90">locked_at</text>
</g>
<g transform="translate(10,640)">
<rect class="box" width="300" height="80" rx="8"/>
<path class="head" d="M0 8a8 8 0 0 1 8-8h284a8 8 0 0 1 8 8v22h-300z"/>
<text class="tn" x="12" y="20">feed_meta</text>
<text class="c" x="12" y="46">key</text>
<text class="n" x="288" y="46" text-anchor="end">unique</text>
<text class="c" x="12" y="68">value</text>
<text class="n" x="288" y="68" text-anchor="end">sync_token</text>
</g>
</svg>
</div>
<!-- /schema -->

Each role is stored as a morph pair, `{role}_type` and `{role}_id`, holding the
model's morph alias and key. Next to it, `cached_{role}_id` points at the
entity's snapshot.

## Activity Storage

### `feed_activities`

Stores one record per activity. `deleteFromFeed()` soft-deletes these records.
The `uid` ULID becomes the payload's `id`. Role columns store morph aliases;
removing or changing an alias leaves affected roles unresolved.

<!-- schema:feed_activities -->
| Column | Type | Attributes | Purpose |
|---|---|---|---|
| `id` | bigint, increments | PK | Primary key. |
| `uid` | ulid | unique | The activity's public identifier, the payload's `id`. |
| `verb` | string(255) | index | The verb, as a plain string. |
| `actor_type` | string(255) | nullable | The actor's morph alias. Null when no actor is recorded. |
| `actor_id` | unsigned bigint | nullable | The actor's key. |
| `object_type` | string(255) | nullable | The object's morph alias. |
| `object_id` | unsigned bigint | nullable | The object's key. |
| `target_type` | string(255) | nullable | The target's morph alias. |
| `target_id` | unsigned bigint | nullable | The target's key. |
| `context_type` | string(255) | nullable | The context's morph alias. |
| `context_id` | unsigned bigint | nullable | The context's key. |
| `cached_actor_id` | unsigned bigint | index, nullable | The actor's row in `feed_snapshots`. |
| `cached_object_id` | unsigned bigint | index, nullable | The object's row in `feed_snapshots`. |
| `cached_target_id` | unsigned bigint | index, nullable | The target's row in `feed_snapshots`. |
| `cached_context_id` | unsigned bigint | index, nullable | The context's row in `feed_snapshots`. |
| `data` | json | nullable | The values passed to `data()`. |
| `published_at` | timestamp(6) | nullable | When the activity happened. The feed orders by it, and only shows activities whose time has come. |
| `created_at` | timestamp(6) | nullable | When the row was written. |
| `updated_at` | timestamp(6) | nullable | When the row last changed. |
| `deleted_at` | timestamp(6) | nullable | Set when an activity is soft-deleted, by `deleteFromFeed()` for example. Soft-deleted activities are not shown. |
| `origin_type` | string(255) | nullable | The origin's morph alias. |
| `origin_id` | unsigned bigint | nullable | The origin's key. |
| `cached_origin_id` | unsigned bigint | nullable | The origin's row in `feed_snapshots`. |
| `result_type` | string(255) | nullable | The result's morph alias. |
| `result_id` | unsigned bigint | nullable | The result's key. |
| `cached_result_id` | unsigned bigint | nullable | The result's row in `feed_snapshots`. |
| `instrument_type` | string(255) | nullable | The instrument's morph alias. |
| `instrument_id` | unsigned bigint | nullable | The instrument's key. |
| `cached_instrument_id` | unsigned bigint | nullable | The instrument's row in `feed_snapshots`. |

| Index | Columns |
|---|---|
| index | `actor_type`, `actor_id` |
| index | `object_type`, `object_id` |
| index | `target_type`, `target_id` |
| index | `context_type`, `context_id` |
| index | `published_at`, `id` |
| index | `actor_type`, `actor_id`, `published_at`, `id` |
| index | `object_type`, `object_id`, `published_at`, `id` |
| index | `target_type`, `target_id`, `published_at`, `id` |
| index | `context_type`, `context_id`, `published_at`, `id` |
| index | `origin_type`, `origin_id` |
| index | `result_type`, `result_id` |
| index | `instrument_type`, `instrument_id` |
<!-- /schema -->

### `feed_snapshots`

Stores each model's label, data, and bodies from `toFeed()`. Feed retrieval
uses these snapshots to resolve entity labels and links.
[`storyfeed:trickle`](/reference/commands#scheduled) creates and refreshes
snapshots; [`storyfeed:rebuild`](/reference/commands#rebuilding-snapshots)
rebuilds them. Model keys are unsigned big integers; UUID keys are not supported.

<!-- schema:feed_snapshots -->
| Column | Type | Attributes | Purpose |
|---|---|---|---|
| `id` | bigint, increments | PK | Primary key. Activities point here through `cached_{role}_id`. |
| `model_type` | string(255) |  | The entity's morph alias. |
| `model_id` | unsigned bigint |  | The entity's key. |
| `label` | string(255) | nullable | The label from `toFeed()`. |
| `component` | string(255) | nullable | Not written by Storyfeed. |
| `data` | json | nullable | The `data` from `toFeed()`. |
| `shape` | string(40) | nullable | A fingerprint of the `toFeed()` output's structure. `storyfeed:trickle` refreshes rows whose fingerprint no longer matches. |
| `created_at` | timestamp | nullable | When the snapshot was first written. |
| `updated_at` | timestamp | nullable | When the snapshot was last written. |
| `content` | text | nullable | The entity's authored text, from `toFeed()`. |
| `media_type` | text | nullable | The encoding of `content`. |
| `attributed_to` | text | nullable | The entity's author IRI, from `toFeed()`. |
| `body` | json | nullable | The entity's bodies, from `toFeed()`. |
| `source_updated_at` | datetime(6) | nullable | The model's `updated_at` when the snapshot was taken, in UTC. Older writes are rejected only when both source timestamps are known; an incoming unknown timestamp is accepted and clears this watermark. |
| `meta` | json | nullable | The model's route key, when it differs from the primary key. |

| Index | Columns |
|---|---|
| unique | `model_type`, `model_id` |
| index | `model_type`, `shape` |
<!-- /schema -->

## Grouping and Batching

### `feed_groupings`

Stores candidate groups and the selected axis for each activity.
Rebuild it with [`storyfeed:curate --rehash`](/reference/commands#rehashing-existing-rows).

<!-- schema:feed_groupings -->
| Column | Type | Attributes | Purpose |
|---|---|---|---|
| `id` | bigint, increments | PK | Primary key. |
| `activity_id` | unsigned bigint | index | The activity this row places in a group. |
| `hash` | string(255) |  | The group's key on this axis. Activities sharing a `bucket` and `hash` form one group. |
| `bucket` | string(255) | nullable | The axis: `actors`, `targets`, `object`, `repeat`, a `summary.*` period, `batch` or `composite`. |
| `winner` | boolean | nullable | True on the row curation chose for `live()`. Null on rows that are never curated. |
| `created_at` | timestamp | nullable | When the row was written. |
| `updated_at` | timestamp | nullable | When the row last changed. |

| Index | Columns |
|---|---|
| unique | `activity_id`, `bucket` |
| index | `bucket`, `hash` |
| index | `winner`, `bucket`, `hash` |
<!-- /schema -->

### `feed_batches`

Stores an actor's activities as batches, open until the configured window
has elapsed.

The `meta` column holds application metadata. Storyfeed has no dedicated
batch-metadata setter; an application that needs it can load the configured
batch Eloquent model and update its `meta` array directly. The model casts the
column to an array. When the batch closes, `BatchClosed` listeners receive a
frozen copy of this metadata in the batch snapshot's `meta` field.

<!-- schema:feed_batches -->
| Column | Type | Attributes | Purpose |
|---|---|---|---|
| `id` | bigint, increments | PK | Primary key. |
| `uid` | ulid | unique | The batch's identifier. A `batch` grouping row's `hash` holds it. |
| `actor_type` | string(255) | nullable | The actor's morph alias. |
| `actor_id` | unsigned bigint | nullable | The actor's key. |
| `opened_at` | timestamp |  | The `published_at` of the batch's first activity. |
| `closed_at` | timestamp | index, nullable | When the batch closed. Null while it is open. |
| `activities_count` | unsigned int | default `0` | How many activities joined the batch. |
| `last_activity_at` | timestamp | nullable | The latest `published_at` among its activities. |
| `closes_at` | timestamp | nullable | When the batch ends. Each activity moves it to its own `published_at` plus its verb's window, never earlier. |
| `meta` | json | nullable | Metadata about the batch, kept without adding a column. |
| `created_at` | timestamp | nullable | When the row was written. |
| `updated_at` | timestamp | nullable | When the row last changed. |

| Index | Columns |
|---|---|
| index | `actor_type`, `actor_id` |
| index | `actor_type`, `actor_id`, `closed_at` |
| index | `closed_at`, `closes_at` |
<!-- /schema -->

### `feed_batch_locks`

Stores one lock per batched actor so concurrent publications join the same batch.

<!-- schema:feed_batch_locks -->
| Column | Type | Attributes | Purpose |
|---|---|---|---|
| `actor_type` | string(255) |  | The actor's morph alias. |
| `actor_id` | string(255) |  | The actor's key, as a string. |
| `open_batches` | json | nullable | The ids of the actor's open batches. |
| `locked_at` | timestamp | nullable | When a publish last locked the row. |

| Index | Columns |
|---|---|
| primary key | `actor_type`, `actor_id` |
<!-- /schema -->

## Participants

### `feed_parties`

Named participants with no model in your app.

<!-- schema:feed_parties -->
| Column | Type | Attributes | Purpose |
|---|---|---|---|
| `id` | bigint, increments | PK | Primary key. |
| `key` | string(255) | unique | The party's name as a slug, unless a key is given. |
| `name` | string(255) |  | The party's label in the feed. |
| `type` | string(255) | default `'Service'` | The party's Activity Streams type. |
| `data` | json | nullable | The data given to `Party::make()`. |
| `created_at` | timestamp | nullable | When the party was created. |
| `updated_at` | timestamp | nullable | When the party last changed. |
<!-- /schema -->

### `feed_participants`

Indexes each activity's filled roles for `involving()` and
`$model->storyfeed()` queries. Rebuild it with
[`storyfeed:participants`](/reference/commands#other-maintenance-commands).

<!-- schema:feed_participants -->
| Column | Type | Attributes | Purpose |
|---|---|---|---|
| `id` | bigint, increments | PK | Primary key. |
| `activity_id` | unsigned bigint |  | The activity. |
| `role` | string(20) |  | Which role the entity fills: `actor`, `object`, `target`, `context`, `origin`, `result` or `instrument`. |
| `entity_type` | string(255) |  | The entity's morph alias. |
| `entity_id` | string(255) |  | The entity's key, as a string. |
| `published_at` | timestamp(6) | nullable | Copied from the activity. The entity index narrows matching activity IDs for `involving()`; final ordering is on the outer activity query. |
| `created_at` | timestamp | nullable | When the row was written. |
| `updated_at` | timestamp | nullable | When the row last changed. |

| Index | Columns |
|---|---|
| unique | `activity_id`, `role` |
| index | `entity_type`, `entity_id`, `published_at`, `activity_id` |
<!-- /schema -->

## Deletion and Metadata

### `feed_tombstones`

Stores a tombstone for each deleted model, referenced by its activities.
The alias is always `storyfeed.tombstone`, regardless of the morph map.
See [Deleted Models](/deeper/deleted-models).

The `meta` column holds application metadata. Neither the public tombstone
entry point nor `PendingTombstone` provides a metadata setter. Applications
can update `meta` directly on the configured tombstone Eloquent model, which
casts the column to an array. This is an application-owned model write, not
an option on the deletion declaration.

<!-- schema:feed_tombstones -->
| Column | Type | Attributes | Purpose |
|---|---|---|---|
| `id` | bigint, increments | PK | Primary key. Activities point at a tombstone with the `storyfeed.tombstone` alias. |
| `model_type` | string(255) |  | The deleted model's morph alias. |
| `model_id` | string(255) |  | The deleted model's key, as a string. |
| `restorable` | boolean | default `false` | True while the model is soft-deleted and can come back. |
| `approximate` | boolean | default `false` | True when `storyfeed:trickle` found the deletion, so `deleted_at` is when it was found. |
| `deleted_at` | timestamp | nullable | When the model was deleted. |
| `label` | string(255) | nullable | The label kept for the deleted model, when it keeps one. |
| `meta` | json | nullable | Metadata about the deletion, kept without adding a column. |
| `created_at` | timestamp | nullable | When the tombstone was created. |
| `updated_at` | timestamp | nullable | When the tombstone last changed. |

| Index | Columns |
|---|---|
| unique | `model_type`, `model_id` |
<!-- /schema -->

### `feed_meta`

Stores Storyfeed metadata, including the sync token.

<!-- schema:feed_meta -->
| Column | Type | Attributes | Purpose |
|---|---|---|---|
| `id` | bigint, increments | PK | Primary key. |
| `key` | string(255) | unique | `sync_token`, trickle cursors, or `maintenance:curate:<ULID>` / `maintenance:trickle:<ULID>` entries in bounded maintenance-run history. |
| `value` | string(255) |  | The value; maintenance-run entries contain JSON counters for that completed run. |
| `created_at` | timestamp | nullable | When the row was written. |
| `updated_at` | timestamp | nullable | When the row last changed. |
<!-- /schema -->

<style scoped>
.er-wrap { margin: 24px 0; overflow-x: auto; }
.er { display: block; width: 100%; max-width: 724px; margin: 0 auto; height: auto; font-family: var(--vp-font-family-mono); }
.er .box { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-divider); stroke-width: 1.5; }
.er .head { fill: var(--vp-c-brand-soft); }
.er .tn { fill: var(--vp-c-brand-1); font-size: 15px; font-weight: 700; }
.er .c { fill: var(--vp-c-text-1); font-size: 13px; }
.er .n { fill: var(--vp-c-text-2); font-size: 12px; }
.er .i { fill: var(--vp-c-text-2); font-size: 11.5px; }
.er .sep { stroke: var(--vp-c-divider); }
.er .e { fill: none; stroke: var(--vp-c-text-2); stroke-width: 1.5; }
.er .e.d { stroke-dasharray: 5 4; }
.er .ah { fill: var(--vp-c-text-2); }
.er .el { fill: var(--vp-c-text-2); font-size: 12px; font-style: italic; }
</style>
