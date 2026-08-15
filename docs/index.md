---
layout: home

hero:
  name: Storyfeed
  text: Activity streams for Laravel
  tagline: Turn your app's activity into a rich stream of stories.
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

<LandingTicker />

::: important Pre-1.0
The payload contract is a freeze candidate; authoring APIs may still shift.
[Roadmap →](https://github.com/storyfeed/storyfeed/blob/main/ROADMAP.md)
:::
