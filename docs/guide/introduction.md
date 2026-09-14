# Introduction

Storyfeed is an implementation of the activity feed pattern in Laravel.
Activities are recorded explicitly, read back as a timeline or an aggregated
feed, and serialized following
[W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/).

<script setup>
// Node-shaped examples: the same shape `Storyfeed::feed()->get()` returns, so the
// widgets below are the demo app's real renderer reading a real payload rather
// than a diagram of one.
import { who, where, firm, doc, job, note, activity, group } from '../.vitepress/theme/samples'

// Eight real minutes of the demo app's history, 14:44–14:52 UTC.
const log = [
  ['14:52:02','comment','message-circle',':actor commented on :target', who.editor, null, doc.thread, null],
  ['14:51:02','complete','circle-check',':actor completed :object', who.commenter, job.storyboard, null, null],
  ['14:50:02','complete','circle-check',':actor completed :object', who.reviewer, job.simplify, null, null],
  ['14:49:02','complete','circle-check',':actor completed :object', who.lead, job.altText, null, null],
  ['14:49:02','upload','file-up',':actor uploaded :object to :context', who.illustrator, doc.signageCopy, null, where.fourth],
  ['14:48:15','upload','file-up',':actor uploaded :object to :context', who.illustrator, doc.pricing, null, where.fourth],
  ['14:48:02','revise','file-pen',':actor revised :object', who.illustrator, doc.wireframes, null, where.other],
  ['14:48:00','upload','file-up',':actor uploaded :object to :context', who.illustrator, doc.motionTest, null, where.fourth],
  ['14:47:02','complete','circle-check',':actor completed :object', who.lead, job.kerningMotion, null, null],
  ['14:46:56','upload','file-up',':actor uploaded :object to :context', who.illustrator, doc.heroDesktop, null, where.fourth],
  ['14:46:02','complete','circle-check',':actor completed :object', who.illustrator, job.audit, null, null],
  ['14:45:46','upload','file-up',':actor uploaded :object to :context', who.illustrator, doc.motionTestCopy, null, where.fourth],
  ['14:45:37','upload','file-up',':actor uploaded :object to :context', who.illustrator, doc.tokensFinal, null, where.fourth],
  ['14:45:08','upload','file-up',':actor uploaded :object to :context', who.illustrator, doc.tokens, null, where.fourth],
  ['14:45:02','complete','circle-check',':actor completed :object', who.reviewer, job.rewriteHero, null, null],
  ['14:45:02','approve','file-check',':actor approved :object', who.lead, doc.proofSheet, null, null],
  ['14:44:02','complete','circle-check',':actor completed :object', who.lead, job.rewritePrint, null, null],
  ['14:44:02','complete','circle-check',':actor completed :object', who.illustrator, job.redraw, null, null],
].map(([time, verb, glyph, tpl, actor, object, target, context], i) => activity({
  id: `l${i}`, verb, glyph, headline_template: tpl,
  published_at: `2026-08-14T${time}.000000Z`, actor, object, target, context,
}))

// The same window, collapsed. Counts reach back past 14:44 — see the note below.
const summary = [
  group({ id: 'g1', verb: 'complete', axis: 'actors', count: 12, glyph: 'circle-check',
    published_at: '2026-08-14T14:51:02.000000Z',
    headline_template: ':actors completed :count tasks',
    actors: [who.commenter, who.reviewer], distinct: { actors: 4 } }),
  group({ id: 'g2', verb: 'upload', axis: 'composite', count: 7, glyph: 'file-up',
    published_at: '2026-08-14T14:49:02.000000Z',
    headline_template: ':actor uploaded :objects to :context',
    actors: [who.illustrator],
    objects: [doc.tokens, doc.tokensFinal, doc.motionTestCopy],
    contexts: [where.fourth], distinct: { actors: 1, objects: 7, contexts: 1 } }),
  group({ id: 'g3', verb: 'revise', axis: 'scene', count: 12, glyph: 'file-pen',
    published_at: '2026-08-14T14:48:02.000000Z',
    headline_template: ':actors revised :count documents in :context',
    actors: [who.illustrator, who.approver],
    contexts: [where.other], distinct: { actors: 3, contexts: 1 } }),
  group({ id: 'g4', verb: 'approve', axis: 'actors', count: 9, glyph: 'file-check',
    published_at: '2026-08-14T14:45:02.000000Z',
    headline_template: ':actors approved :count documents',
    actors: [who.lead, who.commenter], distinct: { actors: 3 } }),
  group({ id: 'g5', verb: 'create', axis: 'scene', count: 5, glyph: 'square-check',
    published_at: '2026-08-14T14:44:02.000000Z',
    headline_template: ':actors added :count items in :context',
    actors: [who.owner, who.lead],
    contexts: [where.third], distinct: { actors: 3, contexts: 1 } }),
]

