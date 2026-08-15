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

---

<script setup>
import LandingTicker from './.vitepress/theme/demo/LandingTicker.vue'
</script>

<p class="sf-pitch">
Curate the activity from your app into a rich stream of stories. Storyfeed
records what happens — who did what, to what — and reads it back as the feed
your users expect: a raw log, live grouping, or a summary. Below, a live
Laravel app and the feed recorded from it:
</p>

<LandingTicker />

::: important Pre-1.0
The payload contract is a freeze candidate; authoring APIs may still shift.
[Roadmap →](https://github.com/storyfeed/storyfeed/blob/main/ROADMAP.md)
:::
