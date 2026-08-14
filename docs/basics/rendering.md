# Rendering

Every payload item is self-describing — headline template, icon, and fully
described entities — so a renderer holds zero domain knowledge. Adding a new
activity type never requires a frontend change.

The [quickstart](/guide/quickstart#_5-render-it) has the complete Blade
reference loop. This page covers the rules it encodes.

## Headline templates

`headline_template` is the primary path: tokenize and substitute linked entity
labels.

| token | on | substitutes |
|---|---|---|
| `:actor` `:object` `:target` `:context` | activity nodes; group nodes where the axis pins the role | one linked label |
| `:actors` `:objects` `:targets` `:contexts` | any group node | the exemplar list |
| `:count` | group nodes | total member count |
| `:others` | group nodes | actor overflow ("3 others") |

For plural tokens, render the exemplars joined, with overflow from the
`distinct` block when `distinct[role]` exceeds the exemplars shown
("…and N more").

`headline` (pre-rendered string) is the fallback for grammar authored as PHP
closures. When `headline_template` is non-null, `headline` is null **by
design** — support both, template wins.

## Degraded entities

An entity with no snapshot yet arrives with `label: null`, `url: null` — render
a neutral placeholder. A null **actor** means anonymous: supply your own label
(conventionally "Someone"). Activities are never withheld because an entity is
degraded.

## Null-headline groups

A group with no aggregate grammar and no safe fallback arrives with **both**
`headline_template` and `headline` null. The null is information — "this group
cannot be honestly summarized" — not a gap.

Render an avatar stack plus a bare localized count ("{count} activities"), and
consider opening the group expanded: a group that can't be named is exactly the
group whose members should be visible.

::: danger AUDIT YOUR LAST-RESORT BRANCH
A friendly fallback that composes `<actor> <verb> <object>` from the node's
entities was written for singletons — applied to a group it announces one actor
over a many-actor group. For `kind: "group"`, degrade to the count treatment,
never to entity-composed prose. This exact bug shipped in the package's own
showcase app before it was caught.
:::

## Group children

`children` nests member activity nodes, newest first, capped by
`grouping.children_limit`. `count` is always the true total;
`children_truncated: true` tells you the list is capped. Counts in the
`distinct` block cover **all** members, not just nested ones.

## Reconciling updates

If your client accumulates pages (infinite scroll), three rules keep it
consistent as groups re-form:

1. **Window rule** — a fresh head page supersedes accumulated nodes it
   overlaps.
2. **Member identity** — drop any accumulated node whose children a fresh node
   has claimed; the old node identity is stale even if it is below the head
   page.
3. **Sync token** — when the envelope's `sync_token` changes, drop everything
   and refetch. Equality compare only.
