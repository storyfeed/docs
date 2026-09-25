# Grouping Periods

## Introduction

A verb can group activities by calendar hour, day, week, or month.
Daily grouping is the default.

<script setup>
import { scene, logOf, group, role } from '../.vitepress/theme/world'
const children = logOf(scene.deeper.groupingPeriods.orders)
const weekly = group({ id: 'period-week', verb: 'place', axis: 'repeat', count: children.length,
  glyph: 'shopping-bag', published_at: children[0].published_at,
  headline_template: ':actor placed :count orders with :target',
  actors: [role.customer], objects: children.map(row => row.object), targets: [role.shop],
  distinct: { actors: 1, objects: children.length, targets: 1 }, children })
</script>

<a id="grouping-a-verb-by-week"></a>

## Setting a Grouping Period

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag')
    ->groupedWeekly()
    ->grouped(fn (GroupBuilder $group) => $group
        ->repeat(':actor placed :count orders with :target'));
```

A customer places orders with the same shop on three days in the same
week. The grouped feed can show them together:

<FeedExample :items="[weekly]" />

The period sets the calendar boundary for grouping. The
[axis](/deeper/aggregation#built-in-axes) still decides which activities
belong together.

<a id="choosing-a-calendar-period"></a>

### Available Periods

| Declaration | Calendar Boundary |
|---|---|
| `groupedHourly()` | the start of each hour |
| `groupedDaily()` | midnight; the default |
| `groupedWeekly()` | Monday at midnight, using ISO weeks |
| `groupedMonthly()` | midnight on the first day of each month |
| `groupedPer('week')` | the period named: `hour`, `day`, `week` or `month`, or a `Storyfeed\Grouping\Period` case |

### Timezones and Boundaries

Boundaries use `app.timezone`. ISO weeks start on Monday regardless of locale.
With hourly grouping, activities at 14:59 and 15:01 belong to different
periods even though they are only two minutes apart.

<a id="applying-a-period-to-every-verb"></a>

## Setting Default Periods

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;

Story::fallback()->groupedWeekly();
```

The fallback applies where a more specific declaration gives no period.
`Story::verb('place')->groupedWeekly()` applies to that verb across object
types. A type-and-verb declaration takes precedence over both.

Activities that need to group together need the same period. A grouping axis
that combines verbs still separates activities with different periods.

> [!NOTE]
> **The difference between a grouping period and a batch window**
>
> A grouping period is a fixed stretch of the calendar, so a weekly group can
> span separate sittings. A [batch window](/deeper/story-middleware-and-batching#batch-windows)
> tracks one sitting by inactivity: each batched activity can extend its
> closing time.

<a id="applying-a-changed-period-to-stored-activities"></a>

## Applying Period Changes

A changed period applies to newly published activities. Activities already
published keep their groups until you
[rehash them](/reference/commands#rehashing-existing-rows):

```bash
php artisan storyfeed:curate --rehash
```
