# Aggregation

## Introduction

Aggregation shows several related activities as one row: three orders from
one customer read as one line, not three.

<script setup>
import { who, where, orders, activity, group } from '../.vitepress/theme/samples'

const at = '2026-08-14T14:30:00.000000Z'
const placed = (id, actor, object) => activity({ id, verb: 'place', glyph: 'shopping-bag',
  published_at: at, headline_template: ':actor placed :object with :target',
  actor, object, target: where.kitchen })

const log = [
  placed('ag1', who.regular, orders.third),
  placed('ag2', who.regular, orders.second),
  placed('ag3', who.regular, orders.first),
]

const repeat = group({ id: 'ag4', verb: 'place', axis: 'repeat', count: 3, glyph: 'shopping-bag',
  published_at: at, headline_template: ':actor placed :count orders with :target',
  actors: [who.regular], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 1, objects: 3, targets: 1 } })

const actors = group({ id: 'ag5', verb: 'place', axis: 'actors', count: 5, glyph: 'shopping-bag',
  published_at: at, headline_template: ':actors ordered from :target',
  actors: [who.regular, who.customer2, who.customer3], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 5, objects: 5, targets: 1 } })
</script>

## Grouping Activities

<a id="grouping-repeats"></a>

### Repeated Activities

Three orders from one customer, minutes apart, as a log:

<FeedExample context :items="log" />

The same three, grouped by the verb's `grouped()`:

```php memo="app/Stories/OrderStory.php"
<?php

namespace App\Stories;

use Storyfeed\Stories\Verb;

class OrderStory
{
    public function place(Verb $verb): Verb
    {
        return $verb
            ->headline(':actor placed :object with :target')
            ->grouped(fn ($group) => $group
                ->repeat(':actor placed :count orders with :target'));
    }
}
```

<FeedExample :items="[repeat]" />

<a id="grouping-along-another-axis"></a>

### Activities Along Other Axes

Five customers ordering from the same kitchen need a different sentence. Each
group names an **axis**: what its activities have in common.

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::verb('place')->grouped(fn (GroupBuilder $group) => $group
    ->actors(':actors ordered from :target'));
```

<FeedExample :items="[actors]" />

A `repeat` group holds one type, so `OrderStory::place()` can say "orders". An
`actors` group can hold several types, since other customers may be placing
reservations, so its headline goes on the verb in `routes/feed.php` and names
no type. The same headline in a Story class is an error when stories compile.

Grouping is decided when the activity is published. In each read mode, an
activity is in only one group.

<a id="axes-by-read-mode"></a>

## Choosing a Read Mode

The read mode chooses which groupings a read shows:

| Mode | Reads |
|---|---|
| `log()` | no axis at all — one node per activity, and a composite's members appear as ordinary rows |
| `live()` | `repeat`, plus authored composites |
| `summary()` | the winning axis on any bucket, falling back to `repeat` where nothing has been stamped a winner |

With `grouping.curate` enabled, publishing selects a winning axis.
`storyfeed:curate` also revisits recent activity hourly when Laravel's scheduler runs.

## Grouping Axes

### Built-In Axes

| Axis | Collapses | Pins (Safe Singular Tokens) | One Type | Example Headline |
|---|---|---|---|---|
| `repeat` | one actor repeating a verb | `:actor` `:target` | yes | ":actor placed :count orders with :target" |
| `actors` | many actors, same verb and target | `:target` | no | ":actors ordered from :target" |
| `targets` | one actor across targets | `:actor` | no | ":actor asked about :targets" |
| `object` | many actions on one object | `:actor` `:object` | yes | ":actor changed the price of :object :count times" |
| `composite` | an authored collection story | `:actor` `:target` `:context` | — | see [Composites](/deeper/composites#headlines-for-a-composite) |

A headline for a **One Type** axis can go in a Story class or inside
`Story::for()`. The others go on the verb alone. Inside `grouped()`,
`$group->axis('scene', …)` names a custom axis, and `$group->any(…)` matches
whichever axis wins.

### Thresholds

```php memo="config/storyfeed.php"
'grouping' => [
    'policy' => [
        'min_actors' => 3,          // actors axis needs 3+ distinct actors
        'min_targets' => 2,
        'min_target_members' => 3,
        'min_object_members' => 2,
    ],
],
```

Below a threshold, activities stay ungrouped. Changing a threshold doesn't
regroup past activities until `storyfeed:curate` runs.

`repeat` groups only orders placed with the same kitchen; `targets` groups
across kitchens.

See [Grouping Periods](/deeper/grouping-periods) to choose the calendar
boundary shared by grouped activities.

<a id="registering-a-group-headline"></a>

## Defining Group Headlines

`grouped()` declares a headline for each grouping axis:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::for(Order::class)
    ->verb('place')
    ->grouped(fn (GroupBuilder $group) => $group
        ->repeat(':actor placed :count orders with :target'));

Story::verb('place')->grouped(fn (GroupBuilder $group) => $group
    ->actors(':actors ordered from :target'));
```

