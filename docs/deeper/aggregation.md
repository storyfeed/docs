# Aggregation

Aggregation shows several related activities as one row: three orders from
one customer read as one line, not three. A Story's `groups()` says which
activities group together and what the row says.

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
  published_at: at, headline_template: ':actors placed :count orders with :target',
  actors: [who.regular, who.customer2, who.customer3], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 5, objects: 5, targets: 1 } })
</script>

## Grouping Repeats

Three orders from one customer, minutes apart, as a log:

<FeedExample context :items="log" />

The same three, grouped by the story's `groups()`:

```php
<?php

namespace App\Stories;

use App\Models\Order;
use BackedEnum;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Grouping\Group; // [!code focus]
use Storyfeed\Story;

class OrderWasPlaced extends Story
{
    public string|array|null $objectType = Order::class;

    public string|FeedVerb|BackedEnum|null $verb = 'place';

    public function headline(): string
    {
        return ':actor placed :object with :target';
    }

    public function groups(): array // [!code focus]
    { // [!code focus]
        return [ // [!code focus]
            Group::repeat()->headline(':actor placed :count orders with :target'), // [!code focus]
        ]; // [!code focus]
    } // [!code focus]
}
```

<FeedExample :items="[repeat]" />

## Grouping Along Another Axis

Five customers ordering from the same kitchen need a different sentence. Each
`Group` names an **axis**: what its members have in common.

```php
// app/Stories/OrderWasPlaced.php
public function groups(): array
{
    return [
        Group::byActors()->headline(':actors placed :count orders with :target'), // [!code focus]
        Group::repeat()->headline(':actor placed :count orders with :target'),
    ];
}
```

<FeedExample :items="[actors]" />

In each read mode, an activity belongs to exactly one axis. Grouping is decided
when the activity is published, not when the feed is read.

## Which Axes Each Mode Reads

The read mode does not change how activities were grouped. It changes which
groupings the read shows.

| Mode | Reads |
|---|---|
| `log()` | no axis at all — one node per activity, and a composite's members appear as ordinary rows |
| `live()` | `repeat`, plus authored composites |
| `summary()` | the winning axis on any bucket, falling back to `repeat` where nothing has been stamped a winner |

A headline written for an axis that none of your reads use never renders.
`storyfeed:doctor` reports it as `aggregates.latent`.

Until `storyfeed:curate` has run, `summary()` groups only by `repeat`, because
no bucket has a winner yet.

## The Built-in Axes

| Axis | Collapses | Pins (Safe Singular Tokens) | Example Headline |
|---|---|---|---|
| `repeat` | one actor repeating a verb | `:actor` `:target` | ":actor placed :count orders with :target" |
| `actors` | many actors, same verb and target | `:target` | ":actors placed :count orders with :target" |
| `targets` | one actor across targets | `:actor` | ":actor asked about :targets" |
| `object` | many actions on one object | `:actor` `:object` | ":actor changed the price of :object :count times" |
| `composite` | an authored collection story | `:actor` `:target` `:context` | see [Composites](/deeper/composites) |

A singular token is safe only where the axis pins that role; a plural token is
safe everywhere. `Group::on('scene')` names a custom axis, and `Group::any()`
matches whichever axis wins.

## Thresholds

```php
// config/storyfeed.php
'grouping' => [
    'policy' => [
        'min_actors' => 3,          // actors axis needs 3+ distinct actors
        'min_targets' => 2,
        'min_target_members' => 3,
        'min_object_members' => 2,
    ],
],
```

Below a threshold, activities stay ungrouped. Thresholds apply at publish time,
so changing one does not regroup existing activities; `storyfeed:curate`
re-applies them to history and bumps the `sync_token`.

`repeat` keys on the target, so orders placed with different kitchens do not
group under it; `targets` is the axis for that. A role the key leaves free may
be empty on some members, which a plural token
[handles](/deeper/grammar#members-that-did-not-fill-a-role).

## Custom Axes

An axis is a key recipe and an eligibility rule:

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Grouping\Axis;

Storyfeed::axes([
    Axis::make('scene')
        ->key('v:ca!:cid!:d')                      // verb + context identity + day
        ->eligibleWhenDistinct('actor', min: 2),
]);
```

The recipe names the fields two activities must share to group; `!` marks a
field that must be present. A singular role token is safe when both of the
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

`v` adds the verb and `d` adds the day. Without `v`, a group may span verbs,
so only a verb-agnostic grammar key (`scene.*`) applies to it.

A new axis registers at the lowest priority. To outrank a built-in, say so:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::axes([$scene], before: 'repeat');
```

Then author `scene.{verb}` templates in the [grammar](/deeper/grammar).

## Group Nodes

A group arrives as one node, shaped as in the
[payload contract](/reference/payload#group-node). The shape is fixed; which
groups form is server policy, so a renderer never assumes a particular
grouping. Within a read mode every activity appears in exactly one node,
grouped or not, which is what the
[reconciliation rule](/basics/rendering#feeds-that-keep-moving) relies on.
