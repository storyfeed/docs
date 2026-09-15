<script setup lang="ts">
import { computed } from 'vue'

/** `Storyfeed/Body/KeyValue` — labelled rows. A row with no value is dropped
 * unless the form supplied a word for its absence. */
const props = defineProps<{ payload: Record<string, any> }>()

const rows = computed(() =>
    (props.payload.items ?? []).filter(
        (row: any) => !(row.value === null || row.value === '') || row.missing != null,
    ),
)

const text = (value: unknown) => (typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value))
</script>

<template>
    <dl v-if="rows.length" class="sf-facts">
        <div v-for="row in rows" :key="row.key" class="sf-facts__row">
            <dt class="sf-facts__label">{{ row.key }}</dt>
            <dd
                class="sf-facts__value"
                :class="{ 'sf-facts__value--verbatim': row.verbatim }"
                :title="row.verbatim && typeof row.value === 'string' ? row.value : undefined"
            >
                <span v-if="row.value === null || row.value === ''" class="sf-facts__value--absent">{{ row.missing }}</span>
                <template v-else>{{ text(row.value) }}</template>
            </dd>
        </div>
    </dl>
</template>
