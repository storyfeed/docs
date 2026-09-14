<script setup lang="ts">
import { computed } from 'vue'

/**
 * `Storyfeed/Detail/File` — what an artefact is and how big, never its URL.
 *
 * The name is shown only when the sentence above did not already say it: a
 * preview complements a headline, it does not restate it.
 */
const props = defineProps<{ payload: Record<string, any>; entityLabel?: string | null }>()

const human = (bytes: unknown) => {
    if (typeof bytes !== 'number') return null
    const units = ['B', 'KB', 'MB', 'GB']
    let value = bytes
    let unit = 0
    while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++ }

    return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`
}

const parts = computed(() =>
    [
        props.payload.name && props.payload.name !== props.entityLabel ? props.payload.name : null,
        human(props.payload.size),
        props.payload.mediaType,
    ].filter(Boolean),
)
</script>

<template>
    <p v-if="parts.length" class="sf-file">{{ parts.join(' · ') }}</p>
</template>
