# Aggregation

## Introduction

Aggregation combines related activities into one feed item, so three orders
from one customer appear as one row.

<script setup>
import { scene, logOf, liveOf, everything } from '../.vitepress/theme/world'
const log = logOf(scene.deeper.aggregation.orders)
const repeat = liveOf(log)[0]
const customers = logOf(scene.deeper.aggregation.customers)
const actors = liveOf(customers)[0]
const live = liveOf(everything())
</script>

## Grouping Activities

<a id="grouping-repeats"></a>

### Repeated Activities

Here are three orders from one customer, minutes apart, in log mode:

<FeedExample :items="log" />

Define a headline with `grouped()` to describe them together:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::for(Order::class)
    ->verb('place')
    ->grouped(fn (GroupBuilder $group) => $group
        ->repeat(':actor placed :count orders with :target'));
```

<FeedExample :items="[repeat]" />

<a id="grouping-along-another-axis"></a>

<a id="activities-along-other-axes"></a>

### Activities Sharing a Role

Five customers ordering from the same shop need a different sentence. Each
group names an **axis**: what its activities have in common.

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::verb('place')->grouped(fn (GroupBuilder $group) => $group
    ->actors(':actors ordered from :target'));
```

<FeedExample :items="[actors]" />

A `repeat` group contains one type, so its headline belongs under
`Story::for(Order::class)` and can say "orders". An `actors` group may also
contain reservations, so its headline belongs on the verb alone and must not
name a type.

Storyfeed groups activities when published. Each activity belongs to only one
group per read mode. Quotes and images belong to the activities, so use `log()`
to show each one.

<a id="axes-by-read-mode"></a>

## Choosing a Read Mode

In a longer feed, repeated actions and activities at busy places appear as
rows you can expand:

<FeedExample :items="live" days height="520" />

The read mode determines which groups the query returns:

