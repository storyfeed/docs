# Configuration

Every key in `config/storyfeed.php`. All have working defaults.

```bash
php artisan vendor:publish --tag="storyfeed-config"
```

## Tables & Models

| Key | Default |  |
|---|---|---|
| `tables.*` | `feed_activities`, `feed_snapshots`, `feed_groupings`, `feed_parties`, `feed_batches`, `feed_meta`, `feed_participants` | remap on collision, or point at pre-existing feed tables |
| `models.*` | the package models | swap in your own; they should extend the defaults |

## Identity

| Key | Default |  |
|---|---|---|
| `morph_alias` | `'storyfeed.party'` | alias stored for parties; resolved independently of your morph map |
| `morph_map` | `[]` | merged into the app's morph map at boot |
| `actor_resolver` | `null` | invokable class resolving the default actor; `null` = authenticated user |
| `parties.fallback` | `null` | party name for otherwise-anonymous publishes (jobs, commands) |

For named system attribution or a sentence without an actor slot, see
[Parties and actorless voice](/deeper/parties).

## Recording

| Key | Default |  |
|---|---|---|
| `recording.enabled` | `env('STORYFEED_RECORDING_ENABLED', true)` | off, every `publish()` returns an unsaved activity and no event is dispatched. Set it in `phpunit.xml`, and opt tests back in with `Storyfeed\Testing\RecordsStories` |
| `replace.delete` | `'soft'` | what [`->replace()`](/cookbook/repeating-activities#what-replace-matches-on) does to the rows it supersedes. `'soft'` keeps them with `deleted_at` set until `storyfeed:prune`, and removes their participant rows; `'force'` hard-deletes them, grouping and participant rows included, inside the publish transaction. Any other value throws at publish time |

## Verbs

| Key | Default |  |
|---|---|---|
| `verbs.strict` | `null` | throw on a verb with no registry entry. `null` = strict in local/testing only |

The registry is the vocabulary the app declares, on top of the package's
built-in verbs:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::verbs(ActivityVerb::class); // a backed enum implementing FeedVerb
Storyfeed::verbs(['confirm' => ActivityType::Update]); // or a verb => type map
```

Once a verb is registered, `verbs.strict` throws on any verb outside the
registry, `storyfeed:verbs --used` and doctor report verbs recorded but never
registered (and the reverse), and the serializer emits the verb's Activity
Streams 2.0 type. A registered story class registers its verb too, so an app
that records only through stories has nothing to register.

## Grouping

| Key | Default |  |
|---|---|---|
| `grouping.strategy` | `MultiAxisStrategy::class` | use `NullStrategy` to disable grouping entirely |
| `grouping.default` | `'summary'` | app-wide read mode: `'log'`, `'live'`, `'summary'` |
| `grouping.curate` | `true` | select a winning axis at publish time |
| `grouping.children_limit` | `25` | member nodes nested per group; `count` stays the true total |
| `grouping.sample_limits.<role>` | `3` | distinct entities sampled per singular role on a group node |
| `grouping.policy.min_actors` | `3` | distinct actors before the `actors` axis applies |
| `grouping.policy.min_targets` | `2` | distinct targets before `targets` applies |
| `grouping.policy.min_target_members` | `3` | members required on `targets` |
| `grouping.policy.min_object_members` | `2` | members required on `object` |

When grouping does not fire, check the [axis registry](/deeper/aggregation#the-built-in-axes)
before changing thresholds: `repeat` pins the target id, while `targets` does not.

`sample_limits` is keyed by singular role — `actor`, `object`, `target`,
`context`, `origin`, `result`, `instrument` — and every default is `3`. Raise
one where a surface shows more:

```php
// config/storyfeed.php
'sample_limits' => [
    'object' => 6,  // this feed shows the objects' pictures
    // everything else stays at 3
],
```

The sample is drawn from the members already loaded, so `children_limit` still
bounds it. Each sampled entity is a resolver call: a group node listing six objects
resolves six entities on every page. An invalid or missing limit falls back to
`3`.

## Batches & Composites

| Key | Default |  |
|---|---|---|
| `grouping.batch.enabled` | `true` | infer bursts by one actor |
| `grouping.batch.quiet_minutes` | `10` | idle time before a burst is considered finished |
| `grouping.composite.auto` | `true` | bundle `Bundleable` runs at batch close |
| `grouping.composite.min_objects` | `2` | smallest distinct object count that creates a composite |

## Hydration

| Key | Default |  |
|---|---|---|
| `hydration.enabled` | `true` | whether [`$context->model()`](/reference/feedable#context-model) loads the live model: one query per class per page. Off, it returns `null` with no query and no exception, and the resolver takes its null branch |

## AS2.0 Routes

| Key | Default |  |
|---|---|---|
| `routes.enabled` | `false` | opt-in, read-only single-activity endpoint |
| `routes.prefix` | `'storyfeed'` | **also builds activity IRIs** — changing it changes document ids |
| `routes.middleware` | `[]` | add auth/throttling here |

## Maintenance

| Key | Default |  |
|---|---|---|
| `curate.schedule` | `true` | package schedules hourly curation with overlap protection; requires Laravel’s scheduler |
| `prune.after_days` | `null` | retention window; `null` keeps everything |
| `trickle.limit` | `200` | activities snapshotted per `storyfeed:trickle` run |
| `trickle.prune` | `false` | delete activities with an unresolvable role; off, the trickle counts them |

## Diagnostics

| Key | Default |  |
|---|---|---|
| `doctor.stale_after` | `30` | days without new activity before doctor flags a forgotten feed; `null` disables |
| `grammar.strict` | `null` | throw when publishing a pair with no headline. `null` = local/testing only |
| `discovery.paths` | `null` | where `storyfeed:stories` and doctor scan for feed surface; `null` = `app_path()`. Dev-time only |
| `demo.enabled` | `false` | register the vocabulary `storyfeed:demo` seeds with, so a seeded demo renders. On in the environment showing the demo, not in production |
