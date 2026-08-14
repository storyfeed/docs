<script setup lang="ts">
import { computed } from 'vue'

/**
 * Docs-only: maps a node's slots, for the kit's `annotations` slot.
 *
 * Derived entirely from the node, so an example's mapping cannot disagree with
 * the sentence above it — they are the same data read twice.
 *
 * `slots` fixes exactly which keys are shown and in what order. An empty slot
 * still gets a row, reading `null`: that a slot can be empty is part of the
 * anatomy, and a mapping that silently omitted it would make every activity look
 * as though it filled everything. Omit the prop to map whatever the node carries.
 */
const props = defineProps<{ node: Record<string, any>; slots?: string[] }>()

const ROLES = ['actor', 'object', 'target', 'context'] as const

/** Keys that are not roles, so they read as values rather than entities. */
const PLAIN = ['kind', 'verb', 'axis'] as const

/**
 * Each role holds a typed entity, so show the type beside the label. Without it a
 * label alone is ambiguous: a comment has no name, so its label is its body, and
 * `object: The mobile breakpoint eats the caption…` reads like a stray caption
 * until you can see it is a `comment` — which is also why that activity's
 * headline names the target instead.
 *
 * Labels are never elided. A long one takes its own row.
 */
const LONG = 42

const rows = computed(() => {
  const node = props.node

  /** One row's value: an entity becomes type + label, anything else prints as-is. */
  const resolve = (key: string) => {
    if (ROLES.includes(key as any)) {
      const entity = node[key]

      return entity?.label
        ? { value: entity.label, type: entity.type }
        : { value: 'null', empty: true }
    }

    if (key === 'count') {
      return { value: String(node.count) }
    }

    const value = node[key]

    return value == null
      ? { value: 'null', empty: true }
      : { value: String(value), code: PLAIN.includes(key as any) }
  }

  // With `slots` given, the list is exhaustive and ordered — nothing added,
  // nothing dropped, so every example in a section maps to the same shape.
  if (props.slots) {
    return props.slots.map((slot) => ({ slot, ...resolve(slot) }))
  }

  const keys = [
    'kind',
    'verb',
    ...(node.kind === 'group' ? ['axis', 'count'] : []),
    ...ROLES.filter((role) => node[role]?.label),
    ...(node.icon ? ['icon'] : []),
  ]

  return keys.map((slot) => ({ slot, ...resolve(slot) }))
})
</script>

<template>
  <dl class="sf-mapping">
    <div
      v-for="row in rows"
      :key="row.slot"
      class="sf-mapping-pair"
      :class="{ 'sf-mapping-pair--wide': !row.empty && row.value.length > LONG }"
    >
      <dt>{{ row.slot }}</dt>
      <dd>
        <code v-if="row.code">{{ row.value }}</code>
        <em v-else-if="row.empty" class="sf-mapping-null">null</em>
        <template v-else>
          <span v-if="row.type" class="sf-mapping-type">{{ row.type }}</span>
          {{ row.value }}
        </template>
      </dd>
    </div>
  </dl>
</template>

<style scoped>
.sf-mapping-null {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-style: normal;
  color: var(--vp-c-text-3, #8a94a6);
  opacity: 0.75;
}

.sf-mapping {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 18px;
  margin: 9px 0 2px;
  font-size: 12.5px;
}

.sf-mapping-pair {
  display: flex;
  gap: 6px;
  max-width: 100%;
}

/* A sentence-length value gets the whole row, so it is readable in full rather
   than squeezed between two other pairs. */
.sf-mapping-pair--wide {
  flex: 0 0 100%;
}

.sf-mapping dt {
  color: var(--vp-c-text-3, #8a94a6);
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  align-self: center;
}

.sf-mapping dt::after {
  content: ':';
}

.sf-mapping dd {
  margin: 0;
  color: var(--vp-c-text-2, #4b5563);
}

.sf-mapping-type {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  color: var(--vp-c-text-3, #8a94a6);
}

.sf-mapping-type::after {
  content: ' ·';
}

.sf-mapping code {
  font-size: 11px;
  padding: 0 4px;
}
</style>
