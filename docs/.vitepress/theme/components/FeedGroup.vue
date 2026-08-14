<script setup lang="ts">
import { computed, inject } from 'vue'

/**
 * A group node. Same substitution mechanism as FeedActivity, with the plural
 * tokens: `:actors` and `:objects` render the exemplar lists, `:count` the true
 * total. Overflow comes from the distinct totals, never from `count`.
 */
const props = defineProps<{
  headline: string
  axis: string
  count: number
  /** Comma-separated exemplar labels, as the payload lists them. */
  actors?: string
  objects?: string
  targets?: string
  contexts?: string
  target?: string
  context?: string
  actor?: string
  /** True distinct totals, when they exceed the exemplars shown. */
  distinctActors?: number
  distinctObjects?: number
  icon?: string
  when?: string
}>()

const dense = inject('sf-dense', false)

const split = (value?: string) => (value ?? '').split(',').map((v) => v.trim()).filter(Boolean)

/** Joined exemplars, with overflow appended from the distinct total. */
function list(values: string[], distinct?: number): string {
  if (values.length === 0) return '—'

  const more = distinct && distinct > values.length ? distinct - values.length : 0
  const joined = values.length > 1
    ? `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`
    : values[0]

  return more > 0 ? `${values.join(', ')} and ${more} more` : joined
}

const resolved = computed<Record<string, string>>(() => ({
  actors: list(split(props.actors), props.distinctActors),
  objects: list(split(props.objects), props.distinctObjects),
  targets: list(split(props.targets)),
  contexts: list(split(props.contexts)),
  actor: props.actor ?? '',
  target: props.target ?? '',
  context: props.context ?? '',
  count: String(props.count),
}))

const parts = computed(() =>
  props.headline.split(/(:[a-z]+)/).map((piece) => {
    const token = piece.startsWith(':') ? piece.slice(1) : null
    const value = token ? resolved.value[token] : undefined

    return value ? { entity: value, plain: token === 'count' } : { text: piece }
  }),
)
</script>

<template>
  <article class="sf-activity sf-group">
    <div class="sf-line">
      <code v-if="icon" class="sf-icon" :title="`icon token: ${icon}`">{{ icon }}</code>
      <p class="sf-headline">
        <template v-for="(part, i) in parts" :key="i">
          <template v-if="part.plain">{{ part.entity }}</template>
          <strong v-else-if="part.entity" class="sf-entity">{{ part.entity }}</strong>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>
      <span v-if="when" class="sf-when">{{ when }}</span>
    </div>

    <dl v-if="!dense" class="sf-slots">
      <div class="sf-slot"><dt>kind</dt><dd><code>group</code></dd></div>
      <div class="sf-slot"><dt>axis</dt><dd><code>{{ axis }}</code></dd></div>
      <div class="sf-slot"><dt>count</dt><dd>{{ count }}</dd></div>
    </dl>
  </article>
</template>

<style scoped>
.sf-group .sf-headline {
  font-weight: 500;
}
</style>