// Section 2 reuses section 1's comment, plus the context it actually carries —
// so the fourth role arrives on an activity the reader has already read.

const oneActivity = [
  activity({ id: 'a6', verb: 'comment', glyph: 'message-circle', published_at: '2026-08-14T14:40:00.000000Z',
    headline_template: ':actor commented on :target',
    actor: who.designer,
    object: note.first,
    target: doc.styleTile }),
  activity({ id: 'a5', verb: 'upload', glyph: 'file-up', published_at: '2026-08-14T13:00:00.000000Z',
    headline_template: ':actor uploaded :object to :target',
    actor: who.designer, object: doc.pricing, target: where.other }),
  activity({ id: 'a4', verb: 'create', glyph: 'square-check', published_at: '2026-08-14T09:00:00.000000Z',
    headline_template: ':actor added the task :object',
    actor: who.producer, object: job.kerningPricing }),
  activity({ id: 'a3', verb: 'create', glyph: 'folder', published_at: '2026-08-13T16:00:00.000000Z',
    headline_template: ':actor created the project :object for :target',
    actor: who.designer, object: where.created, target: firm.main }),
  activity({ id: 'a2', verb: 'join', glyph: 'user-plus', published_at: '2026-08-13T11:00:00.000000Z',
    headline_template: ':actor joined :target',
    actor: who.lead, target: where.other }),
  activity({ id: 'a1', verb: 'create', glyph: 'building-2', published_at: '2026-08-12T10:00:00.000000Z',
    headline_template: ':actor brought on :object as a client',
    actor: who.owner, object: firm.main }),
]
</script>

## What Is an Activity?

An activity is a recorded fact, shaped like a sentence with named roles:

> {{ who.designer.label }} uploaded {{ doc.report.label }} to {{ where.main.label }}

The **actor** is the party that initiated the activity. 
The **verb** describes the action that occurred. The **object** is
the subject of interest from the action, and the **target** is 
what the action was aimed at.

> **{{ who.designer.label }}** *(actor)* **uploaded** *(verb)* **{{ doc.report.label }}** *(object)*
> to **{{ where.main.label }}** *(target)*

**{{ who.designer.label }}** is the party that initiated an **upload** of the file **{{ doc.report.label }}**, into the **{{ where.main.label }}** project.
The summary headline of the activity may take different forms, but the underlying fact is always the same.

> **{{ who.designer.label }}** submitted the file **{{ doc.report.label }}** to **{{ where.main.label }}**

> A new file **{{ doc.report.label }}** was added to **{{ where.main.label }}** by **{{ who.designer.label }}**

> **{{ where.main.label }}** received a new file **{{ doc.report.label }}** from **{{ who.designer.label }}**

The recorded action is still an **upload**, despite it being described differently under
each published headline.


## Examples of Activities

<FeedStream :items="oneActivity" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
  <template #annotations="{ node }">
    <Annotation><SlotMapping :node="node" :slots="['actor', 'verb', 'object', 'target']" /></Annotation>
  </template>
</FeedStream>

The comment is the shape worth studying: the headline names the **target** rather
than the object, because the object is the comment itself and its label is the
comment text. The document it was left on is what the sentence needs.

## Sample Feed

### As a Linear Log

<FeedStream :items="log" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

### As a Grouped Summary

<FeedStream :items="summary" :grouped="false">
  <template #annotations="{ node }">
    <Annotation><SlotMapping :node="node" /></Annotation>
  </template>
</FeedStream>
