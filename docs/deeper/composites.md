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
appear as ordinary rows. In `live()`, the parent is one node with
`axis: 'composite'`; in `summary()`, it contributes a phrase to its actor's
digest row. A composite is never replaced by
[`keepLatest()`](/deeper/keeping-the-latest-activity).

<a id="headlines-for-a-composite"></a>

## Defining Composite Headlines

A composite takes two headlines: one for the group of tasks, and one for the
composite activity itself. Neither is about a single task, so both go on the
verb:

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::verb('complete')->grouped(fn (GroupBuilder $group) => $group->composite(
    ':actor completed :count tasks', // the group
    ':actor completed tasks',        // the activity itself; required
));
```

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

For a model you don't own, register its morph alias instead:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::bundleables(['task']);
```

Auto-bundling is on by default. These `config/storyfeed.php` keys control it:

| Key | Default | Meaning |
|---|---|---|
| `grouping.composite.auto` | `true` | bundle bursts of `Bundleable` activities |
| `grouping.composite.min_objects` | `2` | fewest different objects that make a composite |

<a id="batches"></a>

### Closing Batches

Bundling happens when the actor's [batch](/deeper/story-middleware-and-batching#batch-windows)
closes, so batching must stay enabled. A batch closes at the actor's next
publish after its window, or on time when
[`storyfeed:close-batches` is scheduled](/reference/commands#scheduling-maintenance).

<a id="backfilling"></a>

## Bundling Existing Activities

`Bundleable` applies only to new activity. To bundle past activity:

```bash
php artisan storyfeed:bundle
php artisan storyfeed:bundle --window=30   # only batches closed in the last 30 days
```

It is safe to run twice. When it creates a composite, it changes the
`sync_token`, and clients must discard their accumulated nodes and refetch
from the head. See the [sync token rule](/reference/payload#sync-token).
