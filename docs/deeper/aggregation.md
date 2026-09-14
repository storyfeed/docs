# Aggregation

Several activities that belong together read as one line. Aggregation is how
the feed decides which activities belong together, and a Story says what the
one line reads as. When you are done, bursts of activity arrive as group nodes
with headlines you authored.

<script setup>
import { who, where, doc, activity, group } from '../.vitepress/theme/samples'

const at = '2026-08-14T14:30:00.000000Z'
const upload = (id, actor, object) => activity({ id, verb: 'upload', glyph: 'file-up',
  published_at: at, headline_template: ':actor uploaded :object to :target',
  actor, object, target: where.main })

const log = [
  upload('ag1', who.designer, doc.pricing),
  upload('ag2', who.designer, doc.signage),
  upload('ag3', who.designer, doc.report),
]

const repeat = group({ id: 'ag4', verb: 'upload', axis: 'repeat', count: 3, glyph: 'file-up',
  published_at: at, headline_template: ':actor uploaded :count files to :target',
  actors: [who.designer], targets: [where.main],
  objects: [doc.pricing, doc.signage, doc.report],
  distinct: { actors: 1, objects: 3, targets: 1 } })

const actors = group({ id: 'ag5', verb: 'upload', axis: 'actors', count: 5, glyph: 'file-up',
  published_at: at, headline_template: ':actors uploaded :count files to :target',
  actors: [who.designer, who.lead, who.reviewer], targets: [where.main],
  objects: [doc.pricing, doc.signage, doc.report],
  distinct: { actors: 5, objects: 5, targets: 1 } })
</script>

## Grouping Repeats

Three uploads by one person, minutes apart, as a log:

<FeedStream :items="log" :grouped="false" />

A Story's `groups()` says how they read as one:

```php
<?php

namespace App\Stories;

use App\Models\Document;
use Storyfeed\Grouping\Group; // [!code focus]
use Storyfeed\Story;

class DocumentWasUploaded extends Story
{
    public string|array|null $objectType = Document::class;

    public string|FeedVerb|BackedEnum|null $verb = 'upload';

    public function headline(): string
    {
        return ':actor uploaded :object to :target';
    }

    public function groups(): array // [!code focus]
    { // [!code focus]
        return [ // [!code focus]
            Group::repeat()->headline(':actor uploaded :count files to :target'), // [!code focus]
        ]; // [!code focus]
    } // [!code focus]
}
```

<FeedStream :items="[repeat]" :grouped="false" />

## Grouping Along Another Axis

Five people uploading to the same project is a different shape, and a
different sentence. Each `Group` names an **axis**, the dimension it collapses:

```php
public function groups(): array
{
    return [
        Group::byActors()->headline(':actors uploaded :count files to :target'), // [!code focus]
        Group::repeat()->headline(':actor uploaded :count files to :target'),
    ];
}
```

<FeedStream :items="[actors]" :grouped="false" />

Each activity lands in exactly one axis per read mode. Grouping is decided
when the activity is published, never per request.

## The Built-in Axes

| Axis | Collapses | Pins (Safe Singular Tokens) | Example Headline |
|---|---|---|---|
| `repeat` | one actor repeating a verb | `:actor` `:target` | ":actor uploaded :count files to :target" |
| `actors` | many actors, same verb and target | `:target` | ":actors uploaded :count files to :target" |
| `targets` | one actor across targets | `:actor` | ":actor commented in :targets" |
| `object` | many actions on one object | `:actor` `:object` | ":actor made :count revisions to :object" |
| `composite` | an authored collection story | `:actor` `:target` `:context` | see [Composites](/deeper/composites) |

A singular token is safe on an axis only where the axis pins that role; the
plural token is safe everywhere. `Group::on('scene')` targets a custom axis,
and `Group::any()` matches whichever axis wins.

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

Below threshold, activities stay atomic. Thresholds apply at publish time, so
a change is not retroactive; `storyfeed:curate` re-applies it, rewriting
settled history and bumping the `sync_token`.

If uploads to different targets do not group under `repeat`, that is the axis
working: `repeat` keys on the target, and `targets` is the axis that leaves it
free. A role a key leaves free may also be absent on some members, which is
what a plural token [does and does not promise](/deeper/grammar#members-that-did-not-fill-a-role).

## Custom Axes

An axis is a key recipe plus an eligibility rule:

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Grouping\Axis;

Storyfeed::axes([
    Axis::make('scene')
        ->key('v:ca!:cid!:d')                      // verb + context identity + day
        ->eligibleWhenDistinct('actor', min: 2),
]);
```

Recipe fields name the dimensions two activities must share to group; `!`
marks a field whose absence disqualifies. A singular role token is safe
exactly when both of the role's fields are in the key.

| Role | Type Field | Id Field |
|---|---|---|
| `actor` | `aa` | `aid` |
| `object` | `oa` | `oid` |
| `target` | `ta` | `tid` |
| `context` | `ca` | `cid` |
| `origin` | `ora` | `orid` |
| `result` | `ra` | `rid` |
| `instrument` | `ia` | `iid` |

`v` adds the verb and `d` adds the day. Aggregate grammar is keyed
`axis.verb`, so leaving `v` out opts the axis out of per-verb grammar: its
groups may span verbs, and only a verb-agnostic key (`scene.*`) can be true of
one.

A new axis registers at the lowest priority. To outrank a built-in, say so:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::axes([$scene], before: 'repeat');
```

Then author `scene.{verb}` templates in the [grammar](/deeper/grammar).

## Group Nodes

A group arrives as one node whose shape is in the
[payload contract](/reference/payload#group-node). The shape is frozen;
which groups form (axes, thresholds, windows) is server-side policy and free
to evolve, so a renderer never assumes a particular grouping. Within any read
mode every activity appears in exactly one node, atomic or grouped, never
both, which is what makes the member-identity
[reconciliation rule](/basics/rendering#reconciling-updates) sound.
