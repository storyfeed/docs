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

::: danger SINGULAR TOKENS COME FROM `exemplars` ON A GROUP
A group node has **no** `actor`/`object`/`target`/`context` keys. A pinned role
arrives as an exemplar list of exactly one, by construction. Reading the role
key directly on a group yields null, so your fallback ("Someone", "Something")
renders over a group whose actor is perfectly well known — a lie in the
opposite direction from the one the server prevents, and silent.

Most group headlines use at least one pinned token (`repeat` pins `:actor` and
`:target`; `actors` pins `:target`; `targets` pins `:actor`; `composite` pins
three), so this is the common path.
:::

For plural tokens, render the exemplars joined, with overflow from the
`distinct` block when `distinct[role]` exceeds the exemplars shown
("…and N more").

::: warning OVERFLOW IS `distinct − exemplars shown`, NEVER `distinct − 1`
Exemplars are capped at **three** per role. With 10 distinct actors and 3 named,
the overflow is 7 — subtracting 1 gives "Ann, Sally, Bob and 9 others", which
implies 12 people where 10 exist. The contract's own example is a 200-actor
group reporting **197**: 200 minus three named, not minus one.

This applies to `:others` and to every plural token's "and N more" suffix — they
are the same arithmetic, so compute it once.
:::

::: tip PREFER SELF-OVERFLOWING PLURALS
`:others` exists for `":actors and :others uploaded…"`-style templates, but it
cannot vanish when overflow is zero — a three-actor group renders "and 0
others". The forward style is a plural token that carries its own overflow
(`:actors` → "Ann, Sally, Bob and 7 more"), which reads correctly at every
group size.
:::

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

A static render needs none of this. **A feed that polls or streams does**, and
it is the hardest part of building a live renderer.

The problem: groups are not stable rows. As activity arrives, a `repeat` group
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

::: tip
The token is a resync *trigger*, not a reconciliation rule — it discards
everything rather than repairing individual nodes. That is deliberate: cursors
and node ids are opaque, so a client cannot compute what changed. Backfills
(`storyfeed:bundle`, `storyfeed:curate`) are the operations that trip it, which
is why you run them when readers are not mid-scroll.
:::

Note also that `children_truncated` means a group's `children` list is capped by
`grouping.children_limit` — do not treat a claimed-children check as complete
when the list is truncated.
