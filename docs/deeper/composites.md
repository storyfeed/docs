# Composites

## Introduction

<script setup>
import { who, dishes, group } from '../.vitepress/theme/samples'

const authored = group({
  id: 'cp1', verb: 'publish', axis: 'composite', count: 2, glyph: 'chef-hat',
  published_at: '2026-08-14T09:20:00.000000Z',
  headline_template: ':actor put :count dishes on the menu',
  actors: [who.cook],
  objects: [dishes.cutlets, dishes.roti],
  distinct: { actors: 1, objects: 2 },
})
</script>

A composite is one activity whose object is a **collection**: several dishes
put on the menu as a single activity.

<a id="recording-a-composite"></a>

## Recording Composites

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/PublishMenuController.php"
<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PublishMenuController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $dishes = MenuItem::whereIn('id', $request->input('dishes'))->get();

        $dishes->each->update(['published_at' => now()]);

        Storyfeed::activity()
            ->by($request->user())
            ->action('publish')
            ->objects($dishes)
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/PublishMenuController.php"
<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class PublishMenuController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $dishes = MenuItem::whereIn('id', $request->input('dishes'))->get();

        $dishes->each->update(['published_at' => now()]);

        Storyfeed::record(
            verb: 'publish',
            objects: $dishes,
            actor: $request->user(),
        );

        return back();
    }
}
```
:::

<FeedExample context :items="[authored]" />

This writes a parent activity and one activity per dish. In `log()` the dishes
appear as ordinary rows; in the other modes the parent is one node with
`axis: 'composite'`.

<a id="headlines-for-a-composite"></a>

## Defining Composite Headlines

A composite needs two headlines: one for the group, and one for its parent
activity. The parent has **no object of its own**, so no object type's
headline reaches it.

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::verb('publish')->grouped(fn (GroupBuilder $group) => $group->composite(
    ':actor put :count dishes on the menu', // the group
    ':actor put dishes on the menu',        // the parent activity
));
```

A composite grouping in `routes/feed.php` or a Story class without the
parent's headline is an error when stories compile.

<FeedExample :items="[authored]" />

<a id="bundling-a-burst-automatically"></a>

## Bundling Activities Automatically

### Marking Models Bundleable

Mark a model `Bundleable`, and a burst of activities on it becomes one
composite:

```php memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Bundleable;
use Storyfeed\Contracts\Feedable;

class MenuItem extends Model implements Feedable, Bundleable
{
    use InteractsWithFeed;
}
```

```php memo="app/Providers/AppServiceProvider.php"
// boot()
use Storyfeed\Facades\Storyfeed;

Storyfeed::bundleables(['menu_item']);
```

```php memo="config/storyfeed.php"
'grouping' => [
    'composite' => [
        'auto' => true,
        'min_objects' => 2,   // fewest distinct objects that make a composite
    ],
],
```

Bundling happens when the actor's **batch** closes.

<a id="batches"></a>

### Closing Batches

A batch is a burst of activity by one actor. Its quiet window defaults to `grouping.batch.quiet_minutes`; the verb can
declare its own window with [`batched(within:)`](/deeper/story-middleware-and-batching#batch-windows). Each publish sets the batch's
`closes_at`.

```php memo="config/storyfeed.php"
'grouping' => [
    'batch' => [
        'enabled' => true,
        'quiet_minutes' => 10,
    ],
],
```

To close batches on time, schedule the command. Otherwise a batch closes at
the actor's next publish.

```php memo="routes/console.php"
use Illuminate\Support\Facades\Schedule;

Schedule::command('storyfeed:close-batches')->everyFiveMinutes();
```

Closing fires `BatchClosed`, which you can listen to for digest emails.

<a id="backfilling"></a>

## Bundling Existing Activities

`Bundleable` applies only to new activity. To bundle past activity:

```bash
php artisan storyfeed:bundle
php artisan storyfeed:bundle --window=30   # only batches closed in the last 30 days
```

It is safe to run twice. Run it when few people are reading, because it
regroups past days.
