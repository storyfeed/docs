# Introduction

Storyfeed is an implementation of the activity feed pattern for Laravel.
Activities are recorded explicitly, read back as a timeline or an aggregated
feed, and serialized following
[W3C Activity Streams 2.0](https://www.w3.org/TR/activitystreams-core/).

Each snippet below is followed by what it produces, rendered by a real feed
component reading a real payload.

<script setup>
import { member, project, document, comment, activity, group } from '../.vitepress/theme/samples'

const ines = member('6', 'Ines Duarte')
const priya = member('8', 'Priya Raman')
const crackdown = project('4', 'Password Crackdown')
const report = document('88', 'annual-report-v3.fig')

const upload = activity({
  id: 'i1', verb: 'upload', icon: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :object to :target',
  actor: ines, object: report, target: crackdown,
})

const burst = group({
  id: 'i2', verb: 'upload', axis: 'repeat', count: 7, icon: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :count files to :target',
  actors: [ines], targets: [crackdown],
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
  actor: priya,
  object: comment('511', 'Second page still overflows on the print stylesheet.'),
  target: report,
})

const rows = [
  activity({ id: 'i4', verb: 'upload', icon: 'file-up',
    published_at: '2026-08-14T14:30:00.000000Z',
    headline_template: ':actor uploaded :object to :target',
    actor: ines, object: report, target: crackdown }),
  activity({ id: 'i5', verb: 'upload', icon: 'file-up',
    published_at: '2026-08-14T14:29:30.000000Z',
    headline_template: ':actor uploaded :object to :target',
    actor: ines, object: document('87', 'signage-plan-rev-b.fig'), target: crackdown }),
  note,
  activity({ id: 'i6', verb: 'upload', icon: 'file-up',
    published_at: '2026-08-14T14:27:00.000000Z',
    headline_template: ':actor uploaded :object to :target',
    actor: ines, object: document('86', 'pricing-table-final.docx'), target: crackdown }),
]

const collapsed = [burst, note]
</script>

## Record an activity

```php
Storyfeed::record('upload', $document, actor: $user, target: $project);
```

Read it back:

```php
$page = Storyfeed::feed()->get();
```

<FeedStream :items="[upload]" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

## Record several, and they aggregate

Nothing extra to call: activities are grouped as they are written, and the read
picks a grouping.

```php
foreach ($documents as $document) {
    Storyfeed::record('upload', $document, actor: $user, target: $project);
}
```

<FeedStream :items="[burst]" :grouped="false" />

## Choose how collapsed the reader gets it

```php
Storyfeed::feed()->log()->get();
```

<FeedStream :items="rows" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

```php
Storyfeed::feed()->summary()->get();
```

<FeedStream :items="collapsed" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

## Scope a feed to one model

```php
Storyfeed::feed()->involving($project)->get();
```

Anything the project took part in, whichever role it played — including the
activity that created the project itself.

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
