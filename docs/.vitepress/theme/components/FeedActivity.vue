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
      <template v-for="row in slots" :key="row.slot">
        <dt>{{ row.slot }}</dt>
        <dd><code v-if="row.code">{{ row.value }}</code><template v-else>{{ row.value }}</template></dd>
      </template>
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

/* The mapping: this activity's slots, as its own detail block. */
.sf-slots {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 2px 14px;
  margin: 12px 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--vp-c-divider);
  font-size: 13px;
}

.sf-slots dt {
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
}

.sf-slots dd {
  margin: 0;
  color: var(--vp-c-text-1);
}

.sf-slots code {
  font-size: 12px;
  padding: 1px 5px;
}
</style>
