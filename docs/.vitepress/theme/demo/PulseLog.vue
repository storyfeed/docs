<script setup lang="ts">
/**
 * The app's low-level pulse: requests, events, jobs, as a terminal pane.
 *
 * Newest line at the TOP, matching the feed beside it — both panes tell time
 * in the same direction, so a new beat lands at the same height in each.
 *
 * Deliberately machine-gray and monospace — the whole demo is the contrast
 * between this pane and the feed, so this one must not be pretty.
 */
defineProps<{ lines: { time: string; text: string; kind: 'request' | 'event' | 'job'; status?: number }[] }>()

const GLYPHS: Record<string, string> = {
  request: '→',
  event: '⚡',
  job: '↻',
}
</script>

<template>
  <div class="sf-pulse" aria-hidden="true">
    <div
      v-for="line in lines"
      :key="`${line.time}-${line.text}`"
      class="sf-pulse__line"
      :class="`sf-pulse__line--${line.kind}`"
    >
      <span class="sf-pulse__time">{{ line.time }}</span>
      <span class="sf-pulse__glyph">{{ GLYPHS[line.kind] }}</span>
      <span class="sf-pulse__text">{{ line.text }}</span>
      <span v-if="line.status" class="sf-pulse__status">{{ line.status }}</span>
    </div>
  </div>
</template>

<style scoped>
.sf-pulse {
  height: 100%;
  overflow: hidden;
  padding: 14px 16px;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  line-height: 1.9;
  background: #0b1120;
  color: #64748b;
}

.sf-pulse__line {
  display: flex;
  gap: 10px;
  white-space: nowrap;
  animation: sf-pulse-in 0.3s ease-out both;
}

@keyframes sf-pulse-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sf-pulse__line {
    animation: none;
  }
}

.sf-pulse__time {
  color: #475569;
}

.sf-pulse__glyph {
  width: 1.2em;
  text-align: center;
}

.sf-pulse__line--request .sf-pulse__text {
  color: #94a3b8;
}

.sf-pulse__line--event .sf-pulse__glyph,
.sf-pulse__line--event .sf-pulse__text {
  color: #7dd3fc;
}

.sf-pulse__line--job .sf-pulse__glyph,
.sf-pulse__line--job .sf-pulse__text {
  color: #a5b4fc;
}

.sf-pulse__status {
  margin-left: auto;
  color: #34d399;
}
</style>
