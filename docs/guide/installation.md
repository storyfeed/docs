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

<a id="morph-aliases"></a>

## Defining Morph Aliases

Storyfeed stores each model's morph class. Without a morph map, this is the
full class name. Renaming or moving the model then orphans its existing
activities, as with any polymorphic relation.

We recommend defining a [morph map](https://laravel.com/docs/eloquent-relationships#custom-polymorphic-types)
to keep these identifiers independent of your class names. To enforce a map,
register the aliases in your `AppServiceProvider`'s `boot` method:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\Relation;

Relation::enforceMorphMap([ // [!code highlight]
    'order' => Order::class,
    'menu_item' => MenuItem::class,
    'shop' => Shop::class,
    'user' => User::class,
]);
```

`Relation::enforceMorphMap()` requires aliases for every polymorphic relation
in your application. Choose whether to enforce this requirement for your
application, and keep aliases used by existing activities in the map.

To require aliases only for Feedable models, call
`Storyfeed::requireFeedableMorphMap()` in your service provider's `boot()` method.
It is off by default. Enable it outside production to catch unaliased models
when publishing; the doctor also reports them, and `storyfeed:cache` (including
`php artisan optimize`) refuses to cache while required aliases are missing.

```php
// AppServiceProvider::boot()
Storyfeed::requireFeedableMorphMap(! $this->app->isProduction());
```

## Configuration

The installer creates `config/storyfeed.php`. Every setting has a default; see [Configuration](/reference/configuration) for the available options.

<a id="scheduling"></a>
<a id="scheduling-maintenance"></a>

The feed works without a scheduler; once it is live, Storyfeed has [maintenance commands](/reference/commands#scheduling-maintenance) worth scheduling.
