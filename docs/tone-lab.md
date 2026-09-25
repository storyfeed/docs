---
title: Annotation tones
sidebar: false
outline: false
---

# Annotation tones

Same activity, five tones. Untracked scratch page — not part of the site.

<script setup>
import { scene } from './.vitepress/theme/world'
const comment = [scene.question]
const tones = ['slate', 'blue', 'teal', 'violet', 'amber']
</script>

<div v-for="tone in tones" :key="tone">

## {{ tone }}

<FeedExample :items="comment">
  <template #body="{ node }"><FeedBody :node="node" /></template>
  <template #annotations="{ node }">
    <Annotation :tone="tone" :label="`Anatomy — ${tone}`"><SlotMapping :node="node" /></Annotation>
  </template>
</FeedExample>

</div>
