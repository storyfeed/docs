# Retention

## Introduction

Set retention per verb to control how long activities remain in the feed.
`storyfeed:prune` permanently deletes expired activities and entity details
no remaining activity uses.

<script setup>
import { scene, liveOf, WORLD_ANCHOR } from '../.vitepress/theme/world'
const views = scene.deeper.retention.views
const before = liveOf(views)[0]
const after = liveOf(views.filter(row => Date.parse(row.published_at) >= WORLD_ANCHOR - 60 * 60 * 1000))[0]
</script>

## Defining Retention

### Per-Verb Retention

To keep order views for 30 days, call `keepFor()`:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('view')
    ->headline(':actor viewed :object')
    ->keepFor('30 days');
```

`keepFor()` accepts a Carbon interval string, such as `'30 days'` or
`'6 months'`, or a `DateInterval`. Declare it on `Story::verb('view')` to
apply it across object types.

### Default Retention

Set `prune.after_days` for verbs without a retention declaration:

```php memo="config/storyfeed.php"
'prune' => [
    'after_days' => 365,
],
```

### Keeping Activities Forever

Call `keepForever()` to exempt a verb from default retention:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('refund')->keepForever();
```

| The Verb Declares | Its Activities Are Pruned After |
|---|---|
| `keepFor('30 days')` | 30 days, overriding `prune.after_days` |
| `keepForever()` | never |
| nothing | `prune.after_days`, or never when it is `null` |

Use `storyfeed:prune --days=` to override `prune.after_days` for one run.
Per-verb retention still takes precedence.

## Pruning Activities

<a id="previewing-pruning"></a>

### Previewing a Run

```bash
php artisan storyfeed:prune --pretend
```

```txt
+------+------------+
| Verb | Activities |
+------+------------+
| view | 3          |
+------+------------+
Would prune 3 activities, 2 snapshots and 0 tombstones. Nothing was deleted.
```

Preview changes after setting or shortening retention: the next pruning run
permanently deletes all activities already past the limit.

### Running and Scheduling Pruning

```shell
php artisan storyfeed:prune # Permanently deletes activities past their retention window.
```

```php memo="routes/console.php"
use Illuminate\Support\Facades\Schedule;

Schedule::command('storyfeed:prune')->daily();
```

Each run permanently deletes the `view` activities older than 30 days. Other verbs follow their own declarations or default retention.

<a id="pruned-activities-and-entities"></a>

## Pruning Groups and Unused Entities

Pruning removes expired members from groups. Here, `keepFor('1 hour')` applies
to five views in one daily group, three of which are over an hour old.
Before pruning:

<FeedExample :items="[before]" />

After pruning the three expired views:

<FeedExample :items="[after]" />

Groups are deleted when all their members are pruned. Changing a group
updates the `sync_token`, so clients using old cursors must fetch the feed
from the start.

Pruning also deletes stored entity labels and data that no remaining
activity uses. The command keeps no record of what it removed.

> [!NOTE]
> **Pruning and not recording**
>
> Avoid recording short-lived state such as typing indicators. See
> [Choosing What Not to Record](/cookbook/choosing-what-not-to-record).
