# Commands

## Scheduled

| Command | Does | Suggested |
|---|---|---|
| `storyfeed:trickle` | snapshots uncached activities (newest first), re-takes snapshots whose shape no longer matches `toFeed()`, and counts activities with an unresolvable role. `--limit=`; `--prune` deletes the unresolvable ones instead | every minute |
| `storyfeed:close-batches` | closes batches whose quiet window elapsed, fires `BatchClosed`, creates composites. `--quiet-minutes=` | every 5 minutes |
| `storyfeed:prune` | permanently deletes activities past the retention window. `--days=` | daily, if `prune.after_days` is set |

```php
// routes/console.php
Schedule::command('storyfeed:trickle')->everyMinute();
Schedule::command('storyfeed:close-batches')->everyFiveMinutes();
Schedule::command('storyfeed:prune')->daily();
```

## Diagnostics

| Command | Does |
|---|---|
| `storyfeed:doctor` | audits grammar/icon/mapping coverage and feed health. `--json`, `--stubs`, `--only=`, `--list` names the checks `--only=` accepts, `--fail-on=warning\|error` exits non-zero |
| `storyfeed:verbs` | lists registered verbs, AS2 types, grammar/icon coverage. `--used` compares against recorded verbs. Registered means declared with `Storyfeed::verbs()` or by a story class; see [Verbs](/reference/configuration#verbs) |
| `storyfeed:stories` | inventories what publishes to the feed, and what could but doesn't. `--gaps` shows only rows needing attention, `--json`, `--since=` sets the days after which a story counts as quiet (default 30) |

See [Doctor](/reference/doctor) for the checks.

## Maintenance

| Command | Does |
|---|---|
| `storyfeed:rebuild` | rebuilds every entity snapshot and backfills cached links |
| `storyfeed:curate` | selects the winning grouping axis for activities (backfill/repair); scheduled hourly by the package unless `curate.schedule` is `false`. `--rehash`, `--window=` |
| `storyfeed:bundle` | bundles `Bundleable` runs in closed batches into composites (backfill). `--window=` |
| `storyfeed:participants` | rebuilds the index `involving()` reads. `--missing`, `--chunk=`. Idempotent |

`bundle` and `curate` rewrite settled history and change the `sync_token`, so
every client that accumulates nodes resyncs.

### Rehashing Existing Rows

Grouping is computed at publish time from the role columns, the verb and the
day. Existing rows keep the hash they were written with; nothing recomputes it
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

`--rehash` can move a group past a live cursor, leaving the next page empty.
It changes the `sync_token`, and clients must then discard every accumulated
node and refetch from the head, including after an empty response. See the
[Sync token rule](/reference/payload#sync-token).

## Manifest

| Command | Does |
|---|---|
| `storyfeed:cache` | compiles registered stories into a cached manifest — also runs on `php artisan optimize` |
| `storyfeed:clear` | removes the cached manifest |

## Generators

| Command | Does |
|---|---|
| `make:story` | creates a story class. `--from-doctor` generates a stub per gap doctor found |
| `make:feed` | creates a [feed class](/basics/named-feeds#feed-classes). `--subject=` writes the typed constructor, `--role=` the bound role (default `context`), `--only=` and `--mode=` fill `define()`. `--from-doctor` writes one class holding every undecided verb, commented out, with an `only([])` that throws until you move each verb into `only()` or `except()` |
