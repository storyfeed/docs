# Retention

A verb can say how long its activities are worth keeping. `storyfeed:prune`
deletes them once they are older, along with anything only they referred to.

<script setup>
import { who, orders, group } from '../.vitepress/theme/samples'

const before = group({ id: 're1', verb: 'view', axis: 'repeat', count: 5, glyph: 'eye',
  published_at: '2026-08-14T14:10:00.000000Z',
  headline_template: ':actor viewed :count orders',
  actors: [who.owner], objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 1, objects: 5 } })

const after = group({ id: 're1', verb: 'view', axis: 'repeat', count: 2, glyph: 'eye',
  published_at: '2026-08-14T14:10:00.000000Z',
  headline_template: ':actor viewed :count orders',
  actors: [who.owner], objects: [orders.fourth, orders.fifth],
  distinct: { actors: 1, objects: 2 } })
</script>

## Keeping a Verb for a While

A viewed order matters for a month, and then it doesn't:

::: code-group

```php [Fluent Syntax]
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('view')
    ->headline(':actor viewed :object')
    ->keepFor('30 days'); // [!code focus]
```

```php [Array]
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;

Storyfeed::stories([
    'order.view' => [
        'headline' => ':actor viewed :object',
        'keepFor' => '30 days',
    ],
]);
```

:::

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('storyfeed:prune')->daily();
```

Each run permanently deletes the `view` activities older than 30 days. Other
verbs are kept.

`keepFor()` takes a string Carbon reads as an interval: `'30 days'`,
`'6 months'`, or a `DateInterval`. It sits on the same ladder as a headline,
so `Story::verb('view')->keepFor(…)` applies to views of every type.

## A Window for Every Verb

`prune.after_days` sets a window for every verb that declares none.
`keepForever()` exempts a verb from it:

```php
// config/storyfeed.php
'prune' => [
    'after_days' => 365,
],
```

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('refund')->keepForever(); // [!code focus]
```

| The Verb Declares | Its Activities Are Pruned After |
|---|---|
| `keepFor('30 days')` | 30 days, whatever `prune.after_days` says |
| `keepForever()` | never |
| nothing | `prune.after_days`, or never when it is `null` |

`storyfeed:prune --days=` overrides `prune.after_days` for one run. A verb's own
window still wins.

## Seeing What a Run Would Delete

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

Run it after declaring or shortening a window: the next run deletes everything
already past it.

## What a Run Deletes

A group loses the members that were pruned. Before the run:

<FeedExample :items="[before]" />

After it, with three of the five views past their window:

<FeedExample :items="[after]" />

A group whose members are all pruned is gone. A run that changes a group moves
the `sync_token`, so a client paging an old cursor starts again from the head.

The run also deletes the snapshots and tombstones that only pruned activities
referred to, so a pruned entity's label and data leave the database too.
Nothing records what a run removed.

::: tip Pruning and not recording
A state that stops mattering within seconds, such as someone typing, is not an
activity at all. [Choosing What Not to Record](/cookbook/choosing-what-not-to-record)
covers it.
:::
