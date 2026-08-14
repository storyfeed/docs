# Anatomy of an activity stream

This page defines every word the rest of the documentation uses, in plain
English, by following **five real activities** from raw rows to a rendered
sentence. No API — the terms only.

## 1. One activity

Two people upload five files to one project over a few minutes. Recorded, that is
five rows — and every section below is about turning them into something a person
wants to read:

| # | who | did what | to what | where |
|---|---|---|---|---|
| 1 | Ines | uploaded | annual-report-v3.fig | Password Crackdown |
| 2 | Ines | uploaded | hero-mobile.png | Password Crackdown |
| 3 | Ines | uploaded | colour-tokens.docx | Password Crackdown |
| 4 | Marcus | uploaded | proof-sheet.fig | Password Crackdown |
| 5 | Marcus | uploaded | wordmark-v3.png | Password Crackdown |

Take row 1. An **activity** is one recorded fact, shaped like a sentence with
named slots:

> **Ines** *(actor)* **uploaded** *(verb)* **annual-report-v3.fig** *(object)*
> **to Password Crackdown** *(target)*

Four **roles**. Any of them can be empty:

| role | the question it answers |
|---|---|
| **actor** | who did it |
| **object** | what it was done to |
| **target** | what the act was directed at |
| **context** | the container it happened inside |

### The difference between target and context

Target is what the act was aimed at. Context is where it happened.

A comment on a document has the **document** as its target and the **project** as
its context. Both are true of the same activity, and they answer different
questions later: "what happened to this document" reads the target, "what happened
in this project" reads the context.

Which roles you record decides which questions your feed can answer. Recording
"project created" with the project as the **object** and no context means a
context-scoped project page will not include it — the activity is about the
project, but it did not happen inside it.

### Anonymous actors and parties

An empty actor means the actor is **unknown**; a renderer prints "Someone". A
named participant that has no model in your app — Stripe, a nightly job — is a
**party**: a real name and a real entity, just not one of your tables.

## 2. Why the raw list stops working

Five rows is fine. Five hundred is not. A feed that lists every row reads like a
log file, and the reader's own actions dominate it:

> Ines uploaded annual-report-v3.fig to Password Crackdown
> Ines uploaded hero-mobile.png to Password Crackdown
> Ines uploaded colour-tokens.docx to Password Crackdown
> Marcus uploaded proof-sheet.fig to Password Crackdown
> Marcus uploaded wordmark-v3.png to Password Crackdown

What a person wants is one line:

> Ines and Marcus uploaded 5 files to Password Crackdown

Producing that line is **aggregation**: collapsing several activities into one
telling.

## 3. An axis is the question you group by

An **axis** is a rule for deciding which activities count as *the same story*.
Each axis asks a different question of those five rows:

| axis | its question | what our five rows become |
|---|---|---|
| **repeat** | same person, doing the same thing again? | "Ines uploaded 3 files to Password Crackdown" |
| **actors** | different people, same thing, same place? | "Ines and Marcus uploaded 5 files to Password Crackdown" |
| **targets** | same person, same thing, different places? | doesn't apply — only one project here |
| **object** | the same thing being acted on repeatedly? | doesn't apply — five different files |

An axis is not a sort order or a coordinate; it is a grouping question. Read it
as "angle" if that helps — the angle you look at the activities from.

**Exactly one axis wins per activity.** Our five rows could be told as a
`repeat` story or an `actors` story; it is not told as both. Choosing is called
**curation**, and it happens when the activity is recorded, not when it is read.

**And the axis is part of the group's identity**, not a label on it. Internally a
group is keyed by *axis + hash*, so the same activities grouped along a different
axis are a genuinely different group, with a different id. That is why an axis
can't be renamed after the fact — it isn't a display name.

## 4. Eligibility: when an axis declines

An axis only applies when there is enough of the thing it collapses. Otherwise
"Ines and 0 others uploaded" — technically grouped, pointless to read.

| axis | needs, by default |
|---|---|
| `actors` | 3+ distinct actors |
| `targets` | 2+ distinct targets, across 3+ activities |
| `object` | 2+ activities on one object |
| `repeat` | the fallback — applies when nothing else does |

So our five rows have **two** actors, and `actors` wants three. They stay two
`repeat` stories: "Ines uploaded 3 files", "Marcus uploaded 2 files". Add a third
person and the same rows become one `actors` story.

Two consequences:

- **Thresholds are checked when recording**, so changing them later does not
  re-group old activity — the history keeps the grouping it was given.
- **Below threshold, activities stay single.** An ungrouped activity is not a
  failure; it is a group of one that nobody bothered to call a group.

## 5. What the reader's app receives

A feed page is a list of **nodes**. There are exactly two kinds.

An **activity node** is one activity, with each role fully described — label,
link, everything the renderer needs and nothing about your domain.

A **group node** is an aggregate, and it is *not* "the first row plus its
children". It is a thing in its own right:

| field | plain meaning |
|---|---|
| `axis` | which question produced this group |
| `count` | how many activities are in it — **the true total** |
| `exemplars` | a few named participants per role, to print |
| `distinct` | how many there really are per role |
| `children` | the member activities, possibly capped |

