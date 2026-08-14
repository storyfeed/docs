<script setup lang="ts">
import { provide } from 'vue'

/**
 * The frame around a set of feed items, so a run of examples reads as one feed
 * rather than as separate figures.
 *
 * `dense` suppresses each item's slot line — for a stream whose point is its
 * length rather than its anatomy.
 */
const props = defineProps<{ title?: string; dense?: boolean }>()

provide('sf-dense', props.dense ?? false)
</script>

<template>
  <section class="sf-stream">
    <header v-if="title" class="sf-stream-title">{{ title }}</header>
    <slot />
  </section>
</template>

<style scoped>
.sf-stream {
  margin: 20px 0;
  padding: 4px 14px 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}

.sf-stream-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  padding: 12px 2px 2px;
}

/* Inside a stream the items are siblings in one list, not standalone cards. */
.sf-stream :deep(.sf-activity) {
  border: 0;
  border-radius: 0;
  background: none;
  padding: 12px 2px 11px;
  margin: 0;
}

.sf-stream :deep(.sf-activity + .sf-activity) {
  border-top: 1px solid var(--vp-c-divider);
}
</style>

<style scoped>
/* A dense stream is a list of lines, not a list of cards. */
.sf-stream:has(> .sf-dense) {
  padding-bottom: 2px;
}
</style>
