# Installation

## Requirements

| | |
|---|---|
| PHP | 8.4+ |
| Laravel | 12 or 13 |
| Database | MySQL, PostgreSQL, SQLite, or SQL Server |

## Install

```bash
composer require storyfeed/storyfeed:dev-main
```

The service provider and `Storyfeed` facade register via package discovery.
Commit `composer.lock` to pin the revision.

## Migrations

```bash
php artisan vendor:publish --tag="storyfeed-migrations"
php artisan migrate
```

| Table | Holds |
|---|---|
| `feed_activities` | the activities — the atomic timeline |
| `feed_snapshots` | cached entity labels and data |
| `feed_groupings` | grouping candidates, computed at publish time |
| `feed_parties` | named participants with no model in your app |
| `feed_batches` | bursts of activity by one actor |
| `feed_participants` | the index `involving()` reads |
| `feed_meta` | package bookkeeping |

After an update, publish and migrate again. Never delete a migration you have
already run.

## Configuration

```bash
php artisan vendor:publish --tag="storyfeed-config"
```

Optional: every value in `config/storyfeed.php` has a working default. The ones
you are most likely to change:

| Key | Default |  |
|---|---|---|
| `grouping.default` | `'summary'` | app-wide read mode: `'log'`, `'live'`, or `'summary'` |
| `grouping.batch.quiet_minutes` | `10` | idle minutes before an actor's burst is finished |
| `prune.after_days` | `null` | retention; `null` keeps everything |

## Scheduling

The feed works without a scheduler. When Laravel’s scheduler runs, the package
schedules `storyfeed:curate` hourly on its own; set `storyfeed.curate.schedule`
to `false` to turn that off.

Add these tasks to your app’s schedule:

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('storyfeed:trickle')->everyMinute();            // fill in missing snapshots
Schedule::command('storyfeed:close-batches')->everyFiveMinutes(); // close idle bursts promptly
Schedule::command('storyfeed:prune')->daily();                    // only if prune.after_days is set
```