**`exemplars` is a list even when it holds one item.** On the `actors` axis every
member shares one target, so `exemplars.targets` holds exactly one entry — by
construction. That uniformity is what lets a renderer write one code path instead
of four.

**`count` and `distinct` are different numbers.** Five activities by two people
is `count: 5`, `distinct.actors: 2`. "Ines, Marcus and 3 others" would be wrong
here — there is no third person. Which is the point of separating them.

## 6. Grammar turns a node into a sentence

**Grammar** is the registry of headline templates. A template is a string with
**tokens**:

```
:actor uploaded :object to :target
```

The server ships the *template*; your renderer substitutes the entities. That is
why headlines can be translated and why a name can also be a link.

Two flavours:

- **Singular grammar** describes one activity: `:actor uploaded :object to :target`
- **Aggregate grammar** describes a group: `:actors uploaded :count files to :target`

**A group's headline may only claim what is true of every member.** On the
`repeat` axis all members share one actor, so `:actor` is safe. They do *not*
share one object — there were three different files — so `:object` would lie:
"Ines made 3 revisions to annual-report-v3.fig" over three different documents.

That is why plural tokens exist. `:actors`, `:objects`, `:targets`, `:contexts`
print the exemplar list, and a list is honest at any size. Then the collapsed
dimension can finally be *named* rather than hidden:

> Ines uploaded annual-report-v3.fig, hero-mobile.png and 1 more to Password Crackdown

::: tip One plural list per template
Two lists in one sentence stay accurate and become unreadable — a hundred and
eighty characters of names. Keep the second collapsed dimension as `:count`.
:::

## 7. Composites: a story you authored, not one that was inferred

Everything so far is a group the server *derived* from separate activities. A
**composite** is the other direction: **one** activity whose object is a
collection, recorded that way on purpose.

> Ines uploaded 3 files to Password Crackdown

as a single recorded fact, not three facts collapsed afterwards.

The difference that matters: a composite is a real row, so it has a permanent
identity you can link to. A derived group's id is stable only while that axis
keeps winning.

A **batch** is a third thing and is not a feed concept at all. A **burst** is
several activities by one person arriving close together — our five rows are two
bursts, one each. A batch is the package tracking a burst so it can tell when the
person has stopped. Batches are how composites can be minted automatically; they
never appear in a feed themselves.

## 8. Read modes: how collapsed do you want it?

The same activities, three ways, named for what the *reader* gets:

| mode | what it gives the reader |
|---|---|
| **log** | every activity, newest first. The timeline. No groups. |
| **live** | grouped as things happen |
| **summary** | the collapsed best-angle view — the default |

Our five rows: `log` shows five lines, `live` and `summary` show two ("Ines uploaded
3 files", "Marcus uploaded 2"). Same facts, different granularity, and **each
mode gives every activity exactly one node** — never both a group and its
members.

## 9. Reconciliation: the feed changes under the reader

Groups are not stable rows. Our two `repeat` stories become one `actors` story
the moment a third person uploads — a **new node, with a new id**, containing
activities the reader is already looking at. A client that keeps pages and merges
new ones will show those uploads twice unless it is told how to reconcile.

Three ideas, in the order you apply them:

1. **Window** — a fresh first page replaces what you were holding in that time
   range.
2. **Member identity** — if a new node claims activities your old node had, your
   old node is stale, whatever its timestamp.
3. **Sync token** — an opaque value in the envelope. When it changes, history was
   rewritten somewhere you cannot see; drop everything and refetch.

The token is the only signal that history changed outside the pages a client
holds, so a client that stores a stream stores the token with it.

**An empty page is not the end of the feed** — only a null cursor is. A page can
arrive with zero items and a usable cursor.

## Glossary

| term | it is | it is **not** |
|---|---|---|
| **activity** | one recorded fact | a log entry — you choose what gets recorded |
| **verb** | what happened, as a string | a closed set; enums are convenience |
| **actor / object / target / context** | the four roles | interchangeable; target ≠ context |
| **party** | a named participant with no model | a null actor (that means *unknown*) |
| **axis** | the question you group by | a sort order, or a display label |
| **curation** | choosing the winning axis at write time | editorial judgement, or anything at read time |
| **eligibility** | the minimum that makes an axis worth applying | a limit on how big a group can get |
| **group node** | an aggregate in its own right | a parent row with children attached |
| **exemplars** | a few named participants, to print | the full membership — `distinct` has the totals |
| **count** | activities in the group | distinct people (that's `distinct.actors`) |
| **grammar** | the registry of headline templates | rendered prose |
| **token** | a `:placeholder` your renderer fills | a value the server substituted |
| **composite** | one authored story about many objects | a derived group |
| **batch** | a burst-detection window | anything a reader sees |
| **read mode** | how collapsed the reader wants it | a filter |
| **cursor** | an opaque page position | an offset, or something to parse |
| **sync_token** | "history was rewritten, resync" | a cursor, or optional metadata |
| **snapshot** | a cached label/link per entity | a copy of your model |

## Next

[Install the package](/guide/installation), then
[build your first feed](/guide/quickstart) — where every word above becomes a
method call.
