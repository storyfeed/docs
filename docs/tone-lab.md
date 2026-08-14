---
title: Annotation tones
sidebar: false
outline: false
---

# Annotation tones

Same activity, five tones. Untracked scratch page — not part of the site.

<script setup>
const m = (id, label) => ({ type: 'member', id, label, url: `/members/${id}`, component: null, data: {} })
const d = (id, label) => ({ type: 'document', id, label, url: `/documents/${id}`, component: null, data: {} })
const p = (id, label) => ({ type: 'project', id, label, url: `/projects/${id}`, component: null, data: {} })

const comment = [{
  kind: 'activity', id: 'a6', verb: 'comment', icon: 'message-circle',
  published_at: '2026-08-14T14:40:00.000000Z',
  headline_template: ':actor commented on :target', headline: null,
  actor: m('6', 'Ines Duarte'),
  object: { type: 'comment', id: '932', url: null, component: 'Note',
    label: 'The mobile breakpoint eats the caption — the older version handled this better.',
    data: { excerpt: 'The mobile breakpoint eats the caption — the older version handled this better. Can we go back to the two-line treatment?' } },
  target: d('89', 'style-tile-rev-a.sketch'), context: p('3', 'Port Migration'), data: {},
}]

const tones = ['slate', 'blue', 'teal', 'violet', 'amber']
</script>

<div v-for="tone in tones" :key="tone">

## {{ tone }}

<FeedStream :items="comment" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
  <template #annotations="{ node }">
    <Annotation :tone="tone" :label="`Anatomy — ${tone}`"><SlotMapping :node="node" /></Annotation>
  </template>
</FeedStream>

</div>
