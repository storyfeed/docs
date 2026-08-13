---
layout: home

hero:
  name: Storyfeed
  text: Activity streams for Laravel
  tagline: Record the activities that matter. Read them back as one feed, grouped and headline-ready.
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
  - title: Curated recording
    details: A typed API for publishing the activities that matter. You choose what makes the feed — no model spying.
  - title: Self-describing reads
    details: Entity snapshots kill polymorphic N+1s. Every item ships its own headline template, icon, and linked entities.
  - title: Grouping that doesn't lie
    details: Activities collapse the way social feeds do ("…and 3 others") — with headlines that can only claim what's true of the group.
  - title: Activity Streams 2.0
    details: Spec-conformant JSON-LD with a published @context. ActivityPub on the long-range roadmap.
---

```php
Storyfeed::record(ActivityVerb::Confirm, object: $delivery, actor: $user, target: $customer);

Storyfeed::feed()->context($project)->get();
```

<div class="storyfeed-example">
Sally confirmed Delivery #1042 for Acme Co.<br>
Bob, Sally, and 3 others uploaded files to Project X.
</div>

::: important PRE-1.0
The payload contract is a freeze candidate; authoring APIs may still shift.
[Roadmap →](https://github.com/storyfeed/storyfeed/blob/main/ROADMAP.md)
:::
