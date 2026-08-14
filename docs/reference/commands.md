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

`bundle` and `curate` rewrite settled history — run them when readers aren't
mid-scroll, and expect a `sync_token` change afterward.

## Manifest

| command | does |
|---|---|
| `storyfeed:cache` | compiles registered stories into a cached manifest — also runs on `php artisan optimize` |
| `storyfeed:clear` | removes the cached manifest |

::: warning
`optimize` before a test run caches config over `phpunit.xml` and can drop a
seeded database. Run `optimize:clear` first — see
[Testing](/deeper/testing#optimize-before-a-test-run-wipes-a-seeded-database).
:::

## Generators

| command | does |
|---|---|
| `make:story` | creates a story class. `--from-doctor` generates a stub per gap doctor found |
