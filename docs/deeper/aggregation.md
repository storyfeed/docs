# Aggregation

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
`Group` names an **axis**: what its activities have in common.

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

Grouping is decided when the activity is published. In each read mode, an
activity is in only one group.

## Which Axes Each Mode Reads

The read mode chooses which groupings a read shows:

| Mode | Reads |
|---|---|
| `log()` | no axis at all — one node per activity, and a composite's members appear as ordinary rows |
| `live()` | `repeat`, plus authored composites |
| `summary()` | the winning axis on any bucket, falling back to `repeat` where nothing has been stamped a winner |

Until `storyfeed:curate` has run, `summary()` groups only by `repeat`. The
package schedules it hourly.

## The Built-in Axes

| Axis | Collapses | Pins (Safe Singular Tokens) | Example Headline |
|---|---|---|---|
| `repeat` | one actor repeating a verb | `:actor` `:target` | ":actor placed :count orders with :target" |
| `actors` | many actors, same verb and target | `:target` | ":actors placed :count orders with :target" |
| `targets` | one actor across targets | `:actor` | ":actor asked about :targets" |
| `object` | many actions on one object | `:actor` `:object` | ":actor changed the price of :object :count times" |
| `composite` | an authored collection story | `:actor` `:target` `:context` | see [Composites](/deeper/composites) |

Use a singular token like `:target` only where the axis pins that role, so
every activity in the group shares it. A plural token works everywhere.
`Group::on('scene')` names a custom axis, and `Group::any()` matches whichever
axis wins.

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

Below a threshold, activities stay ungrouped. Changing a threshold doesn't
regroup past activities until `storyfeed:curate` runs.

`repeat` groups only orders placed with the same kitchen; `targets` groups
across kitchens.

## Custom Axes

An axis is a key recipe and a rule for which activities it takes:

```php
// app/Providers/AppServiceProvider.php, boot()
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

`v` adds the verb and `d` the day. Without `v`, a group may mix verbs, so only
a `scene.*` grammar key applies to it.

A new axis has the lowest priority. To outrank a built-in, say so:

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;

Storyfeed::axes([$scene], before: 'repeat');
```

Then author `scene.{verb}` templates in the [grammar](/deeper/grammar).

## Group Nodes

A group arrives as one node, shaped as in the
[payload contract](/reference/payload#group-node). Which groups form may
change, so a renderer shouldn't assume a particular grouping.
