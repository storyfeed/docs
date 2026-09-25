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

`make:story` creates a [Story class](/deeper/stories). With no arguments, it
asks for the class name and shape. A name alone writes one activity,
constructed with its data and published. The command prints the binding for
`routes/feed.php` without editing it.

| Option | Effect |
|---|---|
| `--model=Order` | a resource class for that model. Takes precedence over `--invokable` |
| `--resource` | a resource class: one method per verb |
| `--invokable` | a single verb's `__invoke()` declaration |
| `--verb=` | the stored verb |
| `--object=` | the object model or morph alias, or `*` for none |
| `--axes=` | comma-separated grouping axes to pre-fill; default, every axis that applies |
| `--from-doctor` | one class per recorded type and verb without a headline; see [Generating From Doctor Findings](/deeper/stories#generating-from-doctor-findings) |
| `--force` | overwrites an existing story |

### Feeds

| Command | Does |
|---|---|
| `make:feed` | creates a [feed class](/basics/named-feeds#feed-classes). `--force` overwrites an existing feed. `--subject=` writes the typed constructor, `--role=` the bound role (default `context`), `--only=` and `--mode=` fill `define()`. `--from-doctor` writes one class holding every undecided verb, commented out, with an `only([])` that throws until you move each verb into `only()` or `except()` |

## Listing Definitions

| Command | Does |
|---|---|
| `storyfeed:list` | lists every definition, as `route:list` lists routes: type, verb, name, the action that declares it (`App\Stories\OrderStory@place`, or a one-verb class), headline, anonymous headline, icon, intent, group headlines, grouping period, the keep-latest policy, and the `file:line` or action that defined it. `--type=` (a morph alias or model class), `--verb=`, `--name=` (name contains), `--json`; `-v` adds resolved middleware and a Where column for role constraints; JSON always includes `middleware` and `where` |
| `storyfeed:verbs` | lists registered verbs, their AS2 types, and whether each has a headline (the `Grammar` column) and an icon. `--used` compares against recorded verbs. Registered means declared with `Storyfeed::verbs()` or by a story class; see [Verbs](/reference/configuration#verbs) |
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
| `storyfeed:doctor` | audits headline, icon and AS2 type coverage, and feed health. `--json`; `--stubs` prints the `routes/feed.php` definitions the findings imply, with their `use` lines; `--only=`; `--list` names the checks `--only=` accepts; `--fail-on=warning\|error` exits non-zero |

See [Diagnosing Your Feed](/deeper/diagnosing) for running it, and [Doctor Checks](/reference/doctor) for every check.

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

It works without a database. `--json` works as for every other section.


<span id="scheduled"></span>

## Scheduling Maintenance

The feed works without a scheduler. When [Laravel's scheduler](https://laravel.com/docs/13.x/scheduling#running-the-scheduler)
runs, Storyfeed schedules `storyfeed:curate` hourly on its own; set
[`curate.schedule`](/reference/configuration#maintenance) to `false` to turn that off. Schedule the others yourself:

| Command | Does | Suggested |
|---|---|---|
| `storyfeed:trickle` | keeps entity snapshots and deletions up to date, including models deleted without a model event, such as by a query builder delete. `--limit=`; `--prune` deletes activities with a role that no longer resolves | every minute |
| `storyfeed:close-batches` | closes batches whose quiet window elapsed, fires `BatchClosed`, creates composites. `--quiet-minutes=` | every 5 minutes |
| `storyfeed:prune` | permanently deletes activities past their verb's [retention window](/deeper/retention). `--days=` overrides `prune.after_days` (a verb's own window still wins); `--pretend` reports what a run would delete, per verb, and deletes nothing | daily, if a verb declares a window or `prune.after_days` is set |

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
| `storyfeed:rebuild` | rebuilds every entity snapshot and link from `toFeed()`; `--recent=N` limits the pass to entities named by the newest N activities |
| `storyfeed:cache-snapshots` | bounded snapshot refresh run by `php artisan optimize`; skips when the database is unavailable |

<span id="rehashing-existing-rows"></span>

### Rehashing Groups

Storyfeed groups an activity when it is published. Activities already
published keep their groups after you:

- register a new axis
- edit an axis recipe key
- tune `grouping.policy` thresholds
- change the verb or a role on activities already published

Neither `storyfeed:rebuild` nor a plain `storyfeed:curate` regroups them. Run
`--rehash` to regroup existing activities with the new settings:

```bash
php artisan storyfeed:curate --rehash   # --window= bounds it by published_at
```

The scheduled `curate` never rehashes, so run it yourself.

`--rehash` can move a group past a live cursor, leaving the next page empty.
It changes the `sync_token`, and clients must then discard every accumulated
node and refetch from the head, including after an empty response. See the
[Sync token rule](/reference/payload#sync-token).

### Releasing Orphaned Composites

When a composite's parent has been force-deleted but its members still render
as that composite, the doctor reports `claims.parent_gone`. `--release` returns
the members to ordinary grouping:

```bash
php artisan storyfeed:curate --release   # a second run changes nothing
```

The `sync_token` changes when anything was released. A soft-deleted parent
keeps its members.

### Other Maintenance Commands

| Command | Does |
|---|---|
| `storyfeed:curate` | picks the group each activity shows in with `live()` (backfill/repair); scheduled hourly by the package unless `curate.schedule` is `false`. `--rehash`, `--window=`, `--release` |
| `storyfeed:heal` | [retires activities whose source is permanently absent](/deeper/healing). `--pretend` previews; repeat `--only=` to select healers |
| `storyfeed:bundle` | bundles `Bundleable` runs in closed batches into composites (backfill). `--window=` |
| `storyfeed:participants` | rebuilds the index `involving()` reads. `--missing`, `--chunk=`. Idempotent |

`bundle` and `curate` rewrite settled history and change the `sync_token`, so
every client that accumulates nodes resyncs.

## Seeding Demo Data

| Command | Does |
|---|---|
| `storyfeed:demo` | seeds a fictional demo tenant. `--days=7`, `--seed=1` select the history and deterministic seed; `--fresh` removes prior demo data first, `--clear` removes it without seeding, and `--force` allows production use |
