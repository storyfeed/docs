# Upgrading from 0.12 to 0.13

Upgrade Storyfeed and migrate existing grouping data to Live bursts.
Back up the database and pause all activity writers, including queue workers
and scheduled publishers, before migrating or rebuilding history.

## Updating Dependencies

```bash
composer require storyfeed/storyfeed:^0.13 storyfeed/ui:^0.4 --with-all-dependencies
# Omit storyfeed/ui when your app does not use it.
```

## Replacing the Read Mode

```php
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->live()->get();
```

Replace `summary()` reads and any `grouping.default = 'summary'` setting with
`live`. Log remains the individual-activity timeline. Remove phrase-based
rendering and Summary grammar; Live rows contain one action.

## Checking App References and Verbs

App-model references use strings of at most 36 characters. Existing databases
need an explicit migration of their reference columns and collations;
republishing stubs does not alter them. Event listeners comparing role IDs
with `===` must compare strings. MySQL/MariaDB reference columns use ASCII with `ascii_bin` collation.
PostgreSQL and SQLite keep case-sensitive defaults.
Package-owned primary keys and cached snapshot pointers remain numeric.
Party and tombstone references store those keys as decimal strings.

Verbs are undotted base-form actions. Update declarations, publishing calls,
feed allowlists and grammar keys together. Migrate stored verbs explicitly,
using your configured activity table:

```sql
UPDATE feed_activities SET verb = 'email' WHERE verb = 'document.emailed';
```

Use `->name('document.emailed')` when a dotted story lookup is needed.
`storyfeed.morph_key_type` and the demo command/config are removed.

## Publishing Migrations

```bash
php artisan vendor:publish --tag=storyfeed-migrations
php artisan migrate
```

Confirm `add_read_path_indexes_to_feed_groupings_table` and
`create_feed_grouping_bursts_table` are present and run.
Use the new migration stubs with the names of your configured tables.
Existing published migrations are application-owned: reconcile their changes
with the package's stubs before migrating.

## Rebuilding Stored Groups

```bash
php artisan storyfeed:curate --rebuild-bursts
# Writers must stay paused; use all history, without --window or --release.
```

::: warning Rebuild procedure pending
The rebuild flags, resumability and timing are awaiting the release's
performance validation. Keep publishers paused during the migration and
rebuild. The final flags and restart procedure will be added here
from the release changelog before release approval.
:::

## Updating Published Configuration

Remove `storyfeed.grouping.summary`, `storyfeed.morph_key_type` and
`storyfeed.demo.enabled`. Merge these values into the existing arrays:

```php memo="config/storyfeed.php"
// Merge each entry into its existing array; preserve your other settings.
 'tables' => ['grouping_bursts' => 'feed_grouping_bursts'],
 'grouping' => ['bursts' => ['within' => '15 minutes', 'ceiling' => '4 hours']],
 'doctor' => ['acknowledgments' => []],
```

If a custom burst ceiling exceeds `storyfeed.curate.window`, raise that repair
window to cover it. Replace obsolete `Storyfeed::grammar()`, `actorlessGrammar()`,
`aggregateGrammar()`, `icons()`, `glyphIntents()`, `nouns()` and `objectTypes()`
authoring setters with `Story` declarations.

## Refreshing UI Components

```bash
php artisan storyfeed:ui vue --diff
# Or: php artisan storyfeed:ui react --diff
```

Reconcile copied components using the diffs. Differing files are kept unless
`--force` is supplied. Blade apps should reconcile published views with the
package views. All kits use Tailwind v4 and starter-kit colour tokens.

## Rebuilding Definitions

```bash
php artisan storyfeed:cache
php artisan storyfeed:doctor
```

Check Live rows, expanded members, headlines and totals before resuming
publishers. See the [release changelog](https://github.com/storyfeed/storyfeed/blob/main/CHANGELOG.md)
for the corresponding upgrade steps.
