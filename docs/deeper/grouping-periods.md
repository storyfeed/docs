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
use Storyfeed\Grouping\Group;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag')
    ->groupedWeekly()
    ->grouped(Group::repeat()->headline(':actor placed :count orders with :target'));
```

A customer places orders with the same shop on three days in the same
week. The grouped feed can show them together:

<FeedExample :items="[weekly]" />

The period sets the calendar boundary for grouping. The axis still decides
which activities belong together; `repeat` keeps the actor, verb, object type,
and target together. Other grouping criteria and thresholds still apply.

<a id="choosing-a-calendar-period"></a>

### Available Periods

| Declaration | Calendar Boundary |
|---|---|
| `groupedHourly()` | the start of each hour |
| `groupedDaily()` | midnight; the default |
| `groupedWeekly()` | Monday at midnight, using ISO weeks |
| `groupedMonthly()` | midnight on the first day of each month |

### Timezones and Boundaries

Boundaries use `app.timezone`. ISO weeks start on Monday regardless of locale.
With hourly grouping, activities at 14:59 and 15:01 belong to different
periods even though they are only two minutes apart.

`groupedPer('week')` is the equivalent when choosing the period in code. It
accepts `hour`, `day`, `week`, or `month`, or a `Storyfeed\Grouping\Period` case.

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

## Calendar Periods and Batch Windows

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\Group;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag')
    ->groupedWeekly()
    ->grouped(Group::repeat()->headline(':actor placed :count orders with :target'))
    ->batched(within: '5 minutes');
```

<FeedExample :items="[weekly]" />

This replaces the first declaration. The weekly group can span separate
sittings. The batch window tracks a sitting by inactivity: each batched activity
can extend its closing time. `within` means a sliding window; calendar periods
use `groupedHourly()`, `groupedDaily()`, `groupedWeekly()`, or `groupedMonthly()`.

## Applying Period Changes

<a id="applying-a-changed-period-to-stored-activities"></a>

### Rehashing Stored Activities

```bash
php artisan storyfeed:curate --rehash # Recomputes grouping for stored activities.
```

A changed declaration affects newly published activities. Existing rows retain
their grouping until rehashed. This command applies the current grouping
strategy to stored activities, so it can change groups already shown in a feed.

### Curation Look-Back

```bash
php artisan storyfeed:curate --window=2
```

A bounded curation pass widens its look-back for declarations that need a longer
period. A weekly verb reaches back eight days; a monthly verb reaches back
32 days. Other verbs keep the requested window. A wildcard declaration widens
the scan for the rows it matches, including more specific overrides.

The scheduled curation pass applies the same widening to `storyfeed.curate.window`.
