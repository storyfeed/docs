---
layout: home

hero:
  name: Storyfeed
  text: Activity streams for Laravel
  tagline: The activity feed pattern — timeline, aggregation, Activity Streams 2.0 — for your Laravel app.
  image:
    src: /logo.svg
    alt: Storyfeed
  actions:
    - theme: brand
      text: Get started
      link: /guide/installation
    - theme: alt
      text: Introduction
      link: /guide/introduction
    - theme: alt
      text: Live demo
      link: https://newsroom.storyfeed.dev

features:
  - title: Explicit recording
    details: A typed API for publishing activities. You choose what makes the feed — no model spying.
  - title: Self-describing payload
    details: Entity snapshots kill polymorphic N+1s. Every item ships its own headline template, icon, and linked entities.
  - title: Aggregation
    details: Activities collapse into stories ("…and 3 others") — with headlines that only claim what is true of the group.
  - title: Activity Streams 2.0
    details: Spec-conformant JSON-LD with a published @context. ActivityPub on the long-range roadmap.
---

<script setup>
import { who, where, doc, activity, group } from './.vitepress/theme/samples'

const nodes = [
  activity({
    id: 'h1', verb: 'upload', icon: 'file-up',
    published_at: '2026-08-14T14:30:00.000000Z',
    headline_template: ':actor uploaded :object to :target',
    actor: who.ines, object: doc.annualReportV3, target: where.passwordCrackdown,
  }),
  group({
    id: 'h2', verb: 'upload', axis: 'actors', count: 5, icon: 'file-up',
    published_at: '2026-08-14T14:28:00.000000Z',
    headline_template: ':actors uploaded :count files to :target',
    actors: [who.ines, who.marcus, who.priya], targets: [where.passwordCrackdown],
    distinct: { actors: 5, objects: 5, targets: 1 },
  }),
]
</script>

```php
Storyfeed::activity()
    ->by($user)
    ->action('upload', $document)
    ->to($project)
    ->publish();

$project->storyfeed()->get();
```

<FeedStream :items="nodes" :grouped="false" />

::: important Pre-1.0
The payload contract is a freeze candidate; authoring APIs may still shift.
[Roadmap →](https://github.com/storyfeed/storyfeed/blob/main/ROADMAP.md)
:::
