# Commands

## Scheduled

| command | does | suggested |
|---|---|---|
| `storyfeed:trickle` | snapshots uncached activities (newest first) and prunes orphans. `--limit=` | every minute |
| `storyfeed:close-batches` | closes batches whose quiet window elapsed, fires `BatchClosed`, mints composites. `--quiet-minutes=` | every 5 minutes |
| `storyfeed:prune` | permanently deletes activities past the retention window. `--days=` | daily, if `prune.after_days` is set |

```php
// routes/console.php
Schedule::command('storyfeed:trickle')->everyMinute();
Schedule::command('storyfeed:close-batches')->everyFiveMinutes();
Schedule::command('storyfeed:prune')->daily();
```

## Diagnostics

| command | does |
|---|---|
| `storyfeed:doctor` | audits grammar/icon/mapping coverage and feed health. `--json`, `--stubs`, `--only=` |
| `storyfeed:verbs` | lists registered verbs, AS2 types, grammar/icon coverage. `--used` compares against recorded verbs |
| `storyfeed:stories` | inventories what publishes to the feed, and what could but doesn't |

See [Doctor](/reference/doctor) for the checks.

## Maintenance

| command | does |
|---|---|
| `storyfeed:rebuild` | rebuilds every entity snapshot and backfills cached links |
| `storyfeed:curate` | selects the winning grouping axis for activities (backfill/repair) |
| `storyfeed:bundle` | bundles `Collectable` runs in closed batches into composites (backfill). `--window=` |
| `storyfeed:participants` | rebuilds the index `involving()` reads. `--missing`, `--chunk=`. Idempotent |

`bundle` and `curate` rewrite settled history and bump the `sync_token`, which
makes every accumulating client resync.

## Manifest

| command | does |
|---|---|
| `storyfeed:cache` | compiles registered stories into a cached manifest — also runs on `php artisan optimize` |
| `storyfeed:clear` | removes the cached manifest |

`optimize` caches config, which can drop a seeded database on the next test run
— see [Testing](/deeper/testing#optimize-before-a-test-run-wipes-a-seeded-database).

## Generators

| command | does |
|---|---|
| `make:story` | creates a story class. `--from-doctor` generates a stub per gap doctor found |
| `make:feed` | creates a [feed class](/basics/named-feeds#feed-classes). `--subject=` writes the typed constructor, `--role=` the bound role (default `context`), `--only=` and `--mode=` fill `define()` |

`make:feed --from-doctor` writes one class carrying every undecided verb,
commented out, and `only([])` throws until a human moves each one into `only()`
or `except()`. It transcribes what doctor observed; it does not decide, and the
file it writes cannot make the check pass on its own.
