# Commands

## Introduction

Artisan commands install, inspect and maintain the feed.

<span id="installing"></span>

## Installing Storyfeed

| Command | Does |
|---|---|
| `storyfeed:install` | publishes `config/storyfeed.php` and the migrations, creates `routes/feed.php` from a stub, and offers to run the migrations. `--without-migrations` publishes none |

```bash
# never overwrites an existing routes/feed.php
php artisan storyfeed:install
# the routes/feed.php stub alone
php artisan vendor:publish --tag=storyfeed-definitions
```

A `routes/feed.php` that isn't a Storyfeed file is left alone, and the command
says how to point [`definitions`](/reference/configuration#definitions) at
another file. With `definitions` set to `false`, no file is created.

## Generating Classes

<span id="generators"></span>

### Stories

| Command | Does |
|---|---|
| `make:story` | creates a [Story class](/deeper/stories). With no arguments, asks for its name and shape. A name alone writes one activity, constructed with its data and published. `--model=Order` or `--resource` selects a resource class; `--invokable` selects a single verb's `__invoke()` declaration. `--verb=` and `--object=` supply a single activity or verb's binding. `--model` takes precedence over `--invokable`. `--axes=` selects comma-separated grouping axes to pre-fill; `--force` overwrites an existing story. The command prints the binding for `routes/feed.php` without editing it. `--from-doctor` generates classes for recorded type/verb pairs without headlines; see [Generating From Doctor Findings](/deeper/stories#generating-from-doctor-findings) |

### Feeds

| Command | Does |
|---|---|
| `make:feed` | creates a [feed class](/basics/named-feeds#feed-classes). `--force` overwrites an existing feed. `--subject=` writes the typed constructor, `--role=` the bound role (default `context`), `--only=` and `--mode=` fill `define()`. `--from-doctor` writes one class holding every undecided verb, commented out, with an `only([])` that throws until you move each verb into `only()` or `except()` |

## Listing Definitions

| Command | Does |
|---|---|
| `storyfeed:list` | lists every definition, as `route:list` lists routes: type, verb, name, the action that declares it (`App\Stories\OrderStory@place`, or a one-verb class), headline, anonymous headline, icon, intent, group headlines, grouping period, the keep-latest policy, and the `file:line` or action that defined it. `--type=` (a morph alias or model class), `--verb=`, `--name=` (name contains), `--json`; `-v` adds resolved middleware and a Where column for role constraints; JSON always includes `middleware` and `where` |
| `storyfeed:verbs` | lists registered verbs, AS2 types, grammar/icon coverage. `--used` compares against recorded verbs. Registered means declared with `Storyfeed::verbs()` or by a story class; see [Verbs](/reference/configuration#verbs) |
| `storyfeed:stories` | inventories what publishes to the feed, and what could but doesn't. `--gaps` shows only rows needing attention, `--json`, `--since=` sets the days after which a story counts as quiet (default 30) |

<span id="manifest"></span>

## Caching Definitions

| Command | Does |
|---|---|
| `storyfeed:cache` | compiles registered stories and `routes/feed.php` into a cached manifest; also runs on `php artisan optimize`. Run it again after adding a method to a [Story class](/deeper/stories) |
| `storyfeed:clear` | removes the cached manifest |

`storyfeed:cache` caches `routes/feed.php` as `route:cache` caches route files:
once cached, the file isn't loaded at boot. Closure headlines are serialised.
A closure that can't be serialised fails the command, naming its `file:line`.
The file holds story definitions only. Register the verb vocabulary in a
service provider.

<span id="diagnostics"></span>

## Running Diagnostics

| Command | Does |
|---|---|
| `storyfeed:doctor` | audits grammar/icon/mapping coverage and feed health. `--json`; `--stubs` prints the `routes/feed.php` definitions the findings imply, with their `use` lines; `--only=`; `--list` names the checks `--only=` accepts; `--fail-on=warning\|error` exits non-zero |

See [Doctor](/reference/doctor) for the checks.

### `php artisan about`

Laravel's `about` command has a Storyfeed section:

```bash
php artisan about --only=storyfeed
```

| Line | Says |
|---|---|
| Definitions | whether `routes/feed.php` is loaded, or cached and skipped at boot |
| Cache | whether `storyfeed:cache` has run, and when |
| Verbs | how many are declared, and how many ship as defaults |
| Object types, Stories, Feeds | how many are registered |
| Recording | whether recording is on |
| Curate, Trickle and Close-batches schedules | whether `storyfeed:curate`, `storyfeed:trickle` and `storyfeed:close-batches` are scheduled |
| Doctor | what the `tables`, `recording` and `manifest` checks report; `storyfeed:doctor` runs them all |

It reads no activity rows, and renders with no tables and no database. `--json`
works as for every other section.


<span id="scheduled"></span>

## Scheduling Maintenance

The feed works without a scheduler. When [Laravel's scheduler](https://laravel.com/docs/13.x/scheduling#running-the-scheduler)
runs, Storyfeed schedules `storyfeed:curate` hourly on its own; set
[`curate.schedule`](/reference/configuration#maintenance) to `false` to turn that off. Schedule the others yourself:

| Command | Does | Suggested |
|---|---|---|
| `storyfeed:trickle` | snapshots uncached activities (newest first), re-takes snapshots whose shape no longer matches `toFeed()`, tombstones models deleted without a model event, restores tombstones whose model is back, and counts activities with an unresolvable role. `--limit=`; `--prune` deletes the unresolvable ones instead | every minute |
| `storyfeed:close-batches` | closes batches whose quiet window elapsed, fires `BatchClosed`, creates composites. `--quiet-minutes=` | every 5 minutes |
| `storyfeed:prune` | permanently deletes activities past their verb's [retention window](/deeper/retention), repairs the groups they leave, and deletes the snapshots and tombstones only they referred to. `--days=` overrides `prune.after_days` (a verb's own window still wins); `--pretend` reports what a run would delete, per verb, and deletes nothing | daily, if a verb declares a window or `prune.after_days` is set |

```php memo="routes/console.php"
use Illuminate\Support\Facades\Schedule;

Schedule::command('storyfeed:trickle')->everyMinute();
Schedule::command('storyfeed:close-batches')->everyFiveMinutes();
Schedule::command('storyfeed:prune')->daily();
```

## Maintaining Stored Activities

<span id="maintenance"></span>

### Rebuilding Snapshots

| Command | Does |
|---|---|
| `storyfeed:rebuild` | rebuilds every entity snapshot and backfills cached links; `--recent=N` limits the pass to entities named by the newest N activities |
| `storyfeed:cache-snapshots` | bounded snapshot refresh run by `php artisan optimize`; skips when the database is unavailable |

<span id="rehashing-existing-rows"></span>

### Rehashing Groups

Grouping is computed at publish time from the role columns, the verb and its
calendar period (a day by default). Existing rows keep the hash they were written with; nothing recomputes it
on read. These change what the hash would be:

- registering a new axis
- editing an axis recipe key
- tuning `grouping.policy` thresholds
- migrating a verb or a role on rows already published

`storyfeed:rebuild` rebuilds snapshots, not hashes, and a plain
`storyfeed:curate` re-picks a winner from the hashes already stored. Only
`--rehash` re-runs grouping first, so existing rows adopt the new recipe:

```bash
php artisan storyfeed:curate --rehash   # --window= bounds it by published_at
```

The hourly scheduled `curate` runs without `--rehash`, so rows are rehashed
only when you run it yourself.

### Releasing Orphaned Composites

A force-deleted composite parent hands its members back to ordinary grouping.
Where members are still claimed by a parent that no longer exists, the
composite keeps rendering from them: a story that outlived its erasure. The
doctor counts them (`claims.parent_gone`), and `--release` ends it:

```bash
php artisan storyfeed:curate --release   # a second run changes nothing
```

The members go back to ordinary grouping, their groups are re-decided, and
the `sync_token` moves when anything changed. A trashed parent still owns its
members, so it is left alone.

`--rehash` can move a group past a live cursor, leaving the next page empty.
It changes the `sync_token`, and clients must then discard every accumulated
node and refetch from the head, including after an empty response. See the
[Sync token rule](/reference/payload#sync-token).

### Other Maintenance Commands

| Command | Does |
|---|---|
| `storyfeed:curate` | selects the winning grouping axis for activities (backfill/repair); scheduled hourly by the package unless `curate.schedule` is `false`. `--rehash`, `--window=`, `--release` |
| `storyfeed:heal` | [retires activities whose source is permanently absent](/deeper/healing). `--dry-run` previews; repeat `--only=` to select healers |
| `storyfeed:bundle` | bundles `Bundleable` runs in closed batches into composites (backfill). `--window=` |
| `storyfeed:participants` | rebuilds the index `involving()` reads. `--missing`, `--chunk=`. Idempotent |

`bundle` and `curate` rewrite settled history and change the `sync_token`, so
every client that accumulates nodes resyncs.

## Seeding Demo Data

| Command | Does |
|---|---|
| `storyfeed:demo` | seeds a fictional demo tenant. `--days=7`, `--seed=1` select the history and deterministic seed; `--fresh` removes prior demo data first, `--clear` removes it without seeding, and `--force` allows production use |
