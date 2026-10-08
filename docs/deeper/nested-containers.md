# Nested Containers

## Introduction

A dish belongs to a menu, the menu to a shop, and the shop to a mall.
Use `involving($mall)` to retrieve activity on any dish beneath it.

<script setup>
import { activity, scene, role } from '../.vitepress/theme/world'
const menu = scene.deeper.aggregation.menu[0].target
const added = activity({ ...scene.deeper.aggregation.menu[0], target: null,
  headline_template: ':actor added :object' })
</script>

In the sample world, the chain is {{ role.product.label }} → {{ menu.label }} →
{{ role.shop.label }} → {{ role.mall.label }}. Each model names its closest
container through `parent()` in `toFeed()`:

::: code-group
```php [Fluent Syntax] memo="app/Models/Dish.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Dish extends Model implements Feedable
{
    use InteractsWithFeed;

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make($this->name)->parent($this->menu);
    }
}
```

```php [Named Arguments] memo="app/Models/Dish.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Dish extends Model implements Feedable
{
    use InteractsWithFeed;

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(label: $this->name, parent: $this->menu);
    }
}
```
:::

Describe `Menu` and `Shop` the same way, each with its own parent relationship.
`Mall` has no parent:

| Model | Parent in `toFeed()` |
|---|---|
| `Dish` | `->parent($this->menu)` |
| `Menu` | `->parent($this->shop)` |
| `Shop` | `->parent($this->mall)` |
| `Mall` | no parent |

Publish on the dish. The mall feed includes the activity without a separate
mall role:

::: code-group
```php [Fluent Syntax] memo="routes/web.php"
use App\Models\Dish;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::post('/dishes/{dish}/publish', function (
    Request $request,
    Dish $dish,
) {
    Storyfeed::activity()
        ->by($request->user())
        ->action('add', $dish)
        ->publish();

    $mall = $dish->menu->shop->mall;

    return Storyfeed::feed()
        ->involving($mall)
        ->get();
});
```

```php [Named Arguments] memo="routes/web.php"
use App\Models\Dish;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::post('/dishes/{dish}/publish', function (
    Request $request,
    Dish $dish,
) {
    Storyfeed::record(
        verb: 'add',
        object: $dish,
        actor: $request->user(),
    );

    $mall = $dish->menu->shop->mall;

    return Storyfeed::feed()
        ->involving($mall)
        ->get();
});
```
:::

<FeedExample :items="[added]" />

The activity is an illustrative shop transaction. The dish, shop and mall
come from the sample world;
the menu is the existing shop-app example.

## Deeper Hierarchies

The same declaration supports task → list → folder → project → workspace →
tenant. Each model names one parent. A tenant feed uses the same
`involving($tenant)` query as the mall feed:

```php memo="routes/web.php"
use App\Models\Tenant;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/tenants/{tenant}/feed', function (Tenant $tenant) {
    return Storyfeed::feed()->involving($tenant)->get();
});
```

At publication, Storyfeed follows parents from the **object**, **target** and
**context**. Shared ancestors are recorded once, at their shortest depth.
The default limit is ten parent links per starting role. Set
`storyfeed.ancestors.max_depth` to change it. A cycle or an unresolvable parent
ends that chain; the activity remains available.

Parents may be Feedable models, [registered external models](/basics/feedable-models#registering-external-models),
or [parties](/deeper/parties). `parent(null)` ends a chain.
An explicit `context()` still records a place outside the object's parent chain.

### Keeping Actor and Place Separate

If Sally works on an Acme task, the task's parents lead to Acme's tenant.
Sally's own parent may be her home tenant. Walking her parents would put Acme's
activity in that tenant's feed, so **the actor's parents are never followed**.
`involving($sally)` still finds her direct participation. The `origin`, `result`
and `instrument` roles also contribute only their direct identities.

## Common Hierarchies

| Application | Parent Chain | Feed It Unlocks |
|---|---|---|
| Helpdesk | reply → ticket → queue → team → account | every ticket interaction in an account |
| Code Hosting | comment → pull request → repository → organization | all repository activity in an organization |
| Learning | submission → lesson → module → course → school | submissions across a school |
| Commerce | refund → order → store → merchant | refunds across a merchant's stores |
| Property | maintenance request → unit → building → portfolio | maintenance across a portfolio |
| Events | question → session → track → conference | questions across a conference |

## Moving a Container

An activity keeps the path recorded when it was published. Moving a folder
changes the path of new activities; existing activities remain under the old
ancestors. Snapshot refreshes alone do not move recorded history.

To make history follow current parents, pause readers, publishers, queue workers
and schedulers for the full rebuild, then run:

```sh
php artisan storyfeed:participants --ancestors --writers-paused
```

The command processes history in chunks and stores a committed cursor. Keep
readers and writers paused after an interruption, then continue:

```sh
php artisan storyfeed:participants --ancestors --writers-paused --resume
```

Use `--restart` instead of `--resume` to discard progress and start again.
`--chunk=500` controls batch size, from 1 to 1000. `--missing` cannot be combined
with `--ancestors`: rebuilding a path includes already indexed activities.
Keep parent declarations and container relationships unchanged throughout a run.

## Recording Self-Acting Containers

A project that closes itself is both actor and object. Recording it as the
object lets its parents reach the tenant:

::: code-group
```php [Fluent Syntax] memo="routes/web.php"
use App\Models\Project;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::post('/projects/{project}/close', function (Project $project) {
    $project->update(['closed_at' => now()]);

    Storyfeed::activity()->by($project)->action('close', $project)->publish();

    return response()->noContent();
});
```

```php [Named Arguments] memo="routes/web.php"
use App\Models\Project;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::post('/projects/{project}/close', function (Project $project) {
    $project->update(['closed_at' => now()]);

    Storyfeed::record(
        verb: 'close',
        object: $project,
        actor: $project,
    );

    return response()->noContent();
});
```
:::

## Checking Parent Chains

```sh
php artisan storyfeed:doctor --only=ancestors
```

| Finding | Remedy |
|---|---|
| `ancestors.unresolvable` | Restore the missing parent or correct `parent()`, then rebuild history if it should follow the corrected path. |
| `ancestors.actor_only` | Record a self-acting container as the object too. Actors never supply the place path. |

Ancestry is stored for filtering. It does not add breadcrumb fields to the
activity payload. The [role filters](/basics/reading#filtering-by-entity-or-role)
continue to match their explicitly recorded roles.
