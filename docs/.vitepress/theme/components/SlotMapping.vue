<script setup lang="ts">
import { computed } from 'vue'

/**
 * Docs-only: renders a node's filled slots beneath its headline, through the
 * kit's `body` slot.
 *
 * Derived entirely from the node, so an example's mapping cannot disagree with
 * the sentence above it — they are the same data read twice.
 */
const props = defineProps<{ node: Record<string, any> }>()

const ROLES = ['actor', 'object', 'target', 'context'] as const

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
  const out: { slot: string; value: string; type?: string; code?: boolean }[] = []

  out.push({ slot: 'kind', value: node.kind, code: true })
  out.push({ slot: 'verb', value: node.verb, code: true })

  if (node.kind === 'group') {
    out.push({ slot: 'axis', value: node.axis, code: true })
    out.push({ slot: 'count', value: String(node.count) })
  }

  for (const role of ROLES) {
    const entity = node[role]

    if (entity?.label) {
      out.push({ slot: role, value: entity.label, type: entity.type })
    }
  }

  if (node.icon) {
    out.push({ slot: 'icon', value: node.icon, code: true })
  }

  return out
})
</script>

<template>
  <dl class="sf-mapping">
    <div
      v-for="row in rows"
      :key="row.slot"
      class="sf-mapping-pair"
      :class="{ 'sf-mapping-pair--wide': row.value.length > LONG }"
    >
      <dt>{{ row.slot }}</dt>
      <dd>
        <code v-if="row.code">{{ row.value }}</code>
        <template v-else>
          <span v-if="row.type" class="sf-mapping-type">{{ row.type }}</span>
          {{ row.value }}
        </template>
      </dd>
    </div>
  </dl>
</template>

<style scoped>
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
