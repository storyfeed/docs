# Live Burst Windows

Live combines the same action while activity continues. A quiet gap or a
maximum duration closes the row; the next activity starts another burst.

<script setup>
import { scene, liveOf } from '../.vitepress/theme/world'
const rows = scene.deeper.aggregation.orders
</script>

<a id="grouping-a-verb-by-week"></a>
<a id="setting-a-grouping-period"></a>

## Setting a Verb's Window

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;

Story::verb('place')->bursts(within: '10 minutes', ceiling: '1 hour');
```

Orders placed minutes apart share one row:

<FeedExample :items="liveOf(rows)" />

| Setting | Default | Closes a Burst When |
|---|---|---|
| `within` | `'15 minutes'` | the next activity reaches the quiet gap |
| `ceiling` | `'4 hours'` | the next activity reaches this duration from the start |

The window slides with each activity, up to the ceiling. A burst can cross
midnight. A closed burst stays closed when a late activity arrives.
Each row contains one action. [Aggregation](/deeper/aggregation#built-in-axes)
determines which people and things can share it.

<a id="choosing-a-calendar-period"></a>
<a id="available-periods"></a>
<a id="timezones-and-boundaries"></a>
<a id="applying-a-period-to-every-verb"></a>
<a id="setting-default-periods"></a>

## Setting Default Windows

```php memo="config/storyfeed.php"
'grouping' => [
    'bursts' => [
        'within' => '15 minutes',
        'ceiling' => '4 hours',
    ],
],
```

A verb's `bursts()` declaration overrides both defaults. An argument it leaves
out is `15 minutes` for `within` or `4 hours` for `ceiling`, not the configured
value, so pass both when your defaults differ. A type-and-verb declaration
takes precedence over a verb-only declaration.
Windows must be positive intervals of at least one second.

See [Custom Axes](/deeper/custom-axes#calendar-periods) for calendar-based grouping.
Batch windows independently determine when a batch closes; see
[Story Middleware & Batching](/deeper/story-middleware-and-batching#batch-windows).

<a id="applying-a-changed-period-to-stored-activities"></a>
<a id="applying-period-changes"></a>

## Applying Window Changes

Changed windows apply to new activity. To rebuild existing memberships, pause
every publisher, queue worker, and publishing schedule for the full rebuild.
Maintenance mode alone does not stop queue workers.

```bash
php artisan storyfeed:curate --rebuild-bursts --writers-paused
```

After an interruption, add `--resume` to continue from the committed cursor;
add `--restart` to discard progress and replay all history. Keep writers paused
until the rebuild completes. See [Rehashing Groups](/reference/commands#rehashing-groups).
