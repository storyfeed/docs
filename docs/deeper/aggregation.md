# Aggregation

## Introduction

Aggregation combines related activities into one feed item, so three orders
from one customer appear as one row. See
[Choosing What to Group](/cookbook/choosing-what-to-group) to decide when that
helps the reader.

Which activities group together, and when, is experimental and keeps improving
behind the [payload contract](/reference/payload#group-nodes).

<script setup>
import { scene, logOf, liveOf, VERBS } from '../.vitepress/theme/world'
const log = logOf(scene.deeper.aggregation.orders)
const repeat = liveOf(log, { ...VERBS, place: { ...VERBS.place, repeat: ':actor made :count order placements with :target' } })[0]
const customers = logOf(scene.deeper.aggregation.customers)
const actors = liveOf(customers)[0]
const nounFallback = { ...repeat, headline_template: ':actor placed orders with :target', headline: null }
const singularFallback = { ...repeat, headline_template: ':actor placed an order with :target', headline: null }
const unnamedGroup = { ...repeat, headline_template: null, headline: null }
const menuRows = scene.deeper.aggregation.menu
const menuGroup = { ...liveOf(menuRows)[0], headline_template: ':actor put dishes on the menu' }
const photoGroup = liveOf(scene.guide.usageExamples.photos)[0]
</script>

## Grouping Activities

<a id="grouping-repeats"></a>

### Repeated Activities

Three orders from one customer, minutes apart, in log mode:

<FeedExample :items="log" />

Define a headline with `grouped()` to describe them together:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::for(Order::class)
    ->verb('place')
    ->grouped(
        fn (GroupBuilder $group) => $group
            ->repeat(':actor made :count order placements with :target'),
    );
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

Story::verb('place')->grouped(
    fn (GroupBuilder $group) => $group
        ->actorsOnTarget(':actors ordered from :target'),
);
```

<FeedExample :items="[actors]" />

A `repeat` group contains one type, so its headline belongs under
`Story::for(Order::class)` and can say "orders". An `actors_target` group may also
contain reservations, so its headline belongs on the verb alone and must not
name a type.

Storyfeed groups activities when published. Each activity belongs to only one
group per read mode.

To keep quotes and images visible individually, see
[Choosing What to Group](/cookbook/choosing-what-to-group#keeping-content-visible). [Storage Architecture](/reference/storage#reading-a-page)
shows where groups are stored and how a feed retrieves them.

<a id="featured-entities"></a>

### Members' Featured Entities

Each activity features one role's entity, its object unless the activity says
otherwise; see [Featuring Another Role](/basics/activity-content#featuring-another-role).
A group lists the entity each member features in `sample.featured`, newest
first, one entry per member, so an entity can repeat. For photos uploaded
together, these are the photos:

<FeedExample expanded :items="[photoGroup]" />

| Key | Holds |
|---|---|
| `featured` | the role every member features, when the axis pins it to one entity, which is then in that role's key; otherwise `null` |
| `sample.featured` | each sampled member's featured entity, newest first; a member that features nothing adds no entry |
| `distinct.featured` | how many members across the whole group feature an entity |
| `distinct_tombstoned.featured` | how many of those entities are tombstones |

`grouping.sample_limits.featured` caps `sample.featured`, three by default.

<a id="axes-by-read-mode"></a>

## Choosing a Read Mode

See [Choosing a Read Mode](/basics/reading#choosing-a-read-mode) for Live and Log.
Curation controls which groups Live reads:

| Mode | Returns |
|---|---|
| `live()`, `grouping.curate = true` (default) | groups selected across the available axes, with a `repeat` group when no other group is selected |
| `live()`, `grouping.curate = false` | repeat groups and composites, regardless of inferred groups selected earlier |

Set `grouping.curate` to `false` for repeat-only `live()` reads.
`storyfeed:curate` chooses groups for recent activities and runs hourly through
Laravel's scheduler.

## Grouping Axes

### Built-In Axes

Live selects people acting on one thing first: `actors` for the same object,
then `actors_target` for the same target. It next selects one person acting
across things in the same context, then actions on one object, then repeats.
Two entities match when their type and ID match. Every built-in group
contains one verb and one context, within a [burst window](/deeper/grouping-periods).

| Axis | Shared Values | What May Differ | Singular Tokens Allowed |
|---|---|---|---|
| `actors` | verb, object, target, context | actor | `:object`, `:target`, `:context` |
| `actors_target` | verb, target, context | actor, object | `:target`, `:context` |
| `targets` | actor, verb, context | target, object | `:actor`, `:context` |
| `object` | actor, verb, object, target, context | activity data | `:actor`, `:object`, `:target`, `:context` |
| `repeat` | actor, verb, object type, target, context | object identity | `:actor`, `:target`, `:context` |
| `composite` | actor, target and context of one published activity | members of its object collection | `:actor`, `:target`, `:context` |

Origin, result, instrument, location, generator and activity data may differ. A composite is one
published activity with a collection of objects; see [Composites](/deeper/composites).

Shared values alone do not select a group: activities must also meet the
[thresholds](#configuring-grouping-thresholds), and Storyfeed must select the
group. [Default Grouping Keys](/reference/configuration#default-grouping-keys) lists their keys.

Headlines for `repeat` and `object` groups may go in a Story class or inside
`Story::for()` because each group contains one object type. Define headlines
for `actors`, `actors_target` and `targets` on the verb alone.

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
| `min_actors` | `actors` or `actors_target`: this many different actors | 3 |
| `min_targets` | `targets`: this many different targets | 2 |
| `min_target_members` | `targets`: this many activities | 3 |
| `min_object_members` | `object`: this many activities on the one object | 2 |

Two customers at the same shop do not meet `min_actors: 3`. With no other
qualifying group, each remains an individual item:

<FeedExample :items="liveOf(customers.slice(0, 2))" />

Three customers meet the threshold and form an `actors` group:

<FeedExample :items="liveOf(customers.slice(0, 3))" />

Activities below a threshold cannot form that group. They fall back to
`repeat` when no other group qualifies. After changing thresholds, run
`php artisan storyfeed:curate` to re-evaluate existing groups. Changes to an
axis's grouping key or newly registered axes require
[rehashing](/reference/commands#rehashing-existing-rows).

See [Live Burst Windows](/deeper/grouping-periods) to choose the quiet gap
and maximum duration shared by grouped activities.

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

Choose the declaration location from the [built-in axis table](#built-in-axes):
`repeat` and `object` share an object type; `actors` and `targets` may span types.

A type-level headline may name that type because every member shares it.
A verb-level headline may describe several object types, so avoid naming a
particular type. `:count` counts activities, not distinct objects; see
[the repeated-order example](/cookbook/grouped-headlines#counting-placements-of-the-same-order)
for wording that keeps this distinction visible.

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
| `:location` | `:locations` | where the action happened |
| `:generator` | `:generators` | the app or agent that produced the activity |

A plural token displays a few names and a count of the rest. See
[Rendering](/basics/rendering#groups) for details. `:count` is the number of
activities in the group.

<a id="group-headline-tokens"></a>

A singular token is allowed only when **every** activity shares that role,
as shown in [Singular Tokens Allowed](#built-in-axes). Plural tokens are allowed in
any group headline.

```php
// a repeat group: one customer, many dishes
':actor changed the price of :object :count times' // Invalid: objects differ within this repeat group.
':actor changed :count prices'                      // Counts activities.
':actor changed :count prices on :targets'          // Lists the targets.
```

<a id="plural-lists-in-headlines"></a>

Both headlines use allowed tokens, but three lists make the first hard to read:

```php
// an actors group: every member shares :target
':actors placed :objects with :targets' // Three lists of names.
':actors ordered from :target'          // One list and the shared target.
```

Use one list per headline and replace the others with `:count`.

<a id="groups-with-missing-roles"></a>

### Missing Roles

A plural token lists only filled roles. The `targets` axis groups by actor,
verb, context and burst window. An activity with an empty target
can therefore join the group: it contributes to `:count` but adds no name.

```php
// a targets group of 5 members, 2 of them carrying a target
':actor asked about :count dishes'  // Counts five activities as five dishes.
':actor asked about :targets'       // Lists the two recorded targets.
```

The first headline says there are five dishes when only two are recorded.
Storyfeed does not check nouns beside `:count`.

### Fallback Nouns

When no group headline is defined, Storyfeed uses the single-activity headline
if its roles can be represented for the group. A role
that differs across the group becomes a plain noun, such as "dishes", when all
its entities are one type. Otherwise both `headline_template` and `headline`
are `null`. See [Groups Without Headlines](/basics/rendering#groups-without-headlines) for rendering the count.
Single-activity headline closures cannot supply this fallback because they
access one member's data rather than the whole group.

Give a type its noun:

```php memo="routes/feed.php"
use App\Models\MenuItem;
use Storyfeed\Facades\Story;

Story::for(MenuItem::class)->fallback()->noun('dish|dishes');
Story::for(MenuItem::class)->verb('add')->headline(':actor put :object on the menu');
```

<FeedExample :items="[menuGroup]" />

Supply both forms; Storyfeed does not derive plurals. For more plural forms,
add pipe segments. See [Localization](/deeper/localization#translating-a-noun)
for translated nouns. The default is `item|items`.

The entity count selects the form: `FeedNoun::form('dish|dishes', 7)` returns
`dishes`. The headline `:actor put :object on the menu` becomes
`:actor put dishes on the menu`. The noun is plain text; `:actor` remains a link.

<a id="seeing-the-fallback"></a>

### Fallback Headlines

| Available Headline | Payload |
|---|---|
| An authored group headline | The authored template or finished text; `:count` supplies the activity count. |
| A safe single-activity template | The single-activity template with unshared roles replaced by nouns where possible; no count is added automatically. |
| Neither a group headline nor a safe single-activity template | Both `headline_template` and `headline` are `null`; member counts and children remain available. |

The authored headline counts the placements:

<FeedExample :items="[repeat]" />

A noun fallback can say “placed orders” without saying how many:

<FeedExample :items="[nounFallback]" />

A template whose tokens all refer to shared roles is safe to reuse, but its prose can
still undercount. “Placed an order” below describes three activities as one:

<FeedExample :items="[singularFallback]" />

The same problem occurs with “removed a clause from :target” for two removals.
Token validation checks that roles are shared; it does not check the words “a clause”. Write
an explicit group headline such as “:actor recorded :count clause removals from :target”
when each activity represents one removal. If individual details matter, use
[`log()`](/basics/reading#log) instead.

With both headline fields absent, the count and member rows remain visible:

<FeedExample :items="[unnamedGroup]" />

See [Groups Without Headlines](/basics/rendering#groups-without-headlines) to
render this payload.

<a id="custom-axes"></a>
<a id="defining-custom-axes"></a>
<a id="keys"></a>
<a id="axis-keys"></a>
<a id="priority"></a>
<a id="prioritizing-axes"></a>

See [Custom Axes](/deeper/custom-axes) to define grouping keys, eligibility, and priority.
