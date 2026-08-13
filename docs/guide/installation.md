# Installation

## Requirements

| | |
|---|---|
| PHP | 8.4+ |
| Laravel | 12 or 13 (rolling current + previous major) |
| Database | MySQL, PostgreSQL, SQLite, or SQL Server |

## Install

```bash
composer require storyfeed/storyfeed:^0.6@alpha
```

The service provider and `Storyfeed` facade register via package discovery.

::: tip
Storyfeed is pre-1.0, so the `@alpha` flag lets Composer see the tag without
loosening `minimum-stability` for your whole project. From the first stable tag
this becomes plain `composer require storyfeed/storyfeed`.
:::

## Migrations

```bash
php artisan vendor:publish --tag="storyfeed-migrations"
php artisan migrate
```

| table | holds |
|---|---|
| `feed_activities` | the activities — the atomic timeline |
| `feed_snapshots` | cached entity labels and data, so reads never touch your domain tables |
| `feed_groupings` | grouping candidates, computed at publish time |
| `feed_parties` | named participants with no model in your app |
| `feed_batches` | bursts of activity by one actor |
| `feed_meta` | package bookkeeping |

::: warning
Schema changes ship as **additive** `add_*` migrations — never edits to create
stubs you already ran. When an upgrade note says to republish, publish and
migrate; never delete a migration you have already run.
:::

## Configuration

```bash
php artisan vendor:publish --tag="storyfeed-config"
```

Optional — every value in `config/storyfeed.php` has a working default. The
ones you are most likely to touch first:

| key | default | |
|---|---|---|
| `grouping.default` | `'summary'` | app-wide read mode: `'log'`, `'live'`, or `'summary'` |
| `grouping.batch.quiet_minutes` | `10` | idle time before an actor's burst is considered finished |
| `prune.after_days` | `null` | retention; `null` keeps everything |

## Scheduling

The feed works synchronously out of the box. These keep it tidy:

```php
// routes/console.php
Schedule::command('storyfeed:trickle')->everyMinute();            // fill in missing snapshots
Schedule::command('storyfeed:close-batches')->everyFiveMinutes(); // close idle bursts promptly
Schedule::command('storyfeed:prune')->daily();                    // only if prune.after_days is set
```

## Verify

```bash
php artisan storyfeed:doctor
```

Doctor inspects your registries, schema, and actual feed traffic, and names
each problem with its fix. On a fresh install it will tell you there is nothing
to diagnose yet — it refuses a verdict rather than guessing.

## Next

[Your first feed](/guide/quickstart) — record, read, render.
