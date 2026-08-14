# Containers & context

`context` is the fourth role: the container an activity happened **inside** — a
project, a workspace, a tenant.

```php
Storyfeed::activity()
    ->actor($user)
    ->verb('upload', $document)
    ->to($project)          // target: what the act was directed at
    ->context($workspace)   // context: where it happened
    ->publish();
```

Most applications can ignore it. Set it when you want one of the three things
below.

## What it buys you

**1. Grouping by place.** Axes key on specific roles, so a container has to *be*
a role for "several people working in the same place today" to be expressible:

```php
Axis::make('scene')
    ->key('v:ca!:cid!:d')                 // verb + context identity + day
    ->eligibleWhenDistinct('actor', min: 2);
```

That axis is why context can't be replaced by a filter — see
[Aggregation](/deeper/aggregation#custom-axes). The built-in `composite` axis
also pins `:context`.

**2. A container query.** `feed()->context($project)` returns only what happened
inside the project — narrower than
[`involving()`](/basics/reading#scoping), which also matches the project's own
creation and archival.

**3. Activity Streams 2.0 fidelity.** `context` is a property AS2 defines, and
the serializer emits it. The role exists so the package can say what the spec
can say.

## Target or context?

They answer different questions and often coexist:

| | question | example |
|---|---|---|
| `target` | what was the act directed at? | commented **on** the task |
| `context` | where did it happen? | …**in** the Mobile App project |

A comment on a document has the document as target and the project as context.
Reaching for `target` to mean containment is the historical mistake this role
exists to prevent: when the container is indistinguishable from the indirect
object, the only way to find "activity in this project" later is a scan across
every role.

## Roles are set at publish, and never backfilled

`storyfeed:rebuild` rebuilds snapshots; `storyfeed:curate` re-selects axes.
Neither can populate a role that was never recorded, so adding context later
means rewriting rows — and because grouping keys include it, historical
activities keep the grouping they were given.

Set it when there is a plausible container, even before you have a view that
scopes by one.
