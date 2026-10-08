# Custom Axes

Group activities by shared fields and choose which custom group takes priority.

<script setup>
import { scene, logOf, liveOf, VERBS, group } from '../.vitepress/theme/world'
const contextRows = logOf(scene.deeper.aggregation.contexts)
const contextGroup = (members) => group({
  id: `scene-${members.length}`, axis: 'scene', verb: 'ask', count: members.length,
  published_at: members[0].published_at, headline_template: ':actors asked questions in :context',
  glyph: members[0].glyph, actors: members.map(m => m.actor),
  targets: [members[0].target], contexts: [members[0].context], children: members,
})
const contextActors = liveOf(contextRows, { ...VERBS, ask: { ...VERBS.ask, actors_target: ':actors asked about :target' } })
</script>

<a id="custom-axes"></a>

## Defining Custom Axes

Define a custom axis with the fields activities must share and the threshold
they must meet:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Grouping\Axis;

$scene = Axis::make('scene')
    ->key('v:ca!:cid!:d')
    ->eligibleWhenDistinct('actor', min: 2);

Storyfeed::axes([$scene]);
```

Here, `scene` groups activities in the same [context](/deeper/context), such
as three customers asking about dishes in one shop. Use `$group->axis('scene', …)`
inside `grouped()` to define its headline, or `$group->any(…)` to match any axis.

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::verb('ask')->grouped(fn (GroupBuilder $group): GroupBuilder => $group
    ->axis('scene', ':actors asked questions in :context')
    ->actorsOnTarget(':actors asked about :target'));
```

Two customers sharing a context meet this axis's threshold but not the built-in
`actors_target` threshold, so the query returns a `scene` group:

<FeedExample :items="[contextGroup(contextRows.slice(0, 2))]" />

<a id="keys"></a>

## Axis Keys

Separate shared fields with `:`. Add `!` after a field to exclude activities
where it is empty.

| Role | Type Field | Id Field |
|---|---|---|
| `actor` | `aa` | `aid` |
| `object` | `oa` | `oid` |
| `target` | `ta` | `tid` |
| `context` | `ca` | `cid` |
| `origin` | `ora` | `orid` |
| `result` | `ra` | `rid` |
| `instrument` | `ia` | `iid` |

See [Default Grouping Keys](/reference/configuration#default-grouping-keys) for the built-in axes.

Built-in axes assign their keys to persisted bursts. Custom axes may add `v`
to group by verb and `d` to group by calendar period (a day by default).
A singular token such as `:context` requires both of that role's fields in the
key. Without `v`, the group may contain several verbs, so define its headline
on a key without a verb (`scene.*` or `*.*`).

<a id="choosing-a-calendar-period"></a>
<a id="available-periods"></a>
<a id="timezones-and-boundaries"></a>
<a id="applying-a-period-to-every-verb"></a>
<a id="setting-default-periods"></a>

### Calendar Periods

Calendar declarations such as `groupedWeekly()` apply to custom axes whose
keys include the calendar field `d`. Built-in Live axes use burst windows.

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;

Story::verb('ask')->groupedWeekly();
```

The `scene` key above includes `d`, so this declaration groups each week's
questions separately. Calendar boundaries use the application's timezone.

<a id="priority"></a>

## Prioritizing Axes

With three customers, both `actors_target` and `scene` qualify. The built-in `actors_target`
axis has priority and selects the group:

<FeedExample :items="contextActors" />

New axes have the lowest priority among selectable axes. To put `scene` before
`actors_target`, reuse the `$scene` defined above:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::axes([$scene], before: 'actors_target');
```

After group selection runs with this priority, the same activities form a
`scene` group that names their shared context:

<FeedExample :items="[contextGroup(contextRows)]" />
