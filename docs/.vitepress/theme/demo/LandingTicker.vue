<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide, ref } from 'vue'
import FeedStream from '../feed/FeedStream.vue'
import FeedBody from '../components/FeedBody.vue'
import { FEED_NOW } from '../feed/keys'
import PulseLog from './PulseLog.vue'
import { DEMO_NOW, PRESEED_FEED, PRESEED_PULSE, STEPS, finalFeed, finalPulse, stamp } from './timeline'
import type { PulseLine } from './timeline'

/**
 * The landing demo: a Laravel app's pulse on the left, the story the feed
 * tells on the right, unfolding on a scripted loop.
 *
 * The prerender ships the preseeded state, so the page is meaningful before
 * hydration and byte-stable across builds. Timers start on mount only;
 * reduced-motion visitors get the completed story with nothing ticking.
 *
 * The demo pins its own clock (component-level provide beats the theme's),
 * so relative times are stable and never drift with the wall clock.
 */
provide(FEED_NOW, DEMO_NOW)

type ShownLine = { time: string; text: string; kind: PulseLine['kind'] }

const shown = (lines: PulseLine[], cycle: number): ShownLine[] =>
  lines.map((l) => ({ time: stamp(l.offset, cycle), text: l.text, kind: l.kind }))

// Newest first, both panes — a new beat lands at the same height in each.
const pulse = ref<ShownLine[]>(shown(PRESEED_PULSE, 0).reverse())
const feed = ref<Record<string, any>[]>([...PRESEED_FEED])

let timer: ReturnType<typeof setTimeout> | null = null

function play(index: number, cycle: number): void {
  if (index >= STEPS.length) {
    // No reset: the loop wraps, and the story clock rolls forward a cycle so
    // time never runs backwards in the pane.
    play(0, cycle + 1)

    return
  }

  const step = STEPS[index]

  timer = setTimeout(() => {
    pulse.value = [...shown(step.lines, cycle).reverse(), ...pulse.value].slice(0, 14)

    if (step.apply) {
      feed.value = step.apply(feed.value)
    }

    play(index + 1, cycle)
  }, step.delay)
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    pulse.value = shown(finalPulse(), 0).reverse().slice(0, 14)
    feed.value = finalFeed()

    return
  }

  play(0, 0)
})

onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer)
  }
})
</script>

<template>
  <div class="sf-ticker">
    <section class="sf-ticker__pane sf-ticker__pane--pulse">
      <header class="sf-ticker__label">your app</header>
      <PulseLog :lines="pulse" />
    </section>
    <section class="sf-ticker__pane sf-ticker__pane--story">
      <header class="sf-ticker__label">your feed</header>
      <div class="sf-ticker__feed">
        <FeedStream :items="feed" :grouped="false">
          <template #body="{ node }"><FeedBody :node="node" /></template>
        </FeedStream>
      </div>
    </section>
  </div>
</template>

<style scoped>
.sf-ticker {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: 20px;
  margin: 2.5rem 0;
}

@media (max-width: 720px) {
  .sf-ticker {
    grid-template-columns: minmax(0, 1fr);
  }
}

.sf-ticker__pane {
  display: flex;
  flex-direction: column;
  min-height: 380px;
  max-height: 380px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  overflow: hidden;
}

.sf-ticker__pane--pulse {
  background: #0b1120;
  border-color: #1e293b;
}

.sf-ticker__pane--story {
  background: var(--vp-c-bg);
}

.sf-ticker__label {
  padding: 8px 16px 7px;
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  border-bottom: 1px solid var(--vp-c-divider);
}

.sf-ticker__pane--pulse .sf-ticker__label {
  color: #475569;
  border-color: #1e293b;
}

.sf-ticker__feed {
  flex: 1;
  overflow: hidden;
  padding: 6px 18px 12px;
}

/* Inside the demo the pane is the chrome — strip the docs' output well. */
.sf-ticker__feed :deep(.sf-feed) {
  margin: 0;
  border: 0;
  padding: 0;
  background: transparent;
}

.sf-ticker__feed :deep(.sf-feed)::before {
  content: none;
}
</style>
