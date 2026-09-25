# Installation

Install Storyfeed and create the tables that store your activities.

## Requirements

| | |
|---|---|
| PHP | 8.4+ |
| Laravel | 12 or 13 |
| Database | MySQL, PostgreSQL, SQLite, or SQL Server |

<a id="install"></a>

## Installing Storyfeed

```bash
composer require storyfeed/storyfeed:dev-main
```

The service provider registers through package discovery.
Commit `composer.lock` to pin the revision.

### Running the Installer

The installer publishes the configuration and migrations and creates `routes/feed.php`:

```bash
php artisan storyfeed:install
```

It leaves an existing feed file untouched. In an interactive terminal, it offers to run the migrations.

<a id="migrations"></a>

### Running Migrations

If you decline that offer or run the installer non-interactively, run the migrations explicitly:

```bash
php artisan migrate
```

The [Schema](/reference/schema) describes the tables. For manual publication or an installation without migrations, see [Commands](/reference/commands).

## Configuration

The installer creates `config/storyfeed.php`. Every setting has a default; see [Configuration](/reference/configuration) for the available options.

### Publishing Configuration

You may publish the configuration separately:

```bash
php artisan vendor:publish --tag="storyfeed-config"
```

<a id="scheduling"></a>

## Scheduling Maintenance

The feed works without a scheduler. When Laravel’s scheduler runs, the package
schedules `storyfeed:curate` hourly on its own; set `storyfeed.curate.schedule`
to `false` to turn that off.

Add these tasks to your app’s schedule:

```php memo="routes/console.php"
use Illuminate\Support\Facades\Schedule;

// fill in missing snapshots
Schedule::command('storyfeed:trickle')->everyMinute();

// close idle bursts promptly
Schedule::command('storyfeed:close-batches')->everyFiveMinutes();

// only if activities are pruned
Schedule::command('storyfeed:prune')->daily();
```

Configure [Laravel’s scheduler](https://laravel.com/docs/13.x/scheduling#running-the-scheduler) to run these tasks.
