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

```php
Storyfeed::record('confirm', $delivery, actor: $user, target: $customer);

Storyfeed::feed()->context($project)->get();
```

<div class="storyfeed-example">
Sally confirmed Delivery #1042 for Acme Co.<br>
Bob, Sally, and 3 others uploaded files to Project X.
</div>

::: important Pre-1.0
The payload contract is a freeze candidate; authoring APIs may still shift.
[Roadmap →](https://github.com/storyfeed/storyfeed/blob/main/ROADMAP.md)
:::
