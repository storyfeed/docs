# Composites

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

## Recording One Yourself

::: code-group
```php [Fluent Syntax]
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

```php [Named Arguments]
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

## Bundling a Burst Automatically

Mark a model `Bundleable`, and a burst of activities on it becomes one
composite:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Contracts\Bundleable;
use Storyfeed\Contracts\Feedable;

class MenuItem extends Model implements Feedable, Bundleable
{
    // …
}
```

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;

Storyfeed::bundleables(['menu_item']);
```

```php
// config/storyfeed.php
'grouping' => [
    'composite' => [
        'auto' => true,
        'min_objects' => 2,   // fewest distinct objects that make a composite
    ],
],
```

Bundling happens when the actor's **batch** closes.

## Batches

A batch is a burst of activity by one actor. It closes once the actor has been
quiet for `quiet_minutes`.

```php
// config/storyfeed.php
'grouping' => [
    'batch' => [
        'enabled' => true,
        'quiet_minutes' => 10,
    ],
],
```

To close batches on time, schedule the command. Otherwise a batch closes at
the actor's next publish.

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('storyfeed:close-batches')->everyFiveMinutes();
```

Closing fires `BatchClosed`, which you can listen to for digest emails.

## Headlines for a Composite

A composite needs two headlines: one for the group, and one for its parent
activity. The parent has **no object of its own**, so no object type's
headline reaches it.

::: code-group

```php [Fluent Syntax]
// routes/feed.php
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::verb('publish')->grouped(fn (GroupBuilder $group) => $group->composite(
    ':actor put :count dishes on the menu', // the group
    ':actor put dishes on the menu',        // the parent activity
));
```

```php [Array]
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;

Storyfeed::aggregateGrammar([
    'composite.publish' => ':actor put :count dishes on the menu',
]);

// the parent: blank without it
Storyfeed::grammar([
    '*.publish' => ':actor put dishes on the menu',
]);
```

:::

A composite grouping in `routes/feed.php` or a Story class without the
parent's headline is an error when stories compile.

## Backfilling

`Bundleable` applies only to new activity. To bundle past activity:

```bash
php artisan storyfeed:bundle
php artisan storyfeed:bundle --window=30   # only batches closed in the last 30 days
```

It is safe to run twice. Run it when few people are reading, because it
regroups past days.
