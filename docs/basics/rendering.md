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
| `:actor` `:object` `:target` `:context` `:origin` `:result` `:instrument` | activity nodes | one linked label | `node[role]` |
| `:actor` `:object` `:target` `:context` `:origin` `:result` `:instrument` | group nodes, where the emitted template names the role | one linked label | `node[role]`, or its exemplar **only when `node.distinct[role+'s']` is 1** |
| `:actors` `:objects` `:targets` `:contexts` `:origins` `:results` `:instruments` | any group node | the exemplar list | `node.exemplars[role]` |
| `:count` | group nodes | total member count | `node.count` |
| `:others` | group nodes | actor overflow ("3 others") | `node.distinct.actors - node.exemplars.actors.length` |

Group nodes carry singular role keys under the [payload contract's pinning and
count rule](/reference/payload#group-node). A group supplies `node[role]` only
where the axis pins that role — one exemplar, one distinct value. Everywhere
else the key is absent **on purpose**, because a role the axis did not pin has
no single answer to give.

So the fallback has a condition, and the condition is the whole point:

> Recover a singular from `node.exemplars[role+'s'][0]` **only when
> `node.distinct[role+'s']` is `1`.** Otherwise render nothing for that token.

`distinct` is the true total from the aggregate query, not the length of the
list you were handed, so a one-item exemplar list is not on its own proof that
the group has one.

**There is a better answer than rendering nothing, and our Filament adapter uses
it: degrade the singular to the list.** A plural list is legal on every axis — a
list of length one is still true — and it self-overflows from `distinct` at any
size. So a template that says `:actor` over a group of nine renders "Ann, Sally
and 7 more": the sentence is already an aggregate, the word count barely changes,
and nobody is misled. A missing word in the middle of a sentence is worse than a
list, which is why an adapter that can reach the list should prefer it. An unconditional `?? exemplars[0]` reads correctly on every
group that happens to be uniform and then, on the first group with three, names
one of them and hides the other two — a renderer that quietly invents a fact the
payload deliberately declined to state. If a template names a role its axis does
not pin, that is a grammar defect the [`roles` doctor
check](/reference/doctor) is there to catch, not something the renderer should
paper over.


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

For a named system actor use a [party](/deeper/parties#parties); for a genuinely
absent actor use [actorless voice](/deeper/parties#actorless-voice) to omit the
actor slot.

## Timestamps

For Filament timestamps, [display timezone and formatting](/cookbook/fresh-consumer#display-timezone)
cover `FeedRendering::timezone()`, `storyfeed-filament.timezone`, and their
resolution order.

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
