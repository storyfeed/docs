# Anatomy of an activity stream

This page defines every word the rest of the documentation uses, in plain
English, by following **real activities** from raw rows to a rendered
sentence. No API — the terms only.

<script setup>
// Node-shaped examples: the same shape `Storyfeed::feed()->get()` returns, so the
// widgets below are the demo app's real renderer reading a real payload rather
// than a diagram of one.
const m = (id, label) => ({ type: 'member', id, label, url: `/members/${id}` })
const p = (id, label) => ({ type: 'project', id, label, url: `/projects/${id}` })
const c = (id, label) => ({ type: 'client', id, label, url: `/clients/${id}` })
const d = (id, label) => ({ type: 'document', id, label, url: `/documents/${id}` })
const t = (id, label) => ({ type: 'task', id, label, url: `/tasks/${id}` })

const node = (over) => ({
  kind: 'activity', id: over.id, verb: over.verb,
  published_at: over.published_at,
  headline_template: over.headline_template, headline: null, icon: over.icon,
  actor: over.actor ?? null, object: over.object ?? null,
  target: over.target ?? null, context: over.context ?? null, data: {},
})

const group = (over) => ({
  kind: 'group', id: over.id, verb: over.verb, axis: over.axis, count: over.count,
  published_at: over.published_at,
  headline_template: over.headline_template, headline: null, icon: over.icon,
  exemplars: { actors: over.actors ?? [], objects: over.objects ?? [], targets: over.targets ?? [], contexts: over.contexts ?? [] },
  distinct: over.distinct ?? {},
  children: over.children ?? [], children_truncated: false,
})

// Eight real minutes of the demo app's history, 14:44–14:52 UTC.
const log = [
  ['14:52:02','comment','message-circle',':actor commented on :target', m('4','Sally Nguyen'), null, d('120','the spacing scale thread'), null],
  ['14:51:02','complete','circle-check',':actor completed :object', m('3','Bob Callahan'), t('601','Storyboard the icon library'), null, null],
  ['14:50:02','complete','circle-check',':actor completed :object', m('8','Priya Raman'), t('602','Simplify the wordmark'), null, null],
  ['14:49:02','complete','circle-check',':actor completed :object', m('5','Marcus Webb'), t('603','Rebuild the alt text'), null, null],
  ['14:49:02','upload','file-up',':actor uploaded :object to :context', m('9','Aiko Tanaka'), d('301','signage-plan-client-copy.fig'), null, p('12','Verification Tiers')],
  ['14:48:15','upload','file-up',':actor uploaded :object to :context', m('9','Aiko Tanaka'), d('302','pricing-table-final.docx'), null, p('12','Verification Tiers')],
  ['14:48:02','revise','file-pen',':actor revised :object', m('9','Aiko Tanaka'), d('303','wireframes-wip.sketch'), null, p('3','Port Migration')],
  ['14:48:00','upload','file-up',':actor uploaded :object to :context', m('9','Aiko Tanaka'), d('304','motion-test-rev-b.docx'), null, p('12','Verification Tiers')],
  ['14:47:02','complete','circle-check',':actor completed :object', m('5','Marcus Webb'), t('604','Kerning pass on the motion tests'), null, null],
  ['14:46:56','upload','file-up',':actor uploaded :object to :context', m('9','Aiko Tanaka'), d('305','hero-desktop-rev-b.docx'), null, p('12','Verification Tiers')],
  ['14:46:02','complete','circle-check',':actor completed :object', m('9','Aiko Tanaka'), t('605','Audit the colour tokens'), null, null],
  ['14:45:46','upload','file-up',':actor uploaded :object to :context', m('9','Aiko Tanaka'), d('306','motion-test-client-copy.pdf'), null, p('12','Verification Tiers')],
  ['14:45:37','upload','file-up',':actor uploaded :object to :context', m('9','Aiko Tanaka'), d('307','colour-tokens-final-2.sketch'), null, p('12','Verification Tiers')],
  ['14:45:08','upload','file-up',':actor uploaded :object to :context', m('9','Aiko Tanaka'), d('308','colour-tokens-v1.fig'), null, p('12','Verification Tiers')],
  ['14:45:02','complete','circle-check',':actor completed :object', m('8','Priya Raman'), t('606','Rewrite the hero images'), null, null],
  ['14:45:02','approve','file-check',':actor approved :object', m('5','Marcus Webb'), d('309','proof-sheet-final-2.png'), null, null],
  ['14:44:02','complete','circle-check',':actor completed :object', m('5','Marcus Webb'), t('607','Rewrite the print specimen'), null, null],
  ['14:44:02','complete','circle-check',':actor completed :object', m('9','Aiko Tanaka'), t('608','Redraw the signage mock-ups'), null, null],
].map(([time, verb, icon, tpl, actor, object, target, context], i) => node({
  id: `l${i}`, verb, icon, headline_template: tpl,
  published_at: `2026-08-14T${time}.000000Z`, actor, object, target, context,
}))

