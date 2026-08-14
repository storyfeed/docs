# Aggregation

Activities group along **axes** — each axis collapses one dimension:

| axis | collapses | pins (safe singular tokens) | example headline |
|---|---|---|---|
| `repeat` | one actor repeating a verb | `:actor` `:target` | ":actor uploaded :count files to :target" |
| `actors` | many actors, same verb + target | `:target` | ":actors uploaded :count files to :target" |
| `targets` | one actor across targets | `:actor` | ":actor commented in :targets" |
| `object` | many actions on one object | `:actor` `:object` | ":actor made :count revisions to :object" |
| `composite` | an authored collection story | `:actor` `:target` `:context` | see [Composites](/deeper/composites) |

Each activity ends up in exactly one axis per read mode. The read path never
groups — grouping cannot be varied per request.

A Story opts into axes via `groups()`:

```php
public function groups(): array
{
    return [
        Group::byActors()->headline(':actors uploaded :count files to :target'),
        Group::repeat()->headline(':actor uploaded :count files to :target'),
    ];
}
```

`Group::on('scene')` targets a custom axis; `Group::any()` matches whichever
axis wins.

## Group nodes

An aggregate arrives as one **group node** — see the
[payload contract](/reference/payload#group-node) for the exact shape. The
node's shape is frozen contract; **which** groups form (axes, thresholds,
windows) is server-side policy, explicitly free to evolve. Renderers must not
assume any particular grouping behaviour.

## Thresholds

```php
'grouping' => [
    'policy' => [
        'min_actors' => 3,          // actors axis needs 3+ distinct actors
        'min_targets' => 2,
        'min_target_members' => 3,
        'min_object_members' => 2,
    ],
],
```

Below threshold, activities stay atomic. Disable grouping entirely with
`NullStrategy`.

Thresholds apply at publish time, so changing them is **not retroactive** —
existing activities keep the grouping they were given. Run `storyfeed:curate` to
re-apply, which rewrites settled history and bumps the `sync_token`.

## Custom axes

An axis is a key recipe plus eligibility — no package edits required:

```php
use Storyfeed\Grouping\Axis;

Storyfeed::axes([
    Axis::make('scene')
        ->key('v:ca!:cid!:d')                      // verb + context identity + day
        ->eligibleWhenDistinct('actor', min: 2),
]);
```

Recipe fields name the dimensions that must match for two activities to share
a group; `!` marks fields whose absence disqualifies. Token safety is derived
from the recipe — a singular role token is allowed exactly when the role's
identity is part of the key.

::: warning Priority
A new axis registers at the **lowest** priority. If it should outrank a
built-in, say so explicitly:

```php
Storyfeed::axes([$scene], before: 'repeat');
```
:::

Then author `scene.{verb}` templates in the aggregate grammar, and run
`storyfeed:doctor` — coverage audits include every registered axis.

## One story per fact, per mode

Within any read mode, every activity appears in exactly one node — atomic or
grouped, never both. This is what makes the member-identity
[reconciliation rule](/basics/rendering#reconciling-updates) sound.
