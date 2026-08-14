# Configuration

Every key in `config/storyfeed.php`. All have working defaults.

```bash
php artisan vendor:publish --tag="storyfeed-config"
```

## Tables & models

| key | default | |
|---|---|---|
| `tables.*` | `feed_activities`, `feed_snapshots`, `feed_groupings`, `feed_parties`, `feed_batches`, `feed_meta`, `feed_participants` | remap on collision, or point at pre-existing feed tables |
| `models.*` | the package models | swap in your own; they should extend the defaults |

## Identity

| key | default | |
|---|---|---|
| `morph_alias` | `'storyfeed.party'` | alias stored for parties; resolved independently of your morph map |
| `morph_map` | `[]` | merged into the app's morph map at boot |
| `actor_resolver` | `null` | invokable class resolving the default actor; `null` = authenticated user |
| `parties.fallback` | `null` | party name for otherwise-anonymous publishes (jobs, commands) |

## Verbs

| key | default | |
|---|---|---|
| `verbs.strict` | `null` | throw on a verb with no registry entry. `null` = strict in local/testing only |

## Grouping

| key | default | |
|---|---|---|
| `grouping.strategy` | `MultiAxisStrategy::class` | use `NullStrategy` to disable grouping entirely |
| `grouping.default` | `'summary'` | app-wide read mode: `'log'`, `'live'`, `'summary'` |
| `grouping.curate` | `true` | select a winning axis at publish time |
| `grouping.children_limit` | `25` | member nodes nested per group; `count` stays the true total |
| `grouping.policy.min_actors` | `3` | distinct actors before the `actors` axis applies |
| `grouping.policy.min_targets` | `2` | distinct targets before `targets` applies |
| `grouping.policy.min_target_members` | `3` | members required on `targets` |
| `grouping.policy.min_object_members` | `2` | members required on `object` |

::: tip
Curation policy is not payload contract — change these freely. Only the group
node's *shape* is frozen.
:::

## Batches & composites

| key | default | |
|---|---|---|
| `grouping.batch.enabled` | `true` | infer bursts by one actor |
| `grouping.batch.quiet_minutes` | `10` | idle time before a burst is considered finished |
| `grouping.composite.auto` | `true` | bundle `Collectable` runs at batch close |
| `grouping.composite.min_objects` | `2` | smallest distinct object count that mints a composite |

## AS2.0 routes

| key | default | |
|---|---|---|
| `routes.enabled` | `false` | opt-in, read-only endpoints |
| `routes.prefix` | `'storyfeed'` | **also mints activity IRIs** — changing it changes document ids |
| `routes.middleware` | `[]` | add auth/throttling here |

## Maintenance

| key | default | |
|---|---|---|
| `prune.after_days` | `null` | retention window; `null` keeps everything |
| `trickle.limit` | `200` | activities snapshotted per `storyfeed:trickle` run |

## Diagnostics

| key | default | |
|---|---|---|
| `doctor.stale_after` | `30` | days without new activity before doctor flags a forgotten feed; `null` disables |
| `grammar.strict` | `null` | throw when publishing a pair with no headline. `null` = local/testing only |
| `discovery.paths` | `null` | where `storyfeed:stories` and doctor scan for feed surface; `null` = `app_path()`. Dev-time only |
