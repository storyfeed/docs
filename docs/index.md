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
Storyfeed records what happens in your Laravel app — who did what, to what —
and reads it back as an activity feed. Recording is one explicit call; there is
no model spying. Grouping happens as activities are written, so seven uploads
arrive as one story, and the same history reads at three granularities: a raw
log, live grouping, or a summary. Every item ships its own headline template
and linked entities, so the feed renders with any stack. Below, a live Laravel
app and the feed recorded from it:
</p>

<LandingTicker />

::: important Pre-1.0
The payload contract is a freeze candidate; authoring APIs may still shift.
[Roadmap →](https://github.com/storyfeed/storyfeed/blob/main/ROADMAP.md)
:::
