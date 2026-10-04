# Aggregation

## Introduction

Aggregation combines related activities into one feed item, so three orders
from one customer appear as one row. See
[Choosing What to Group](/cookbook/choosing-what-to-group) to decide when that
helps the reader.

<script setup>
import { scene, logOf, liveOf, everything, VERBS, group } from '../.vitepress/theme/world'
const log = logOf(scene.deeper.aggregation.orders)
const repeat = liveOf(log, { ...VERBS, place: { ...VERBS.place, repeat: ':actor made :count order placements with :target' } })[0]
const customers = logOf(scene.deeper.aggregation.customers)
const actors = liveOf(customers)[0]
const live = liveOf(everything())
const nounFallback = { ...repeat, headline_template: ':actor placed orders with :target', headline: null }
const singularFallback = { ...repeat, headline_template: ':actor placed an order with :target', headline: null }
const unnamedGroup = { ...repeat, headline_template: null, headline: null }
const menuRows = scene.deeper.aggregation.menu
const menuGroup = { ...liveOf(menuRows)[0], headline_template: ':actor put dishes on the menu' }
const contextRows = logOf(scene.deeper.aggregation.contexts)
const contextGroup = (members) => group({
  id: `scene-${members.length}`, axis: 'scene', verb: 'ask', count: members.length,
  published_at: members[0].published_at, headline_template: ':actors asked questions in :context',
  glyph: members[0].glyph, actors: members.map(m => m.actor),
  targets: [members[0].target], contexts: [members[0].context], children: members,
})
const contextActors = liveOf(contextRows, { ...VERBS, ask: { ...VERBS.ask, actors: ':actors asked about :target' } })
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
        ->actors(':actors ordered from :target'),
);
```

<FeedExample :items="[actors]" />

A `repeat` group contains one type, so its headline belongs under
`Story::for(Order::class)` and can say "orders". An `actors` group may also
contain reservations, so its headline belongs on the verb alone and must not
name a type.

Storyfeed groups activities when published. Each activity belongs to only one
group per read mode. Quotes and images belong to the activities, so use `log()`
to show each one. [Storage Architecture](/reference/storage#reading-a-page)
shows where groups are stored and how a feed retrieves them.

<a id="axes-by-read-mode"></a>

## Choosing a Read Mode

In a longer feed, repeated actions and activities at busy places appear as
rows you can expand:

<FeedExample :items="live" days height="520" />

The read mode determines which groups the query returns:

| Mode | Returns |
|---|---|
| `log()` | one item per activity, including each member of a composite |
| `live()`, `grouping.curate = true` (default) | groups selected across the available axes, with a `repeat` group when no other group is selected |
| `live()`, `grouping.curate = false` | repeat groups only, regardless of groups selected earlier |
| `summary()` | one summary item per actor per calendar day (or the period passed to `summary()`), across verbs. See [Retrieving Feeds](/basics/reading#summary) |

Set `grouping.curate` to `false` for repeat-only `live()` reads.
`storyfeed:curate` chooses groups for recent activities and runs hourly through
Laravel's scheduler.

## Grouping Axes

### Built-In Axes

Activities can share a group only when the fields in its key agree. These
are the default grouping keys; `d` uses the configured calendar period, one day by
default. An identity includes both the role's type and its ID.

| Axis | Shared Values | What May Differ | Default Grouping Key |
|---|---|---|---|
| `repeat` | actor identity, verb, object type, target identity, period | object identity | `aa:aid:v:oa:ta:tid:d` |
| `actors` | verb, target identity, period | actor and object identities, including object type | `v:ta!:tid:d` |
| `targets` | actor identity, verb, period | target and object identities, including object type | `aa!:aid:v:d` |
| `object` | actor identity, verb, object identity, period | target identity | `aa:aid:v:oa!:oid!:d` |

A `repeat` group cannot span two targets. Three edits by one person to clauses
on one document can name that document as `:target`; edits directed at a
second document get another repeat key. If the document is the **object**,
a `repeat` group requires only the same object type. Use the `object` axis to
require the same document.

Unlisted fields, including context, origin, result, instrument and activity
data, may differ on all four axes. `!` requires a nonempty field; without it,
matching empty roles can share a key. A shared key does not by itself select
a group: activities must also meet the [thresholds](#configuring-grouping-thresholds),
and Storyfeed must select the group. [Axis Keys](#axis-keys) explains the field abbreviations.

A composite is one published activity with a collection of objects. Its
members share actor, target and context; see [Composites](/deeper/composites).
The `batch` axis tracks batches internally; it is not a feed grouping choice.
Summary axes use `aa!:aid!:d` to share an actor and period across verbs;
[Summary](/basics/reading#summary) describes that separate read mode.

The allowed singular tokens depend on the identities shared by all members:

| Axis | Collapses | Singular Tokens Allowed | One Type | Example Headline |
|---|---|---|---|---|
| `repeat` | one actor repeating a verb, for one object type and target | `:actor` `:target` | yes | ":actor made :count order placements with :target" |
| `actors` | many actors, same verb and target | `:target` | no | ":actors ordered from :target" |
| `targets` | one actor across targets | `:actor` | no | ":actor asked about :targets" |
| `object` | one actor repeating one verb on one object | `:actor` `:object` | yes | ":actor changed the price of :object :count times" |
| `composite` | one published activity with a collection of objects | `:actor` `:target` `:context` | — | see [Composites](/deeper/composites#headlines-for-a-composite) |

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

Choose the declaration location from the axis's shared values. The default
[grouping period](/deeper/grouping-periods) is one day.

| Shared Values | Axis | Headline | Declared On |
|---|---|---|---|
| one actor, verb, target and object type, on one day | `repeat` | `:actor made :count order placements with :target` | the type |
| one verb and target on one day, from several actors | `actors` | `:actors ordered from :target` | the verb |
| one actor, verb and object, on one day | `object` | `:actor changed the price of :object :count times` | the type |
| one actor and verb on one day, across several targets | `targets` | `:actor asked :count questions about :targets` | the verb |

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

A plural token displays a few names and a count of the rest. See
[Rendering](/basics/rendering#groups) for details. `:count` is the number of
activities in the group.

<a id="group-headline-tokens"></a>

A singular token is allowed only when **every** activity shares that role,
as shown in **Singular Tokens Allowed** above. Plural tokens are allowed in
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
verb, and calendar period (a day by default). An activity with an empty target
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
are `null`. That is a supported payload state; it does not require a blank row.
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

### Seeing the Fallback

| Available headline | What is displayed |
|---|---|
| An authored group headline | The group sentence, including its count when the template uses `:count`. |
| A safe single-activity template | That sentence, with unshared roles replaced by nouns where possible; no count is added automatically. |
| Neither a group headline nor a safe single-activity template | Storyfeed UI displays “3 activities” for a three-member group and opens its supplied members. |

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

These previews use the docs' Vue renderer. The [Storyfeed UI](/basics/rendering)
Blade group component also uses the count fallback and opens its disclosure
when supplied children exist. Its open control says “Show less”; collapsed,
it says “Show all 3”. If the response caps the children, it reports the number
not shown. Expanding displays the supplied children; it does not fetch more.

The PHP reader's `$group->headline()` returns a `Headline` value.
`$group->headline()->isFallback()` is `true` when both payload fields are
`null`, and `toString()` returns the translated count, such as “3 activities”.
An explicitly returned empty string is not that null-field fallback. Custom
renderers choose their own treatment; see
[Groups Without Headlines](/basics/rendering#groups-without-headlines).

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
    ->actors(':actors asked about :target'));
```

Two customers sharing a context meet this axis's threshold but not the built-in
`actors` threshold, so the query returns a `scene` group:

<FeedExample :items="[contextGroup(contextRows.slice(0, 2))]" />

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

With three customers, both `actors` and `scene` qualify. The built-in `actors`
axis has priority and selects the group:

<FeedExample :items="contextActors" />

New axes have the lowest priority among selectable axes. To put `scene` before
`actors`, reuse the `$scene` defined above:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::axes([$scene], before: 'actors');
```

After group selection runs with this priority, the same activities form a
`scene` group that names their shared context:

<FeedExample :items="[contextGroup(contextRows)]" />
