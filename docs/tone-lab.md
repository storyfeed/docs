---
title: Annotation tones
sidebar: false
outline: false
---

# Annotation tones

Same activity, five tones. Untracked scratch page — not part of the site.

<script setup>
const m = (id, label) => ({ type: 'member', id, label, url: `/members/${id}`, data: {}, media: null, body: null, tombstone: null })
const d = (id, label) => ({ type: 'document', id, label, url: `/documents/${id}`, data: {}, media: null, body: null, tombstone: null })
const p = (id, label) => ({ type: 'project', id, label, url: `/projects/${id}`, data: {}, media: null, body: null, tombstone: null })

const comment = [{
  kind: 'activity', id: 'a6', verb: 'comment', glyph: 'message-circle',
  published_at: '2026-08-14T14:40:00.000000Z',
  headline_template: ':actor commented on :target', headline: null,
  actor: m('6', 'Ines Duarte'),
  object: { type: 'comment', id: '932', url: null,
    label: 'The mobile breakpoint eats the caption — the older version handled this better.',
    data: {}, media: null, tombstone: null,
    body: [{ $body: 'Storyfeed/Body/Component', $v: 1, name: 'Note',
      props: { excerpt: 'The mobile breakpoint eats the caption — the older version handled this better. Can we go back to the two-line treatment?' } }] },
  target: d('89', 'style-tile-rev-a.sketch'), context: p('3', 'Port Migration'), data: {},
}]

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
