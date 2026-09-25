# Composites

## Introduction

<script setup>
import { scene, group } from '../.vitepress/theme/world'
const children = scene.deeper.composites.tasks
// A hypothetical single publish of the catalogue's task objects.
const authored = group({ id: 'composite-tasks', verb: 'complete', axis: 'composite', count: children.length,
  glyph: children[0].glyph, published_at: children[1].published_at,
  headline_template: ':actor completed :count tasks', actors: [children[0].actor],
  objects: children.map(row => row.object), distinct: { actors: 1, objects: children.length } })
</script>

A composite is one activity whose object is a **collection**: several tasks
completed as a single activity.

<a id="recording-a-composite"></a>

## Recording Composites

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/CompleteTasksController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class CompleteTasksController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $tasks = Task::whereIn('id', $request->input('tasks'))->get();

        $tasks->each->update(['completed_at' => now()]);

        Storyfeed::activity()
            ->by($request->user())
            ->action('complete')
            ->objects($tasks)
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/CompleteTasksController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class CompleteTasksController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $tasks = Task::whereIn('id', $request->input('tasks'))->get();

        $tasks->each->update(['completed_at' => now()]);

        Storyfeed::record(
            verb: 'complete',
            objects: $tasks,
            actor: $request->user(),
        );

        return back();
    }
}
```
:::

<FeedExample :items="[authored]" />

This writes a parent activity and one activity per task. In `log()` the tasks
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

Story::verb('complete')->grouped(fn (GroupBuilder $group) => $group->composite(
    ':actor completed :count tasks', // the group
    ':actor completed tasks',        // the parent activity
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

```php memo="app/Models/Task.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Bundleable;
use Storyfeed\Contracts\Feedable;

class Task extends Model implements Feedable, Bundleable
{
    use InteractsWithFeed;
}
```

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::bundleables(['task']);
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
