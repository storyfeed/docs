# Anatomy of an activity stream

This page defines every word the rest of the documentation uses, in plain
English, by following **five real activities** from raw rows to a rendered
sentence. No API — the terms only.

## 1. One activity

An **activity** is one recorded fact, shaped like a sentence with named slots:

> **Ines** *(actor)* **uploaded** *(verb)* **annual-report-v3.fig** *(object)*
> **to Password Crackdown** *(target)*

The **verb** is what happened, as a plain string — `upload`, `confirm`, `archive`.
The other four slots are the **roles**, and they hold entities.

Which slots an activity fills follows from the sentence you are recording. Every
example below is a real story from the [demo app](https://newsroom.storyfeed.dev) —
its own template, its own labels, its own icon token — showing the story a reader
sees, then the slots it was recorded with.

They are ordered by how many slots they fill, which is useful for learning and is
not how a feed looks: a real stream is chronological and mixed.

<FeedStream title="Six activities, ordered by the slots they fill">
  <FeedActivity icon="building-2" when="3d"
    headline=":actor brought on :object as a client"
    actor="Jasper Tey" verb="create" object="Chirp" />

  <FeedActivity icon="user-plus" when="2d"
    headline=":actor joined :target"
    actor="Marcus Webb" verb="join" target="Port Migration" />

  <FeedActivity icon="folder" when="2d"
    headline=":actor created the project :object for :target"
    actor="Ines Duarte" verb="create" object="Bird Removal" target="Chirp" />

  <FeedActivity icon="square-check" when="6h"
    headline=":actor added the task :object in :context"
    actor="Deja Williams" verb="create" object="Kerning pass on the pricing table" context="Port Migration" />

  <FeedActivity icon="file-up" when="2h"
    headline=":actor uploaded :object to :context"
    actor="Ines Duarte" verb="upload" object="style-tile-rev-a.sketch" context="Port Migration" />

  <FeedActivity icon="message-circle" when="20m"
    headline=":actor commented on :target"
    actor="Ines Duarte" verb="comment" object="the comment itself" target="style-tile-rev-a.sketch" context="Port Migration" />
</FeedStream>

The last one is the shape worth studying: five slots filled, and the headline names
the **target** rather than the object — because the object is the comment itself,
which has no name a reader would recognise. The document it was left on is what the
sentence needs, and the project it happened in is the context.

Two details carried over from the real app, both doing work. Document labels are
filenames with version suffixes, which is why an object needs a label and a link
rather than an id. And `icon` is a **token** — `file-up`, `message-circle` — that
the payload ships and your renderer resolves; the vocabulary above is Lucide
because the demo app chose Lucide.

> [!NOTE]
> **Target and context are different roles.** Target is what the act was aimed at;
> context is where it happened. A comment on a document has the **document** as its
> target and the **project** as its context — both true of the same activity, and
> neither substitutes for the other.
>
> They are often the **same** entity, and that is normal: a file uploaded to a
> project was both aimed at the project and inside it. Filling both with the same
> model is a perfectly ordinary activity.

## 2. Why the raw list stops working

One activity reads fine. Here are eight minutes of the demo app's real history,
newest first, one line per activity — the **log**:

<FeedStream title="log — 14:44 to 14:52, eighteen activities" dense>
  <FeedActivity when="14:52:02" icon="message-circle" headline=":actor commented on :target" actor="Sally Nguyen" verb="comment" target="the spacing scale thread" />
  <FeedActivity when="14:51:02" icon="circle-check" headline=":actor completed :object" actor="Bob Callahan" verb="complete" object="Storyboard the icon library" />
  <FeedActivity when="14:50:02" icon="circle-check" headline=":actor completed :object" actor="Priya Raman" verb="complete" object="Simplify the wordmark" />
  <FeedActivity when="14:49:02" icon="circle-check" headline=":actor completed :object" actor="Marcus Webb" verb="complete" object="Rebuild the alt text" />
  <FeedActivity when="14:49:02" icon="file-up" headline=":actor uploaded :object to :context" actor="Aiko Tanaka" verb="upload" object="signage-plan-client-copy.fig" context="Verification Tiers" />
  <FeedActivity when="14:48:15" icon="file-up" headline=":actor uploaded :object to :context" actor="Aiko Tanaka" verb="upload" object="pricing-table-final.docx" context="Verification Tiers" />
  <FeedActivity when="14:48:02" icon="file-pen" headline=":actor revised :object" actor="Aiko Tanaka" verb="revise" object="wireframes-wip.sketch" />
  <FeedActivity when="14:48:00" icon="file-up" headline=":actor uploaded :object to :context" actor="Aiko Tanaka" verb="upload" object="motion-test-rev-b.docx" context="Verification Tiers" />
  <FeedActivity when="14:47:02" icon="circle-check" headline=":actor completed :object" actor="Marcus Webb" verb="complete" object="Kerning pass on the motion tests" />
  <FeedActivity when="14:46:56" icon="file-up" headline=":actor uploaded :object to :context" actor="Aiko Tanaka" verb="upload" object="hero-desktop-rev-b.docx" context="Verification Tiers" />
  <FeedActivity when="14:46:02" icon="circle-check" headline=":actor completed :object" actor="Aiko Tanaka" verb="complete" object="Audit the colour tokens" />
  <FeedActivity when="14:45:46" icon="file-up" headline=":actor uploaded :object to :context" actor="Aiko Tanaka" verb="upload" object="motion-test-client-copy.pdf" context="Verification Tiers" />
  <FeedActivity when="14:45:37" icon="file-up" headline=":actor uploaded :object to :context" actor="Aiko Tanaka" verb="upload" object="colour-tokens-final-2.sketch" context="Verification Tiers" />
  <FeedActivity when="14:45:08" icon="file-up" headline=":actor uploaded :object to :context" actor="Aiko Tanaka" verb="upload" object="colour-tokens-v1.fig" context="Verification Tiers" />
  <FeedActivity when="14:45:02" icon="circle-check" headline=":actor completed :object" actor="Priya Raman" verb="complete" object="Rewrite the hero images" />
  <FeedActivity when="14:45:02" icon="file-check" headline=":actor approved :object" actor="Marcus Webb" verb="approve" object="proof-sheet-final-2.png" />
  <FeedActivity when="14:44:02" icon="circle-check" headline=":actor completed :object" actor="Marcus Webb" verb="complete" object="Rewrite the print specimen" />
  <FeedActivity when="14:44:02" icon="circle-check" headline=":actor completed :object" actor="Aiko Tanaka" verb="complete" object="Redraw the signage mock-ups" />
</FeedStream>

Somewhere in there, Aiko Tanaka uploaded seven files to Verification Tiers — one
coherent piece of work. You cannot see it. The uploads are **not adjacent**: four
other people's activity is interleaved, and Aiko herself revises a document on a
different project in the middle of her own run. To find the shape of what she did,
you have to reconstruct it row by row.

That is what fails about a raw list, and it fails at eighteen rows. It is not
about volume.

The same stretch, read as a **summary**:

<FeedStream title="summary — the same eight minutes">
  <FeedGroup when="14:51:02" icon="circle-check" axis="actors" :count="12"
    headline=":actors completed :count tasks"
    actors="Bob Callahan, Priya Raman" :distinct-actors="4" />

  <FeedGroup when="14:49:02" icon="file-up" axis="composite" :count="7"
    headline=":actor uploaded :objects to :context"
    actor="Aiko Tanaka" context="Verification Tiers"
    objects="colour-tokens-v1.fig, colour-tokens-final-2.sketch, motion-test-client-copy.pdf" :distinct-objects="7" />

  <FeedGroup when="14:48:02" icon="file-pen" axis="scene" :count="12"
    headline=":actors revised :count documents in :context"
    actors="Aiko Tanaka, Tomás Rivera" :distinct-actors="3" context="Port Migration" />

  <FeedGroup when="14:45:02" icon="file-check" axis="actors" :count="9"
    headline=":actors approved :count documents"
    actors="Marcus Webb, Bob Callahan" :distinct-actors="3" />

  <FeedGroup when="14:44:02" icon="square-check" axis="scene" :count="5"
    headline=":actors added :count items in :context"
    actors="Jasper Tey, Marcus Webb" :distinct-actors="3" context="Metaverse Pivot" />
</FeedStream>

Aiko's scattered uploads are now one line, and finding them took no work at all.
Producing that is **aggregation**: collapsing several activities into one telling.

> [!NOTE]
> This is a legibility change, not a compression ratio. Those collapsed nodes count
> activities from before 14:44 as well — the `12 tasks` group reaches back past the
> window — so "eighteen rows became five lines" would be false. What changed is that
> one coherent piece of work is now visible in one glance.

One of those axes is not built in: `scene` is a **custom axis** the demo app
registered for itself, grouping by project. [Aggregation](/deeper/aggregation)
covers writing one.

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