<FeedExample :items="[repeat, actors]" />

### Definition Scope

| Written In | Key | Used For |
|---|---|---|
| `OrderStory::place()`, or `Story::for(Order::class)->verb('place')` | `repeat.order.place` | groups of orders |
| `Story::verb('place')` | `repeat.place` | groups of any type |

A group tries the key with its type first, then the key without.

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

A plural token becomes a few of the group's names and a count of the rest.
[Rendering](/basics/rendering#groups) covers how. `:count` is the number of
activities in the group.

<a id="group-headline-tokens"></a>

A group headline may only use tokens that are true of **every** activity in
it. A singular token is allowed only where the axis pins it; a plural token is
allowed everywhere.

```php
// a repeat group: one customer, many dishes
':actor changed the price of :object :count times' // ✗ which dish?
':actor changed :count prices'                     // ✓
':actor changed :count prices on :targets'         // ✓ lists fit every member
```

In `routes/feed.php` or a Story class, the first line is an error when stories
compile.

<a id="plural-lists-in-headlines"></a>

Both of these are token-safe; only one is readable:

```php
// an actors group, which pins :target
':actors placed :objects with :targets' // ✗ three lists of names
':actors ordered from :target'          // ✓ one list, one pinned role
```

Keep one list per template and collapse the others to `:count`.

<a id="groups-with-missing-roles"></a>

### Missing Roles

A plural token lists only the activities that filled the role. `targets`
groups by actor, verb and calendar period (a day by default), so an activity with no target can join the
group: it counts towards `:count` but adds no name.

```php
// a targets group of 5 members, 2 of them carrying a target
':actor asked about :count dishes'  // ✗ five members, two dishes
':actor asked about :targets'       // ✓ names the two there are
```

The first line is wrong because of the noun beside `:count`, and nothing
checks that. A difference between `node.count` and `node.distinct.targets` can mean
repeated targets, missing targets, or both.

### Fallback Nouns

With no group headline, a group tries the single-activity headline. A role
that differs across the group becomes a plain noun, such as "dishes", when all
its entities are one type. Otherwise the group has no headline, and
[your renderer handles it](/basics/rendering#groups-without-headlines).

Give a type its noun:

```php memo="routes/feed.php"
use App\Models\MenuItem;
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\FeedNoun;

Story::for(MenuItem::class)->fallback()->noun('dish|dishes');
Story::for(Order::class)->fallback()->noun(FeedNoun::trans('nouns.order'));
```

Supply both forms; Storyfeed never inflects. Wrap translation keys in
`FeedNoun::trans()`; locales with more plural forms can add pipe segments.
Without a noun, the fallback is `item|items`.

The number of entities picks the form: `FeedNoun::form('dish|dishes', 7)`
returns `dishes`. So `:actor put :object on the menu` can arrive as
`:actor put dishes on the menu`. The noun is plain text; `:actor` is still a
link.

<a id="custom-axes"></a>

## Defining Custom Axes

An axis is a key recipe and a rule for which activities it takes:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Grouping\Axis;

Storyfeed::axes([
    Axis::make('scene')
        ->key('v:ca!:cid!:d')                      // verb + context identity + day
        ->eligibleWhenDistinct('actor', min: 2),
]);
```

`scene` groups activities in the same [context](/deeper/context), such as
three customers asking about dishes in one kitchen.

### Keys

The recipe names the fields two activities must share; `!` marks a field that
must be present. A singular token like `:context` is safe when both of its
role's fields are in the key.

| Role | Type Field | Id Field |
|---|---|---|
| `actor` | `aa` | `aid` |
| `object` | `oa` | `oid` |
| `target` | `ta` | `tid` |
| `context` | `ca` | `cid` |
| `origin` | `ora` | `orid` |
| `result` | `ra` | `rid` |
| `instrument` | `ia` | `iid` |

`v` adds the verb and `d` its calendar period, a day by default. Without `v`, a group may mix verbs, so only
a `scene.*` key applies to it.

### Priority

A new axis has the lowest priority. To outrank a built-in, say so:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::axes([$scene], before: 'repeat');
```

Then give its groups headlines with `$group->axis('scene', …)`, as in
[Registering a Group Headline](#registering-a-group-headline).

<a id="group-nodes"></a>

## Reading Group Nodes

A group arrives as one node, shaped as in the
[payload contract](/reference/payload#group-node). Which groups form may
change, so a renderer shouldn't assume a particular grouping.
