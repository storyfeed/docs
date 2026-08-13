---
layout: home

hero:
  name: Storyfeed
  text: Activity streams for Laravel
  tagline: The human-readable narrative a product shows its own users — not an audit log.
  image:
    src: /logo.svg
    alt: Storyfeed
  actions:
    - theme: brand
      text: Get started
      link: /guide/installation
    - theme: alt
      text: Why activity streams
      link: /guide/introduction
    - theme: alt
      text: See it running
      link: https://newsroom.storyfeed.dev

features:
  - title: Curated recording
    details: A typed, autocomplete-friendly API for publishing the activities that matter, from your domain events or observers. You choose what makes the feed.
  - title: Self-describing reads
    details: Entity snapshots kill polymorphic N+1s, and every item ships fully described — headline template, icon, linked entities — so a renderer holds zero domain knowledge.
  - title: Grouping that doesn't lie
    details: Activities collapse the way social feeds do ("…and 3 others"), along the axis that fits, with a headline that can only claim what is actually true of the group.
  - title: Activity Streams 2.0
    details: Spec-conformant JSON-LD at the serialization boundary, with a published @context, and ActivityPub federation on the long-range roadmap.
---

<div class="storyfeed-example">
Sally confirmed Delivery #1042 for Acme Co.<br>
Bob, Sally, and 3 others uploaded files to Project X.
</div>

```php
Storyfeed::record(ActivityVerb::Confirm, object: $delivery, actor: $user, target: $customer);

Storyfeed::feed()->context($project)->get();
```

::: important UNDER ACTIVE DEVELOPMENT
Storyfeed is pre-1.0 and these docs are being written alongside the v0.x
milestones. The payload contract is a freeze candidate; the authoring APIs
reflect the working design and may still shift. Follow the
[roadmap](https://github.com/storyfeed/storyfeed/blob/main/ROADMAP.md) for what
is in progress.
:::
