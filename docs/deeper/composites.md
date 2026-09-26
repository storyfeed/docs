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

A composite is one activity whose object is a **collection**, such as several
tasks completed together.

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

This writes a parent activity and one activity per task. `log()` returns each
task separately. `live()` returns the parent as one item with `axis: 'composite'`.
In `summary()`, it contributes a phrase to its actor's summary row.
[`keepLatest()`](/deeper/keeping-the-latest-activity) never replaces a composite.

<a id="headlines-for-a-composite"></a>

## Defining Composite Headlines

Define two headlines on the verb: one for the group of tasks and one for the
composite activity. Both describe the collection, so neither belongs on a
single task type:

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::verb('complete')->grouped(
    fn (GroupBuilder $group) => $group->composite(
        ':actor completed :count tasks', // the group
        ':actor completed tasks',        // the activity itself; required
    ),
);
```

<FeedExample :items="[authored]" />

<a id="bundling-a-burst-automatically"></a>

## Bundling Activities Automatically

### Marking Models Bundleable

Implement `Bundleable` to combine batched activities on a model into a composite:

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

For a model you cannot edit, register its morph alias:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::bundleables(['task']);
```

Automatic bundling is enabled by default. Configure it in `config/storyfeed.php`:

| Key | Default | Meaning |
|---|---|---|
| `grouping.composite.auto` | `true` | combine batched `Bundleable` activities into composites |
| `grouping.composite.min_objects` | `2` | minimum distinct objects per composite |

<a id="batches"></a>

### Closing Batches

Bundling runs when the actor's [batch](/deeper/story-middleware-and-batching#batch-windows)
closes, so leave batching enabled. The batch closes on the actor's next
publication after the window expires. Schedule
[`storyfeed:close-batches`](/reference/commands#scheduling-maintenance) to
close it on time without another publication.

<a id="backfilling"></a>

## Bundling Existing Activities

`Bundleable` applies only to new activities. To bundle existing activities:

```bash
php artisan storyfeed:bundle
php artisan storyfeed:bundle --window=30   # only batches closed in the last 30 days
```

You may run this command more than once. Creating a composite changes the
`sync_token`, so clients must discard accumulated items and fetch the feed
from the start. See the [sync token rule](/reference/payload#sync-token).
