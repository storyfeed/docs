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
 * Entity labels are whatever the snapshot stored, and some are sentences — a
 * comment's label is its body, because a comment has no name. Full labels are
 * right in the headline; in a compact slot list they only break the scan.
 */
function short(value: string): string {
  return value.length > 42 ? `${value.slice(0, 41).trimEnd()}…` : value
}

const rows = computed(() => {
  const node = props.node
  const out: { slot: string; value: string; code?: boolean }[] = []

  out.push({ slot: 'kind', value: node.kind, code: true })
  out.push({ slot: 'verb', value: node.verb, code: true })

  if (node.kind === 'group') {
    out.push({ slot: 'axis', value: node.axis, code: true })
    out.push({ slot: 'count', value: String(node.count) })
  }

  for (const role of ROLES) {
    const entity = node[role]

    if (entity?.label) {
      out.push({ slot: role, value: short(entity.label) })
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
    <div v-for="row in rows" :key="row.slot" class="sf-mapping-pair">
      <dt>{{ row.slot }}</dt>
      <dd>
        <code v-if="row.code">{{ row.value }}</code>
        <template v-else>{{ row.value }}</template>
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
  overflow: hidden;
  text-overflow: ellipsis;
}

.sf-mapping code {
  font-size: 11px;
  padding: 0 4px;
}
</style>