// The same window, collapsed. Counts reach back past 14:44 — see the note below.
const summary = [
  group({ id: 'g1', verb: 'complete', axis: 'actors', count: 12, icon: 'circle-check',
    published_at: '2026-08-14T14:51:02.000000Z',
    headline_template: ':actors completed :count tasks',
    actors: [m('3','Bob Callahan'), m('8','Priya Raman')], distinct: { actors: 4 } }),
  group({ id: 'g2', verb: 'upload', axis: 'composite', count: 7, icon: 'file-up',
    published_at: '2026-08-14T14:49:02.000000Z',
    headline_template: ':actor uploaded :objects to :context',
    actors: [m('9','Aiko Tanaka')],
    objects: [d('308','colour-tokens-v1.fig'), d('307','colour-tokens-final-2.sketch'), d('306','motion-test-client-copy.pdf')],
    contexts: [p('12','Verification Tiers')], distinct: { actors: 1, objects: 7, contexts: 1 } }),
  group({ id: 'g3', verb: 'revise', axis: 'scene', count: 12, icon: 'file-pen',
    published_at: '2026-08-14T14:48:02.000000Z',
    headline_template: ':actors revised :count documents in :context',
    actors: [m('9','Aiko Tanaka'), m('10','Tomás Rivera')],
    contexts: [p('3','Port Migration')], distinct: { actors: 3, contexts: 1 } }),
  group({ id: 'g4', verb: 'approve', axis: 'actors', count: 9, icon: 'file-check',
    published_at: '2026-08-14T14:45:02.000000Z',
    headline_template: ':actors approved :count documents',
    actors: [m('5','Marcus Webb'), m('3','Bob Callahan')], distinct: { actors: 3 } }),
  group({ id: 'g5', verb: 'create', axis: 'scene', count: 5, icon: 'square-check',
    published_at: '2026-08-14T14:44:02.000000Z',
    headline_template: ':actors added :count items in :context',
    actors: [m('1','Jasper Tey'), m('5','Marcus Webb')],
    contexts: [p('7','Metaverse Pivot')], distinct: { actors: 3, contexts: 1 } }),
]

const oneActivity = [
  node({ id: 'a6', verb: 'comment', icon: 'message-circle', published_at: '2026-08-14T14:40:00.000000Z',
    headline_template: ':actor commented on :target',
    actor: m('6', 'Ines Duarte'),
    object: { type: 'comment', id: '932', label: 'The mobile breakpoint eats the caption — the older version handled this better.', url: null },
    target: d('89', 'style-tile-rev-a.sketch'), context: p('3', 'Port Migration') }),
  node({ id: 'a5', verb: 'upload', icon: 'file-up', published_at: '2026-08-14T13:00:00.000000Z',
    headline_template: ':actor uploaded :object to :context',
    actor: m('6', 'Ines Duarte'), object: d('91', 'pricing-table-final.docx'), context: p('3', 'Port Migration') }),
  node({ id: 'a4', verb: 'create', icon: 'square-check', published_at: '2026-08-14T09:00:00.000000Z',
    headline_template: ':actor added the task :object in :context',
    actor: m('7', 'Deja Williams'), object: t('562', 'Kerning pass on the pricing table'), context: p('3', 'Port Migration') }),
  node({ id: 'a3', verb: 'create', icon: 'folder', published_at: '2026-08-13T16:00:00.000000Z',
    headline_template: ':actor created the project :object for :target',
    actor: m('6', 'Ines Duarte'), object: p('9', 'Bird Removal'), target: c('2', 'Chirp') }),
  node({ id: 'a2', verb: 'join', icon: 'user-plus', published_at: '2026-08-13T11:00:00.000000Z',
    headline_template: ':actor joined :target',
    actor: m('5', 'Marcus Webb'), target: p('3', 'Port Migration') }),
  node({ id: 'a1', verb: 'create', icon: 'building-2', published_at: '2026-08-12T10:00:00.000000Z',
    headline_template: ':actor brought on :object as a client',
    actor: m('1', 'Jasper Tey'), object: c('2', 'Chirp') }),
]
</script>

## 1. One activity

An **activity** is one recorded fact, shaped like a sentence with named slots:

> **Ines** *(actor)* **uploaded** *(verb)* **annual-report-v3.fig** *(object)*
> **to Password Crackdown** *(target)*

The **verb** is what happened, as a plain string — `upload`, `confirm`, `archive`.
The other four slots are the **roles**, and they hold entities.

Which slots an activity fills follows from the sentence you are recording. Below is
a feed of six activities, rendered by the **same components the
[demo app](https://newsroom.storyfeed.dev) uses** — each showing the story a reader
sees, then the slots it was recorded with.

They are ordered by how many slots they fill, which is useful for learning and is
not how a feed looks: a real stream is chronological and mixed.

<FeedStream :items="oneActivity" :grouped="false">
  <template #body="{ node }"><SlotMapping :node="node" /></template>
</FeedStream>

The comment is the shape worth studying: five slots filled, and the headline names
the **target** rather than the object — because the object is the comment itself,
whose label is the comment text. The document it was left on is what the sentence
needs, and the project it happened in is the context.

Two details carried over from the real app. Document labels are filenames with
version suffixes, which is why an object needs a label and a link rather than an
id. And each item's circle is the **actor's** avatar — the payload also ships an
`icon` token (`file-up`, `message-circle`) which this renderer falls back to when
an activity has no actor. The package ships no icons; the token is yours to map.

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
one line per activity — the **log**:

<FeedStream :items="log" :grouped="false" />

Somewhere in there, Aiko Tanaka uploaded seven files to Verification Tiers — one
coherent piece of work. You cannot see it. The uploads are **not adjacent**: four
other people's activity is interleaved, and Aiko herself revises a document on a
different project in the middle of her own run. To find the shape of what she did,
you have to reconstruct it row by row.

That is what fails about a raw list, and it fails at eighteen rows. It is not about
volume.

The same stretch, read as a **summary**:

<FeedStream :items="summary" :grouped="false">
  <template #body="{ node }"><SlotMapping :node="node" /></template>
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
