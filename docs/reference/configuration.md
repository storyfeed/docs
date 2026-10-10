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
| `definitions` | `base_path('routes/feed.php')` | path to the [feed file](/basics/the-feed-file); set `false` to disable file loading. [Provider registrations](/deeper/package-integration#registering-stories-in-a-service-provider) remain available |

After editing cached definitions, run `storyfeed:cache` again.

## Sources

| Key | Default | Description |
|---|---|---|
| `sources.<name>` | `['database' => ['driver' => 'database']]` | named [feed sources](/basics/feed-sources), each with a `driver`: `database`, `array` (reading its `items`), or one registered with `Storyfeed::extend()`. A feed reads the database unless it calls `source()` |

<span id="tables-models"></span>

## Tables and Models

| Key | Default | Description |
|---|---|---|
| `tables.activities` | `'feed_activities'` | the activities |
| `tables.snapshots` | `'feed_snapshots'` | entity snapshots |
| `tables.grouping_bursts` | `'feed_grouping_bursts'` | latest Live burst window and lock per logical axis key |
| `tables.groupings` | `'feed_groupings'` | each activity's groupings |
| `tables.participants` | `'feed_participants'` | index queried by `involving()` |
| `tables.parties` | `'feed_parties'` | named participants |
| `tables.batches` | `'feed_batches'` | an actor's collected activities |
| `tables.meta` | `'feed_meta'` | sync tokens and maintenance metadata |
| `tables.tombstones` | `'feed_tombstones'` | deleted models |
| `tables.batch_locks` | `'feed_batch_locks'` | one lock per batched actor |
| `models.activity` | `Activity::class` | the Eloquent model for activities |
| `models.snapshot` | `Snapshot::class` | the Eloquent model for entity snapshots |
| `models.grouping` | `Grouping::class` | the Eloquent model for activity groupings |
| `models.party` | `Party::class` | the Eloquent model for named parties |
| `models.batch` | `Batch::class` | the Eloquent model for actor batches |
| `models.meta` | `Meta::class` | the Eloquent model for feed metadata |
| `models.tombstone` | `FeedTombstone::class` | the Eloquent model for deleted entities |

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
| `keep_latest.delete` | `'soft'` | how [`keepLatest()`](/deeper/keeping-the-latest-activity#deleting-superseded-activities) deletes superseded activities. `'soft'` soft-deletes them, and [`storyfeed:prune`](/reference/commands#scheduled) removes them once they pass their retention window; `'force'` deletes them immediately. Any other value throws when publishing |

### Verbs

| Key | Default | Description |
|---|---|---|
| `verbs.strict` | `null` | throw on a verb with no registry entry. `null` = strict in local/testing only |

Register verbs with `Storyfeed::verbs()` or a Story class. See
[Verb Vocabulary](/reference/verbs#registering-verbs).

<a id="nested-containers"></a>

## Distant Relations

| Key | Default | Purpose |
|---|---|---|
| `ancestors.max_depth` | `10` | maximum parent links followed from each object, target or context (0–255); see [Distant Relations](/deeper/distant-relations) |

## Grouping

| Key | Default | Description |
|---|---|---|
| `grouping.strategy` | `MultiAxisStrategy::class` | grouping strategy; use `NullStrategy` to disable grouping |
| `grouping.default` | `'live'` | default read mode: `'log'` for individual activities, `'live'` for one-action bursts |
| `grouping.bursts.within` | `'15 minutes'` | quiet gap that closes a Live burst |
| `grouping.bursts.ceiling` | `'4 hours'` | maximum duration from the burst's start |
| `grouping.curate` | `true` | choose which group shows each activity at publication; `false` limits `live()` to repeats |
| `grouping.children_limit` | `25` | maximum member nodes nested in each group; `count` remains the full total |
| `grouping.sample_limits.<role>` | `3` | distinct entities sampled per singular role on a group node; resolved whenever a page is retrieved. Invalid or missing limits use `3` |
| `grouping.policy.min_actors` | `3` | distinct actors required for the `actors` and `actors_target` axes |
| `grouping.policy.min_targets` | `2` | distinct targets required for `targets` |
| `grouping.policy.min_target_members` | `3` | activities required for `targets` |
| `grouping.policy.min_object_members` | `2` | activities required for `object` |

`sample_limits` uses singular role names: `actor`, `object`, `target`,
`context`, `origin`, `result`, `instrument`, `location`, and `generator`.
`featured` caps the strip of members' featured entities, `sample.featured`.
Each defaults to `3`.
Increase a limit when your frontend displays more names:

```php memo="config/storyfeed.php"
'grouping' => [
    // Keep the other grouping settings here.
    'sample_limits' => [
        'object' => 6,  // this feed shows the objects' pictures
        // everything else stays at 3
    ],
],
```

`children_limit` still caps the sample.

### Default Grouping Keys

The built-in axes use these default keys:

| Axis | Default Grouping Key |
|---|---|
| `repeat` | `aa:aid:v:oa:ta:tid:ca:cid` |
| `actors` | `v:oa!:oid!:ta:tid:ca:cid` |
| `actors_target` | `v:ta!:tid!:ca:cid` |
| `targets` | `aa!:aid:v:ca:cid` |
| `object` | `aa:aid:v:oa!:oid!:ta:tid:ca:cid` |

These keys identify shared roles within built-in Live bursts. See
[Custom Axes](/deeper/custom-axes#axis-keys) for field syntax and calendar keys.

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

## Snapshots

| Key | Default | Description |
|---|---|---|
| `snapshots.compile` | `env('STORYFEED_SNAPSHOTS', 'cached')` | when `toFeed()` output is recompiled. `'cached'`: `php artisan optimize` recompiles the snapshots of the newest 1,000 activities ([`storyfeed:cache-snapshots`](/reference/commands#rebuilding-snapshots)) and `storyfeed:trickle` catches up the rest. `'sync'`: when a feedable model or Story class file changes, the next feed read runs that same pass once. Any other value throws |

[`storyfeed:install`](/reference/commands#installing-storyfeed) writes
`STORYFEED_SNAPSHOTS=sync` to `.env`. The doctor warns when `sync` is set
outside local and testing; see [Available Checks](/reference/doctor#available-checks).

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
| `curate.window` | `2` | days included in scheduled grouping; raise this to cover any longer burst ceiling. Custom calendar axes widen it for their verbs. `null` or `0` includes all activities |
| `prune.after_days` | `null` | default [retention period](/deeper/retention); `null` keeps activities. Per-verb `keepFor()` or `keepForever()` takes precedence |
| `trickle.limit` | `200` | activities processed per [`storyfeed:trickle`](/reference/commands#scheduled) run |
| `trickle.prune` | `false` | soft-delete activities with an unresolvable role; otherwise count them |

## Diagnostics

| Key | Default | Description |
|---|---|---|
| `doctor.stale_after` | `30` | days without new activity before the doctor reports a stale feed; `null` disables |
| `doctor.acknowledgments` | `[]` | list of exact `code`, complete typed `subject`, and nonempty `reason` entries accepting deliberate grammar gaps. Findings stay visible with reasons but leave active counts, CI failures, and stubs; see [Acknowledgment Policy](/reference/doctor#acknowledgment-policy) |
| `grammar.strict` | `null` | throw when publishing a pair with no headline. `null` = local/testing only |
| `discovery.paths` | `null` | where `storyfeed:stories` and doctor look for feedable models, stories and `PublishesToFeed` classes; `null` = `app_path()`. Not used at runtime |
