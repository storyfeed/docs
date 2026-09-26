# Commands

## Introduction

Artisan commands install, inspect and maintain the feed.

<span id="installing"></span>

## Installing Storyfeed

| Command | Description |
|---|---|
| `storyfeed:install` | publishes `config/storyfeed.php` and the migrations, creates `routes/feed.php` from a stub, and offers to run the migrations. `--without-migrations` publishes none |

```bash
# never overwrites an existing routes/feed.php
php artisan storyfeed:install
# the routes/feed.php stub alone
php artisan vendor:publish --tag=storyfeed-definitions
```

The installer preserves an existing `routes/feed.php` that is not a Storyfeed
file and explains how to set another [`definitions`](/reference/configuration#definitions)
path. Setting `definitions` to `false` disables file creation.

## Generating Classes

<span id="generators"></span>

### Stories

`make:story` creates a [Story class](/deeper/stories). Without arguments, it
prompts for the name and class structure. Passing only a name creates a class
for one activity, constructed with its data and then published. The command
prints the `routes/feed.php` binding for you to add.

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

| Command | Description |
|---|---|
| `make:feed` | creates a [feed class](/basics/named-feeds#feed-classes). `--force` overwrites an existing feed. `--subject=` writes the typed constructor, `--role=` the bound role (default `context`), `--only=` and `--mode=` fill `define()`. `--from-doctor` writes one class with unclassified verbs commented out; its `only([])` throws until you classify each verb with `only()` or `except()` |

## Listing Definitions

| Command | Description |
|---|---|
| `storyfeed:list` | lists every definition, as `route:list` lists routes: type, verb, name, the action that declares it (`App\Stories\OrderStory@place`, or a one-verb class), headline, anonymous headline, icon, intent, group headlines, grouping period, the keep-latest policy, and the `file:line` or action that defined it. `--type=` (a morph alias or model class), `--verb=`, `--name=` (name contains), `--json`; `-v` adds resolved middleware and a Where column for role constraints; JSON always includes `middleware` and `where` |
| `storyfeed:verbs` | lists registered verbs, their AS2 types, and whether each has a headline (the `Grammar` column) and an icon. `--used` compares against recorded verbs. Registered means declared with `Storyfeed::verbs()` or by a story class; see [Verbs](/reference/configuration#verbs) |
| `storyfeed:stories` | lists publishers and models that could publish but have no recorded activities. `--gaps` shows only rows needing attention, `--json`, `--since=` sets the days after which a Story is considered inactive (default 30) |

<span id="manifest"></span>

## Caching Definitions

| Command | Description |
|---|---|
| `storyfeed:cache` | compiles registered stories and `routes/feed.php` into a cached manifest; also runs on `php artisan optimize`. Run it again after adding a method to a [Story class](/deeper/stories) |
| `storyfeed:clear` | removes the cached manifest |

Like `route:cache`, `storyfeed:cache` prevents the definitions file from
loading at boot. It serialises closure headlines and fails with a `file:line`
reference if a closure cannot be serialised. Keep only Story definitions in
the feed file; register verb vocabulary in a service provider.

<span id="diagnostics"></span>

## Running Diagnostics

| Command | Description |
|---|---|
| `storyfeed:doctor` | audits headline, icon and AS2 type coverage, and feed health. `--json`; `--stubs` prints the `routes/feed.php` suggested definitions, with their `use` lines; `--only=`; `--list` names the checks `--only=` accepts; `--fail-on=warning\|error` exits non-zero at the selected severity |

See [Diagnosing Your Feed](/deeper/diagnosing) for usage and
[Doctor Checks](/reference/doctor) for the checks.

### `php artisan about`

Laravel's `about` command has a Storyfeed section:

```bash
php artisan about --only=storyfeed
```

| Line | Reports |
|---|---|
| Definitions | whether `routes/feed.php` is loaded, or cached and skipped at boot |
| Cache | whether `storyfeed:cache` has run, and when |
| Verbs | how many are declared, and how many ship as defaults |
| Object types, Stories, Feeds | how many are registered |
| Recording | whether recording is on |
| Curate, Trickle and Close-batches schedules | whether `storyfeed:curate`, `storyfeed:trickle` and `storyfeed:close-batches` are scheduled |
| Doctor | what the `tables`, `recording` and `manifest` checks report; `storyfeed:doctor` runs them all |

The section works without a database and supports `--json`.


<span id="scheduled"></span>

## Scheduling Maintenance

The feed works without a scheduler. When
[Laravel's scheduler](https://laravel.com/docs/13.x/scheduling#running-the-scheduler)
runs, Storyfeed schedules `storyfeed:curate` hourly unless
[`curate.schedule`](/reference/configuration#maintenance) is `false`.
Schedule other maintenance commands in your application:

| Command | Description | Suggested |
|---|---|---|
| `storyfeed:trickle` | keeps entity snapshots and deletions up to date, including models deleted without a model event, such as by a query builder delete. `--limit=`; `--prune` deletes activities with a role that no longer resolves | every minute |
| `storyfeed:close-batches` | closes batches whose window has elapsed, dispatches `BatchClosed`, creates composites. `--quiet-minutes=` | every 5 minutes |
| `storyfeed:prune` | permanently deletes activities past their verb's [retention window](/deeper/retention). `--days=` overrides `prune.after_days` (per-verb retention takes precedence); `--pretend` reports what a run would delete, per verb, and deletes nothing | daily, if a verb declares a window or `prune.after_days` is set |

```php memo="routes/console.php"
use Illuminate\Support\Facades\Schedule;

Schedule::command('storyfeed:trickle')->everyMinute();
Schedule::command('storyfeed:close-batches')->everyFiveMinutes();
Schedule::command('storyfeed:prune')->daily();
```

## Maintaining Stored Activities

<span id="maintenance"></span>

### Rebuilding Snapshots

| Command | Description |
|---|---|
| `storyfeed:rebuild` | rebuilds every entity snapshot and link from `toFeed()`; `--recent=N` limits the pass to entities named by the newest N activities |
| `storyfeed:cache-snapshots` | bounded snapshot refresh run by `php artisan optimize`; skips when the database is unavailable |

<span id="rehashing-existing-rows"></span>

### Rehashing Groups

Storyfeed groups activities at publication. Existing groups remain unchanged
when you:

- register an axis
- change an axis's grouping key
- adjust `grouping.policy` thresholds
- change a published activity's verb or roles

Neither `storyfeed:rebuild` nor `storyfeed:curate` without `--rehash` applies
these changes to existing groups. To regroup stored activities:

```bash
php artisan storyfeed:curate --rehash   # --window= bounds it by published_at
```

Scheduled `curate` runs never rehash; run `--rehash` explicitly.

Rehashing can move groups past an active cursor, leaving the next page empty.
It changes `sync_token`, so clients must discard accumulated nodes and fetch
from the start, even after an empty response. See the
[Sync token rule](/reference/payload#sync-token).

### Releasing Orphaned Composites

If a composite parent is force-deleted while its members still appear in the
composite, the doctor reports `claims.parent_gone`. Use `--release` to return
them to ordinary grouping:

```bash
php artisan storyfeed:curate --release   # a second run changes nothing
```

Releasing members changes `sync_token`. Soft-deleted parents keep their members.

### Other Maintenance Commands

| Command | Description |
|---|---|
| `storyfeed:curate` | chooses which group shows each activity with `live()` (backfill/repair); scheduled hourly by the package unless `curate.schedule` is `false`. `--rehash`, `--window=`, `--release` |
| `storyfeed:heal` | [soft-deletes activities whose source is permanently absent](/deeper/healing). `--pretend` previews; repeat `--only=` to select healers |
| `storyfeed:bundle` | combines `Bundleable` activities in closed batches into composites. `--window=` |
| `storyfeed:participants` | rebuilds the index queried by `involving()`. `--missing`, `--chunk=`. Safe to run repeatedly |

`bundle` and `curate` can change existing groups and their `sync_token`.
Clients that accumulate nodes must then fetch the feed again.

## Seeding Demo Data

| Command | Description |
|---|---|
| `storyfeed:demo` | seeds a fictional demo tenant. `--days=7`, `--seed=1` select the history and deterministic seed; `--fresh` removes prior demo data first, `--clear` removes it without seeding, and `--force` allows production use |
