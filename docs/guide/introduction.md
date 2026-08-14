# Introduction

Storyfeed is an implementation of the activity feed pattern for Laravel.
Activities are recorded explicitly, read back as a timeline or an aggregated
feed, and serialized following
[W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/).

Below: what you record, and what the reader gets back — rendered by a real feed
component reading a real payload. How it gets from one to the other is the rest of
these docs.

<script setup>
import { who, where, document, comment, activity, group } from '../.vitepress/theme/samples'

const designer = who.designer
const reviewer = who.reviewer
const crackdown = where.crackdown
const report = document('88', 'annual-report-v3.fig')

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
    document('87', 'signage-plan-rev-b.fig'),
    document('86', 'pricing-table-final.docx'),
  ],
  distinct: { actors: 1, objects: 7, targets: 1 },
})

const note = activity({
  id: 'i3', verb: 'comment', icon: 'message-circle',
  published_at: '2026-08-14T14:28:00.000000Z',
  headline_template: ':actor commented on :target',
  actor: reviewer,
  object: comment('511', 'Second page still overflows on the print stylesheet.'),
  target: report,
})

</script>

## What you record, and what it reads back

```php
Storyfeed::record('upload', $document, actor: $user, target: $project);
```

<FeedStream :items="[upload]" :grouped="false" />

Record the same thing a few times and it arrives aggregated, with no second call:

```php
foreach ($documents as $document) {
    Storyfeed::record('upload', $document, actor: $user, target: $project);
}
```

<FeedStream :items="[burst]" :grouped="false" />

A different verb, and an object that carries its own preview:

```php
Storyfeed::record('comment', $comment, actor: $user, target: $document);
```

<FeedStream :items="[note]" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

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
