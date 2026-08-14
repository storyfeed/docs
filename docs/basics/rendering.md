# Rendering

Every payload item is self-describing — headline template, icon, and fully
described entities — so a renderer holds zero domain knowledge. Adding a new
activity type never requires a frontend change.

The [quickstart](/guide/quickstart#_5-render-it) has the complete Blade
reference loop. This page covers the rules it encodes.

## Headline templates

`headline_template` is the primary path: tokenize and substitute linked entity
labels.

| token | on | substitutes | read from |
|---|---|---|---|
| `:actor` `:object` `:target` `:context` | activity nodes | one linked label | `node[role]` |
| `:actor` `:object` `:target` `:context` | group nodes, where the axis pins the role | one linked label | `node.exemplars[role+'s'][0]` |
| `:actors` `:objects` `:targets` `:contexts` | any group node | the exemplar list | `node.exemplars[role]` |
| `:count` | group nodes | total member count | `node.count` |
| `:others` | group nodes | actor overflow ("3 others") | `node.distinct.actors - node.exemplars.actors.length` |

::: danger Singular tokens come from `exemplars` on a group
A group node has **no** `actor`/`object`/`target`/`context` keys — a pinned role
arrives as an exemplar list of exactly one. Read the role key directly and your
fallback ("Someone") renders over a group whose actor is known, silently.

`repeat` pins `:actor` and `:target`; `actors` pins `:target`; `targets` pins
`:actor`; `composite` pins three. Four of five axes pin a role, so this is the
common path.
:::

Plural tokens render the exemplars joined, plus the overflow. Exemplars are
capped at **three** per role, so the overflow is `distinct[role]` minus the
number shown — the same arithmetic for `:others` and for every plural token's
"and N more", so compute it once.

`:others` cannot vanish when overflow is zero: a three-actor group renders "and
0 others". A plural token carrying its own overflow (`:actors` → "Ann, Sally,
Bob and 7 more") reads correctly at every group size.

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

For `kind: "group"`, degrade to that count treatment rather than to prose
composed from the node's entities — a last-resort branch written for singletons
names one actor over a many-actor group.

## Group children

`children` nests member activity nodes, newest first, capped by
`grouping.children_limit`. `count` is always the true total;
`children_truncated: true` tells you the list is capped. Counts in the
`distinct` block cover **all** members, not just nested ones.

## Reconciling updates

A static render needs none of this; a feed that polls or accumulates pages does.

Groups are not stable rows. As activity arrives, a `repeat` group
of 4 becomes a group of 5 with a **new node id**, or converts to a `composite`
entirely. A client that accumulates pages and merges a fresh head page will show
the same activities twice — once inside the stale node, once inside the new one.

Three rules, in the order you should apply them:

**1. Window rule.** A fresh head page supersedes accumulated nodes whose
`published_at` falls inside the range it covers. Handles the common case:
regrouping near the head, where the reader is looking.

**2. Member identity.** Drop any accumulated node whose children a fresh node
has claimed. A node whose members now belong to a different node is stale
regardless of its timestamp — this is what the window rule misses when a group
is rewritten *below* the head page (scheduled work like `close-batches` minting
a composite from an hour-old burst).

Both rules are **head-page rules**. Neither can see a rewrite that happens
entirely outside the pages the client is holding — which is what the third rule
is for.

**3. Sync token.** When the envelope's `sync_token` changes, settled history was
rewritten server-side: drop **all** accumulated nodes and refetch from the head.
Equality compare only; `null → non-null` counts as a change.

The token is a resync trigger, not a repair rule: cursors and node ids are
opaque, so a client cannot compute what changed. Backfills (`storyfeed:bundle`,
`storyfeed:curate`) are what trip it.

Rule 2 has one limit: `children` is capped by `grouping.children_limit`, so a
claimed-children check is a strong signal rather than a total one.

All three rules are implemented in [A live renderer](/basics/live-renderer).

## Verifying your renderer

One check catches the whole class of token bugs: **render every node your feed
produces and count the fallback strings.**

```
fallback leaks ("Someone"/"Something"): 0
```

A leak means a token resolved to nothing. A headline containing "Someone" reads
perfectly well, so the failure looks like an anonymous feed rather than a bug.
Run it across every read mode and every registered axis; degraded
(un-snapshotted) entities are the exception — they *should* render your
placeholder.
