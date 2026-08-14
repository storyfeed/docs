<script setup lang="ts">
import { computed } from 'vue'

/**
 * One activity, rendered the way a real renderer would: the headline is a
 * TEMPLATE and the entities are substituted into its tokens. That means an
 * example has a single source of truth — the sentence and the slot mapping
 * below it are the same data, so they cannot drift apart.
 */
const props = defineProps<{
  headline: string
  verb: string
  actor?: string
  object?: string
  target?: string
  context?: string
  icon?: string
  when?: string
}>()

const ROLES = ['actor', 'object', 'target', 'context'] as const

/** The headline split into literal text and resolved tokens. */
const parts = computed(() =>
  props.headline.split(/(:[a-z]+)/).map((piece) => {
    const role = piece.startsWith(':') ? piece.slice(1) : null
    const value = role ? (props as Record<string, string | undefined>)[role] : undefined

    return value ? { entity: value } : { text: piece }
  }),
)

/** Only the slots this activity actually fills, in canonical order. */
const slots = computed(() => [
  { slot: 'actor', value: props.actor },
  { slot: 'verb', value: props.verb, code: true },
  ...ROLES.slice(1).map((role) => ({ slot: role, value: props[role] })),
].filter((row) => !!row.value))
</script>

<template>
  <article class="sf-activity">
    <div class="sf-line">
      <span v-if="icon" class="sf-icon" aria-hidden="true">{{ icon }}</span>
      <p class="sf-headline">
        <template v-for="(part, i) in parts" :key="i">
          <strong v-if="part.entity" class="sf-entity">{{ part.entity }}</strong>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>
      <span v-if="when" class="sf-when">{{ when }}</span>
    </div>

    <dl class="sf-slots">
      <div v-for="row in slots" :key="row.slot" class="sf-slot">
        <dt>{{ row.slot }}</dt>
        <dd><code v-if="row.code">{{ row.value }}</code><template v-else>{{ row.value }}</template></dd>
      </div>
    </dl>
  </article>
</template>

<style scoped>
.sf-activity {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 14px 16px 10px;
  margin: 16px 0;
  background: var(--vp-c-bg-soft);
}

.sf-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.sf-icon {
  flex: none;
  font-size: 15px;
  line-height: 1.6;
}

.sf-headline {
  margin: 0;
  line-height: 1.6;
}

.sf-entity {
  font-weight: 600;
  color: var(--vp-c-brand-1);
}

.sf-when {
  margin-left: auto;
  flex: none;
  font-size: 12px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

/* The mapping: one thin metadata line, so a run of items still reads as a feed
   rather than as a stack of tables. */
.sf-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 16px;
  margin: 6px 0 0;
  padding: 0;
  font-size: 12.5px;
}

.sf-slot {
  display: flex;
  gap: 6px;
  white-space: nowrap;
  max-width: 100%;
}

.sf-slots dt {
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  align-self: center;
}

.sf-slots dt::after {
  content: ':';
}

.sf-slots dd {
  margin: 0;
  color: var(--vp-c-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
}

.sf-slots code {
  font-size: 11.5px;
  padding: 0 4px;
}
</style>
