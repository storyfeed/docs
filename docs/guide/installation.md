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

<a id="scheduling"></a>
<a id="scheduling-maintenance"></a>

The feed works without a scheduler; once it is live, Storyfeed has [maintenance commands](/reference/commands#scheduling-maintenance) worth scheduling.
