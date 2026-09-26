# Aggregation

## Introduction

Aggregation shows several related activities as one row: three orders from
one customer read as one line, not three.

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

Three orders from one customer, minutes apart, as a log:

<FeedExample :items="log" />

The same three, grouped by the verb's `grouped()`:

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

A `repeat` group holds one type, so its headline goes under
`Story::for(Order::class)` and can say "orders". An `actors` group can hold
several types, since other customers may be placing reservations, so its
headline goes on the verb alone and names no type.

Grouping is decided when the activity is published. In each read mode, an
activity is in only one group. A group carries no quote or image of its own;
those stay on its activities, and `log()` shows each one.

<a id="axes-by-read-mode"></a>

## Choosing a Read Mode

A longer feed makes the difference visible: repeated actions and busy places
fold into rows that expand to show their members.

<FeedExample :items="live" days height="520" />

The read mode chooses which groupings a read shows:

| Mode | Reads |
|---|---|
| `log()` | no axis at all — one node per activity, and a composite's members appear as ordinary rows |
| `live()` | one grouping per activity, chosen from the axes that fit it, falling back to `repeat`. The default |
| `summary()` | `summary`: one row per actor per calendar day (or the period passed to `summary()`), across verbs. See [Reading Feeds](/basics/reading#summary) |

With `grouping.curate` set to `false`, `live()` shows repeats only.
`storyfeed:curate` regroups recent activity, and runs hourly when Laravel's
scheduler runs.

## Grouping Axes

### Built-In Axes

| Axis | Collapses | Singular Tokens Allowed | One Type | Example Headline |
|---|---|---|---|---|
| `repeat` | one actor repeating a verb | `:actor` `:target` | yes | ":actor placed :count orders with :target" |
| `actors` | many actors, same verb and target | `:target` | no | ":actors ordered from :target" |
| `targets` | one actor across targets | `:actor` | no | ":actor asked about :targets" |
| `object` | many actions on one object | `:actor` `:object` | yes | ":actor changed the price of :object :count times" |
| `composite` | an authored collection story | `:actor` `:target` `:context` | — | see [Composites](/deeper/composites#headlines-for-a-composite) |

A headline for a **One Type** axis can go in a Story class or inside
`Story::for()`. The others go on the verb alone.

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

Below a threshold, that axis cannot win; activities fall back to `repeat`
when no other axis wins. Activities already published keep their groups until
you [rehash them](/reference/commands#rehashing-existing-rows).

See [Grouping Periods](/deeper/grouping-periods) to choose the calendar
boundary shared by grouped activities.

<a id="registering-a-group-headline"></a>

## Defining Group Headlines

`grouped()` takes one headline per axis, as in the
[repeat](#grouping-repeats) and [actors](#grouping-along-another-axis) examples
above. Where it's declared decides which groups use it.

### Definition Scope

| Written In | Key | Used For |
|---|---|---|
| `Story::for(Order::class)->verb('place')`, or a Story class's `place()` | `repeat.order.place` | groups of orders |
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
it. A singular token is allowed only where every member shares it (the
**Singular Tokens Allowed** column above); a plural token is allowed everywhere.

```php
// a repeat group: one customer, many dishes
:actor changed the price of :object :count times' // ✗ which dish? fails when stories compile
':actor changed :count prices'                     // ✓
':actor changed :count prices on :targets'         // ✓ lists fit every member
```

<a id="plural-lists-in-headlines"></a>

Both of these are token-safe; only one is readable:

```php
// an actors group: every member shares :target
':actors placed :objects with :targets' // ✗ three lists of names
':actors ordered from :target'          // ✓ one list, one shared role
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
checks that.

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

Supply both forms; Storyfeed never inflects. Locales with more plural forms
can add pipe segments, and [Localization](/deeper/localization#translating-a-noun)
covers translated nouns. Without a noun, the fallback is `item|items`.

The number of entities picks the form: `FeedNoun::form('dish|dishes', 7)`
returns `dishes`. So `:actor put :object on the menu` can arrive as
`:actor put dishes on the menu`. The noun is plain text; `:actor` is still a
link.

<a id="custom-axes"></a>

## Defining Custom Axes

An axis names what its activities share and how many it needs before it
groups them:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Grouping\Axis;

Storyfeed::axes([
    Axis::make('scene')
        ->key('v:ca!:cid!:d')                      // same verb, same context, same day
        ->eligibleWhenDistinct('actor', min: 2),
]);
```

`scene` groups activities in the same [context](/deeper/context), such as
three customers asking about dishes in one shop. Inside `grouped()`,
`$group->axis('scene', …)` gives a custom axis its headline, and
`$group->any(…)` matches whichever axis groups the activity.

<a id="keys"></a>

### Axis Keys

The key lists, separated by `:`, the fields two activities must share. `!`
after a field means an activity without it never joins the axis.

| Role | Type Field | Id Field |
|---|---|---|
| `actor` | `aa` | `aid` |
| `object` | `oa` | `oid` |
| `target` | `ta` | `tid` |
| `context` | `ca` | `cid` |
| `origin` | `ora` | `orid` |
| `result` | `ra` | `rid` |
| `instrument` | `ia` | `iid` |

`v` adds the verb, and `d` the calendar period, a day by default. A singular
token such as `:context` is allowed in the axis's headlines when both of its
role's fields are in the key. Without `v`, a group may mix verbs, so its
headline goes on a verb-agnostic key (`scene.*` or `*.*`).

<a id="priority"></a>

### Prioritizing Axes

A new axis has the lowest priority. To outrank a built-in, say so:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::axes([$scene], before: 'repeat');
```
