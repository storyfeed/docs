# Containers & context

`context` is the fourth role: the container an activity happened **inside**.
With it recorded, a feed can be scoped to the container and an axis can group
by it.

<script setup>
import { who, where, job, note, activity } from '../.vitepress/theme/samples'

const inside = activity({
  id: 'cx1', verb: 'comment', glyph: 'message-circle',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor commented on :target in :context',
  actor: who.priya, object: note.overflow, target: job.kerningPassPricingTable,
  context: where.portMigration,
})
</script>

```php
Storyfeed::activity()
    ->by($user)
    ->action('comment', $comment)
    ->on($task)               // target: what the comment is on
    ->context($project)       // context: the project the task belongs to
    ->publish();
```

<FeedStream :items="[inside]" :grouped="false" />

## The difference between target and context

| role | holds | in the sentence |
|---|---|---|
| `target` | what the preposition points at | commented **on** the task |
| `context` | the container the act happened inside | …**in** the project |

They carry different facts when the target sits inside the container — a
comment on a task in a project, a revision to a document in a workspace. That
is the case `context` is for.

When the target is itself the container, `target` carries it, and the record
is complete:

```php
Storyfeed::activity()
    ->by($user)
    ->action('upload', $document)
    ->to($project)
    ->publish();
```

Setting `context` to the same project as well is allowed. It records the
project twice, once in each role, and matters only when something reads the
`context` role — an axis you registered, a container query, the AS2 document.

Fill each role with what is true and available. The template decides which
roles the sentence names; a role it leaves out is still there for scoping,
grouping and the AS2 document.

## When to set it

Whether an activity needs `context` is decided by what reads it, not by the
sentence:

| you want | why it needs `context` |
|---|---|
| a group like "three people commented in the same project today" | axes key on roles, so the container has to *be* a role; no built-in axis keys on `context`, so this is a [custom axis](/deeper/aggregation#custom-axes) |
| `feed()->context($project)` | the scope reads the `context` column |
| `:context` in a composite headline | the built-in `composite` axis pins `:actor`, `:target` and `:context` — see [Composites](/deeper/composites) |
| `context` on the Activity Streams 2.0 document | the serializer emits each role that is filled, and omits each that is not |

The axis is the one that cannot be had any other way:

```php
Axis::make('scene')
    ->key('v:ca!:cid!:d')                 // verb + context identity + day
    ->eligibleWhenDistinct('actor', min: 2);
```

A filter can narrow a feed to a container; only a role can group by one.

## The container query

`feed()->context($project)` returns what happened inside the project. It is
narrower than [`involving()`](/basics/reading#scoping), which also matches the
project's own creation and archival — those record the project as the
`object`.

## A container that is not a model

A folder name, a source system, a mailbox: when the room is a value rather than
an entity, it has three homes.

| home | in the headline | groups by it | in the AS2 document | cost |
|---|---|---|---|---|
| `->context('Q3 invoices')` | yes, as `:context` | yes | yes, as a [party](/deeper/parties) | one party per distinct string |
| `->data(['folder' => $name])` | no — templates read roles, not `data` | no | no | the value arrives in the node for your renderer to show beneath |
| a closure in the grammar | yes, pre-rendered | no | no | `headline_template` is null; the renderer gets a string it cannot tokenize or link |

## Roles are set at publish, and never backfilled

Roles are [never backfilled](/basics/recording#roles): a `context` axis
registered later groups only the activities that were recorded with a
`context`. If the room is a model you have at publish time, record it.
