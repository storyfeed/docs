# Introduction

Storyfeed is an implementation of the activity feed pattern for Laravel.
Activities are recorded explicitly, read back as a timeline or an aggregated
feed, and serialized following
[W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/).

Below: what you record, and what the reader gets back — rendered by a real feed
component reading a real payload. How it gets from one to the other is the rest of
these docs.

<script setup>
import { who, where, doc, note, entity, activity, group } from '../.vitepress/theme/samples'

const designer = who.ines
const reviewer = who.priya
const crackdown = where.passwordCrackdown
const report = doc.annualReportV3

const upload = activity({
  id: 'i1', verb: 'upload', icon: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :object to :target',
  actor: designer, object: report, target: crackdown,
})

const burst = group({
  id: 'i2', verb: 'upload', axis: 'repeat', count: 7, icon: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :count files to :target',
  actors: [designer], targets: [crackdown],
  objects: [
    report,
    doc.signagePlanRevB,
    doc.pricingTableFinal,
  ],
  distinct: { actors: 1, objects: 7, targets: 1 },
})

const crowd = group({
  id: 'i7', verb: 'upload', axis: 'actors', count: 5, icon: 'file-up',
  published_at: '2026-08-14T14:31:00.000000Z',
  headline_template: ':actors uploaded :count files to :target',
  actors: [who.ines, who.marcus, who.priya], targets: [crackdown],
  distinct: { actors: 5, objects: 5, targets: 1 },
})

const story = group({
  id: 'i8', verb: 'approve', axis: 'composite', count: 2, icon: 'file-check',
  published_at: '2026-08-14T14:20:00.000000Z',
  headline_template: ':actor approved :count files',
  actors: [who.tomas],
  objects: [doc.wordmarkV3, doc.heroMobileRevA],
  distinct: { actors: 1, objects: 2 },
})

const external = activity({
  id: 'i9', verb: 'sync', icon: 'refresh-cw',
  published_at: '2026-08-14T13:55:00.000000Z',
  headline_template: ':actor synced :object to :target',
  actor: entity('storyfeed.party', '1', 'Concur Web Service', null),
  object: doc.expenseReportQ3, target: crackdown,
})

const reply = activity({
  id: 'i3', verb: 'comment', icon: 'message-circle',
  published_at: '2026-08-14T14:28:00.000000Z',
  headline_template: ':actor commented on :target',
  actor: reviewer,
  object: note.overflow,
  target: report,
})

</script>

## Single activity

A user uploads a document to a project.

```php
Storyfeed::activity('upload', $document)
    ->by($user)
    ->to($project)
    ->publish();
```

<FeedStream :items="[upload]" :grouped="false" />

## Consecutive activities

The same user uploads seven documents to that project, one after another.

```php
foreach ($documents as $document) {
    Storyfeed::activity('upload', $document)
        ->by($user)
        ->to($project)
        ->publish();
}
```

<FeedStream :items="[burst]" :grouped="false" />

## The same act by different people

Five users upload documents to the same project.

```php
foreach ($uploads as [$user, $document]) {
    Storyfeed::activity('upload', $document)
        ->by($user)
        ->to($project)
        ->publish();
}
```

<FeedStream :items="[crowd]" :grouped="false" />

## A story you author yourself

A user approves two documents at once, and the two of them are one fact, not
two.

```php
Storyfeed::activity('approve')
    ->by($user)
    ->objects($documents)
    ->publish();
```

<FeedStream :items="[story]" :grouped="false" />

## An object that carries its own preview

A user comments on a document.

```php
Storyfeed::activity('comment', $comment)
    ->by($user)
    ->on($document)
    ->publish();
```

<FeedStream :items="[reply]" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

## A participant with no model

An external service pushes a document into a project, and it has no row in your
database to point at.

```php
Storyfeed::activity('sync', $document)
    ->by('Concur Web Service')
    ->to($project)
    ->publish();
```

<FeedStream :items="[external]" :grouped="false" />

## Whichever preposition the verb takes

The chain is the sentence, so the role setters have the prepositions English
actually uses. Every line below records the same thing — one activity, one actor,
one target:

```php
Storyfeed::activity('comment', $comment)->by($user)->on($document)->publish();
Storyfeed::activity('share', $document)->by($user)->with($teammate)->publish();
Storyfeed::activity('move', $document)->by($user)->into($folder)->publish();
Storyfeed::activity('upload', $document)->by($user)->to($project)->publish();
Storyfeed::activity('create', $project)->by($user)->for($client)->publish();
```

Pick the one that reads true; the stored activity is identical either way. The
long-hand — `actor()`, `object()`, `target()`, `context()` — names the slots
directly and is always available. [Recording](/basics/recording) has the full set.

## How it works





- **You record explicitly.** `Storyfeed::record()` from an action, observer, or
  event listener — you choose what makes the feed. No model spying, no magic.
- **Reads never touch your domain tables.** Each entity is snapshotted at
  publish time, so a feed page is fast regardless of how many models it spans.
- **Aggregation happens behind the scenes.** Activities are grouped at write
  time along multiple axes; the read picks the best one.
- **The payload is a versioned contract.** Every item ships its own headline
  template, icon, and linked entities. Adding a new activity type never
  requires a frontend change.

## License

MIT, and everything MIT today stays MIT — see
[Compatibility](/reference/compatibility#licensing). Building your own renderer
against the payload contract is expected; the [quickstart](/guide/quickstart)
ends with one in plain Blade.

## Next

**New to the pattern, or to this package's vocabulary?**
[Anatomy of an activity stream](/guide/anatomy) defines every term the rest of
these docs use — roles, axes, grammar, nodes, read modes — in plain English,
starting from a single activity. No API.

Otherwise: [install the package](/guide/installation), then build
[your first feed](/guide/quickstart) in about ten minutes.