| Mode | Returns |
|---|---|
| `log()` | one item per activity, including each member of a composite |
| `live()` | one group per activity, chosen from the groups it qualifies for, with `repeat` as the fallback. The default |
| `summary()` | one summary item per actor per calendar day (or the period passed to `summary()`), across verbs. See [Reading Feeds](/basics/reading#summary) |

Set `grouping.curate` to `false` to limit `live()` to repeats.
`storyfeed:curate` chooses groups for recent activities and runs hourly through
Laravel's scheduler.

## Grouping Axes

### Built-In Axes

| Axis | Collapses | Singular Tokens Allowed | One Type | Example Headline |
|---|---|---|---|---|
| `repeat` | one actor repeating a verb | `:actor` `:target` | yes | ":actor placed :count orders with :target" |
| `actors` | many actors, same verb and target | `:target` | no | ":actors ordered from :target" |
| `targets` | one actor across targets | `:actor` | no | ":actor asked about :targets" |
| `object` | many actions on one object | `:actor` `:object` | yes | ":actor changed the price of :object :count times" |
| `composite` | an authored collection story | `:actor` `:target` `:context` | — | see [Composites](/deeper/composites#headlines-for-a-composite) |

Headlines for groups marked **One Type** may go in a Story class or inside
`Story::for()`. Define the others on the verb alone.

<a id="thresholds"></a>

### Configuring Grouping Thresholds

```php memo="config/storyfeed.php"
'grouping' => [
    'policy' => [
        'min_actors' => 3,
        'min_targets' => 2,
        'min_target_members' => 3,
        'min_object_members' => 2,
    ],
],
```

| Key | What the Axis Needs | Default |
|---|---|---|
| `min_actors` | `actors`: this many different actors | 3 |
| `min_targets` | `targets`: this many different targets | 2 |
| `min_target_members` | `targets`: this many activities | 3 |
| `min_object_members` | `object`: this many activities on the one object | 2 |

Activities below a threshold cannot form that group. They fall back to
`repeat` when no other group qualifies. Published activities keep their groups
until you [rehash them](/reference/commands#rehashing-existing-rows).

See [Grouping Periods](/deeper/grouping-periods) to choose the calendar
boundary shared by grouped activities.

<a id="registering-a-group-headline"></a>

## Defining Group Headlines

Pass one headline per axis to `grouped()`, as in the
[repeat](#grouping-repeats) and [actors](#grouping-along-another-axis) examples.
Where you declare it determines which groups use it.

### Definition Scope

| Written In | Key | Used For |
|---|---|---|
| `Story::for(Order::class)->verb('place')`, or a Story class's `place()` | `repeat.order.place` | groups of orders |
| `Story::verb('place')` | `repeat.place` | groups of any type |

Storyfeed tries the key with the group's type first, then the key without it.

<a id="plural-tokens"></a>

### Singular and Plural Tokens

| Singular Token | Plural Token | Entity Role |
|---|---|---|
| `:actor` | `:actors` | who acted |
| `:object` | `:objects` | what the activity acted on |
| `:target` | `:targets` | what the activity was directed at |
| `:context` | `:contexts` | the surrounding container |
| `:origin` | `:origins` | the source |
| `:result` | `:results` | the produced entity |
| `:instrument` | `:instruments` | the tool or service used |

A plural token displays a few names and a count of the rest. See
[Rendering](/basics/rendering#groups) for details. `:count` is the number of
activities in the group.

<a id="group-headline-tokens"></a>

A singular token is allowed only when **every** activity shares that role,
as shown in **Singular Tokens Allowed** above. Plural tokens are allowed in
any group headline.

```php
// a repeat group: one customer, many dishes
':actor changed the price of :object :count times' // ✗ which dish? fails when stories compile
':actor changed :count prices'                      // ✓
':actor changed :count prices on :targets'          // ✓ lists fit every member
```

<a id="plural-lists-in-headlines"></a>

Both headlines use allowed tokens, but three lists make the first hard to read:

```php
// an actors group: every member shares :target
':actors placed :objects with :targets' // ✗ three lists of names
':actors ordered from :target'          // ✓ one list, one shared role
```

Use one list per headline and replace the others with `:count`.

<a id="groups-with-missing-roles"></a>

### Missing Roles

A plural token lists only filled roles. The `targets` axis groups by actor,
verb, and calendar period (a day by default). An activity with an empty target
can therefore join the group: it contributes to `:count` but adds no name.

```php
// a targets group of 5 members, 2 of them carrying a target
':actor asked about :count dishes'  // ✗ five members, two dishes
':actor asked about :targets'       // ✓ names the two there are
```

The first headline says there are five dishes when only two are recorded.
Storyfeed does not check nouns beside `:count`.

### Fallback Nouns

With no group headline, a group tries the single-activity headline. A role
that differs across the group becomes a plain noun, such as "dishes", when all
its entities are one type. Otherwise the group has no headline, and
[your renderer handles it](/basics/rendering#groups-without-headlines).

Give a type its noun:

```php memo="routes/feed.php"
use App\Models\MenuItem;
use Storyfeed\Facades\Story;

Story::for(MenuItem::class)->fallback()->noun('dish|dishes');
```

Supply both forms; Storyfeed does not derive plurals. For more plural forms,
add pipe segments. See [Localization](/deeper/localization#translating-a-noun)
for translated nouns. The default is `item|items`.

The entity count selects the form: `FeedNoun::form('dish|dishes', 7)` returns
`dishes`. The headline `:actor put :object on the menu` becomes
`:actor put dishes on the menu`. The noun is plain text; `:actor` remains a link.

<a id="custom-axes"></a>

## Defining Custom Axes

Define a custom axis with the fields activities must share and the threshold
they must meet:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Grouping\Axis;

Storyfeed::axes([
    Axis::make('scene')
        ->key('v:ca!:cid!:d')                      // same verb, same context, same day
        ->eligibleWhenDistinct('actor', min: 2),
]);
```

Here, `scene` groups activities in the same [context](/deeper/context), such
as three customers asking about dishes in one shop. Use `$group->axis('scene', …)`
inside `grouped()` to define its headline, or `$group->any(…)` to match any axis.

<a id="keys"></a>

### Axis Keys

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

Add `v` to group by verb and `d` to group by calendar period (a day by default).
A singular token such as `:context` requires both of that role's fields in the
key. Without `v`, the group may contain several verbs, so define its headline
on a key without a verb (`scene.*` or `*.*`).

<a id="priority"></a>

### Prioritizing Axes

New axes have the lowest priority. To place one before a built-in axis:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::axes([$scene], before: 'repeat');
```
