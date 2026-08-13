# Installation

## Requirements

| | |
|---|---|
| PHP | **8.4 or newer** — the package leans on 8.4 idioms and does not support older runtimes |
| Laravel | **12 or 13** — the policy is rolling *current + previous* major |
| Database | MySQL, PostgreSQL, SQLite, or SQL Server (whatever your app already uses) |

## Install the package

Storyfeed is pre-1.0, so the current release on Packagist is an alpha and needs
an explicit stability flag:

```bash
composer require storyfeed/storyfeed:^0.6@alpha
```

::: tip
From the first stable tag this becomes a plain
`composer require storyfeed/storyfeed`. Until then, the `@alpha` flag is what
lets Composer see the tag without loosening `minimum-stability` for your whole
project.
:::

The service provider and the `Storyfeed` facade alias are registered
automatically by package discovery — there is nothing to add to
`bootstrap/providers.php`.

## Publish and run the migrations

```bash
php artisan vendor:publish --tag="storyfeed-migrations"
php artisan migrate
```

That creates six tables plus one additive column migration:

| table | what it holds |
|---|---|
| `feed_activities` | the activities themselves — the atomic timeline |
| `feed_snapshots` | denormalized entity labels/links, so reads never touch your domain tables |
| `feed_groupings` | precomputed grouping candidates, written at publish time |
| `feed_parties` | named participants that have no model in your app |
| `feed_batches` | bursts of activity by one actor, inferred by a quiet window |
| `feed_meta` | package-owned bookkeeping (the sync token lives here) |

::: warning MIGRATIONS ARE PUBLISHED, AND STAY PUBLISHED
Because the migrations live in your app, a package upgrade that touches the
schema ships an **additive** `add_*` migration rather than editing a create stub
you already ran — editing a create stub is invisible to every existing install
by construction. When an upgrade note says to republish, publish and migrate;
never delete a migration you have already run.
:::

## Publish the config

```bash
php artisan vendor:publish --tag="storyfeed-config"
```

Everything in `config/storyfeed.php` has a working default, so this step is
optional at first. The values you are most likely to reach for early:

- `grouping.default` — the app-wide read mode: `'log'`, `'live'`, or `'summary'`
  (the default).
- `grouping.batch.quiet_minutes` — how long an actor must be idle before their
  burst of activity is considered finished.
- `prune.after_days` — retention. `null` keeps everything, which is the default.

## Schedule the maintenance commands

None of these are required to *record* or *read* a feed — the feed works
synchronously out of the box. They keep it tidy:

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('storyfeed:trickle')->everyMinute();        // fills in missing entity snapshots
Schedule::command('storyfeed:close-batches')->everyFiveMinutes(); // closes idle bursts promptly
Schedule::command('storyfeed:prune')->daily();                // only if prune.after_days is set
```

`storyfeed:close-batches` is what makes burst-derived stories appear without
waiting for the actor's next publish, so schedule it if you use composites.

## Check your work

```bash
php artisan storyfeed:doctor
```

Doctor is the package's diagnostic surface: it inspects your registries, your
schema, and the traffic actually in your feed, and reports what is missing with
the fix named. On a fresh install with no activities yet it will tell you exactly
that — it refuses a verdict rather than guessing when there is no data to look
at.

## Next

[Your first feed](/guide/quickstart) — record an activity, read it back, and
render it in Blade.
