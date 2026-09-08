# Commands

## Scheduled

| command | does | suggested |
|---|---|---|
| `storyfeed:trickle` | snapshots uncached activities (newest first), re-takes snapshots whose shape no longer matches `toFeed()`, and counts activities with an unresolvable role. `--limit=`; `--prune` deletes the unresolvable ones instead | every minute |
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
| `storyfeed:curate` | selects the winning grouping axis for activities (backfill/repair); scheduled hourly by the package unless `curate.schedule` is `false`. `--rehash`, `--window=` |
| `storyfeed:bundle` | bundles `Collectable` runs in closed batches into composites (backfill). `--window=` |
| `storyfeed:participants` | rebuilds the index `involving()` reads. `--missing`, `--chunk=`. Idempotent |

`bundle` and `curate` rewrite settled history and bump the `sync_token`, which
makes every accumulating client resync.

### `--rehash`: when the grouping recipe changes underneath existing rows

Grouping is **derived at publish time** — the hash comes from the role columns,
the verb and the day. Change what that hash would compute and **existing rows
keep the hash they were written with.** Nothing recomputes it on read, and
nothing warns you.

Four things change it, and three of them are things this package encourages:

- registering a new axis
- editing an axis recipe key
- tuning `grouping.policy` thresholds
- migrating a verb or a role on rows already published

Neither `storyfeed:rebuild` nor a plain `storyfeed:curate` fixes this.
`rebuild` rebuilds *snapshots*, which are a different kind of derived data —
they self-heal. Plain `curate` re-picks a winner from the hashes already
stored. Only `--rehash` re-runs the grouping strategy first, so rows adopt the
new recipe:

```bash
php artisan storyfeed:curate --rehash
```

Use `--window=` to bound it by `published_at` rather than sweeping the table.

**The hourly scheduled run never does this.** The package schedules
`storyfeed:curate` without `--rehash`, so nothing rehashes on its own — it
happens only when you run it deliberately. That is the answer to "could this
fire while my users are reading?": not by itself.

**It rewrites settled group identity, so read the caveat above:** the
`sync_token` changes and every accumulating client resyncs. A client holding a
cursor from before the run may find its next page empty where a group moved —
the activities are still there and a fresh read returns them, which is what the
new `sync_token` is telling the client to do. Prefer running it when a feed is
quiet.

If you find yourself reading `WriteGroupings` or `CurateCluster` out of
`vendor/` to replay their invariants by hand, this command is what you are
reimplementing.

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
