# Configuration

## Introduction

All keys in `config/storyfeed.php` have defaults.

## Publishing Configuration

Publish the configuration file when you need to change the defaults:

```bash
php artisan vendor:publish --tag="storyfeed-config"
```

## Definitions

| Key | Default | Description |
|---|---|---|
| `definitions` | `base_path('routes/feed.php')` | path to the [feed file](/basics/the-feed-file); set `false` to disable loading |

After editing cached definitions, run `storyfeed:cache` again.

<span id="tables-models"></span>

## Tables and Models

| Key | Default | Description |
|---|---|---|
| `tables.activities` | `'feed_activities'` | the activities |
| `tables.snapshots` | `'feed_snapshots'` | entity snapshots |
| `tables.groupings` | `'feed_groupings'` | each activity's groupings |
| `tables.participants` | `'feed_participants'` | index queried by `involving()` |
| `tables.parties` | `'feed_parties'` | named participants |
| `tables.batches` | `'feed_batches'` | an actor's collected activities |
| `tables.meta` | `'feed_meta'` | sync tokens and maintenance metadata |
| `tables.tombstones` | `'feed_tombstones'` | deleted models |
| `tables.batch_locks` | `'feed_batch_locks'` | one lock per batched actor |
| `models.activity` | `Activity::class` | |
| `models.snapshot` | `Snapshot::class` | |
| `models.grouping` | `Grouping::class` | |
| `models.party` | `Party::class` | |
| `models.batch` | `Batch::class` | |
| `models.meta` | `Meta::class` | |
| `models.tombstone` | `FeedTombstone::class` | |

Change table names to avoid collisions or use existing feed tables.
Replacement models must extend the defaults in `Storyfeed\Models`.
See [Schema](/reference/schema) for each table.

## Identity

| Key | Default | Description |
|---|---|---|
| `morph_alias` | `'storyfeed.party'` | the morph alias for parties |
| `morph_map` | `[]` | merged into the app's morph map at boot |
| `actor_resolver` | `null` | invokable class resolving the default actor; `null` = authenticated user |
| `parties.fallback` | `null` | fallback party when no actor is resolved, such as in jobs or commands |
| `parties.strict` | `null` | reject undeclared party names after registering a list with [`Storyfeed::parties()`](/deeper/parties#declaring-parties); ignored without a list. `null` enables this only in local/testing |

See [Parties & Anonymous Actors](/deeper/parties) for named system actors and
activities without a recorded actor.

## Recording

| Key | Default | Description |
|---|---|---|
| `recording.enabled` | `env('STORYFEED_RECORDING_ENABLED', true)` | when disabled, every `publish()` returns an unsaved activity and no event is dispatched. Set it in `phpunit.xml`, and opt tests back in with `Storyfeed\Testing\RecordsStories` |
| `keep_latest.delete` | `'soft'` | how [`keepLatest()`](/deeper/keeping-the-latest-activity#deleting-superseded-activities) deletes superseded activities. `'soft'` soft-deletes them until `storyfeed:prune` removes them; `'force'` deletes them immediately. Any other value throws when publishing |

### Verbs

| Key | Default | Description |
|---|---|---|
| `verbs.strict` | `null` | throw on a verb with no registry entry. `null` = strict in local/testing only |

Register verbs with `Storyfeed::verbs()` or a Story class. See
[Verb Vocabulary](/reference/verbs#registering-verbs).

## Grouping

| Key | Default | Description |
|---|---|---|
| `grouping.strategy` | `MultiAxisStrategy::class` | grouping strategy; use `NullStrategy` to disable grouping |
| `grouping.default` | `'live'` | default read mode: `'log'` for individual activities, `'live'` for selected groups, `'summary'` for per-actor summaries |
| `grouping.curate` | `true` | choose which group shows each activity at publication; `false` limits `live()` to repeats |
| `grouping.summary.phrases` | `3` | maximum phrases per summary row; `phrases_truncated` reports omitted phrases |
| `grouping.children_limit` | `25` | maximum member nodes nested in each group; `count` remains the full total |
| `grouping.sample_limits.<role>` | `3` | distinct entities sampled per singular role on a group node; resolved whenever a page is retrieved. Invalid or missing limits use `3` |
| `grouping.policy.min_actors` | `3` | distinct actors required for the `actors` axis |
| `grouping.policy.min_targets` | `2` | distinct targets required for `targets` |
| `grouping.policy.min_target_members` | `3` | activities required for `targets` |
| `grouping.policy.min_object_members` | `2` | activities required for `object` |

`sample_limits` uses singular role names: `actor`, `object`, `target`,
`context`, `origin`, `result`, and `instrument`. Each defaults to `3`.
Increase a limit when your frontend displays more names:

```php memo="config/storyfeed.php"
'sample_limits' => [
    'object' => 6,  // this feed shows the objects' pictures
    // everything else stays at 3
],
```

`children_limit` still caps the sample.

<span id="batches-composites"></span>

### Batches and Composites

| Key | Default | Description |
|---|---|---|
| `grouping.batch.enabled` | `true` | collect an actor's activities into batches |
| `grouping.batch.quiet_minutes` | `10` | minutes to wait for more activities before closing a batch |
| `grouping.composite.auto` | `true` | combine `Bundleable` activities into composites when a batch closes |
| `grouping.composite.min_objects` | `2` | minimum distinct objects per composite |

## Hydration

| Key | Default | Description |
|---|---|---|
| `hydration.enabled` | `true` | whether [`$context->model()`](/reference/feedable#context-model) loads the current model, with one query per class per page. When disabled, it returns `null` for your resolver to handle |

<span id="as2-0-routes"></span>

## Activity Streams Routes

| Key | Default | Description |
|---|---|---|
| `routes.enabled` | `false` | enable the read-only single-activity endpoint |
| `routes.prefix` | `'storyfeed'` | route prefix used in activity IRIs; changing it changes document IDs |
| `routes.middleware` | `[]` | authentication or throttling middleware |

## Maintenance

| Key | Default | Description |
|---|---|---|
| `curate.schedule` | `true` | run [`storyfeed:curate`](/reference/commands#other-maintenance-commands) hourly to choose groups for recent activities; requires Laravel's scheduler |
| `curate.window` | `2` | days included in scheduled grouping; weekly and monthly declarations extend this for their verbs. `null` or `0` includes all activities |
| `prune.after_days` | `null` | default [retention period](/deeper/retention); `null` keeps activities. Per-verb `keepFor()` or `keepForever()` takes precedence |
| `trickle.limit` | `200` | activities processed per [`storyfeed:trickle`](/reference/commands#scheduled) run |
| `trickle.prune` | `false` | delete activities with an unresolvable role; otherwise count them |

## Diagnostics

| Key | Default | Description |
|---|---|---|
| `doctor.stale_after` | `30` | days without new activity before the doctor reports a stale feed; `null` disables |
| `grammar.strict` | `null` | throw when publishing a pair with no headline. `null` = local/testing only |
| `discovery.paths` | `null` | where `storyfeed:stories` and doctor look for feedable models, stories and `PublishesToFeed` classes; `null` = `app_path()`. Not used at runtime |
| `demo.enabled` | `false` | register the vocabulary used by `storyfeed:demo` so seeded activities render; enable only in the demo environment |
