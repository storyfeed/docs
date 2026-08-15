<script setup lang="ts">
import { provide } from 'vue'
import FeedStream from '../feed/FeedStream.vue'
import FeedBody from '../components/FeedBody.vue'
import { FEED_NOW } from '../feed/keys'

/**
 * The ticker's feed pane, existing so the clock can differ by mode.
 *
 * Scripted nodes carry 2026-08-14 timestamps and need the demo's pinned
 * clock; live nodes are genuinely recent and need the kit's real, ticking
 * clock. `provide` is a setup-time decision, so the mode is a prop and the
 * parent remounts this component (`:key`) when the mode changes.
 *
 * Providing `undefined` is deliberate: it SHADOWS the theme's app-level pin
 * (2026-08-14) so `useRelativeTime` finds no pin and falls through to the
 * wall clock with its tiered refresh — the kit's native live behaviour.
 */
const props = defineProps<{ items: Record<string, any>[]; pin: number | null }>()

provide(FEED_NOW, (props.pin ?? undefined) as unknown as number)
</script>

<template>
  <FeedStream :items="items" :grouped="false">
    <template #body="{ node }"><FeedBody :node="node" /></template>
  </FeedStream>
</template>
