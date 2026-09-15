<script setup lang="ts">
import { computed } from 'vue'

/**
 * `Storyfeed/Body/Change` — before and after, for one field or several.
 *
 * An OMITTED index means that side did not exist (a field added or removed);
 * a null is a present but empty value, drawn as a word rather than a blank
 * that reads as a layout bug.
 */
const props = defineProps<{ payload: Record<string, any> }>()

const rows = computed(() => Object.entries(props.payload.changes ?? {}))

const side = (value: unknown) =>
    value === null ? 'empty' : typeof value === 'boolean' ? String(value) : String(value)
</script>

<template>
    <dl v-if="rows.length" class="sf-change">
        <div v-for="[field, pair] in rows" :key="field" class="sf-change__row">
            <dt class="sf-change__field">{{ field }}</dt>
            <dd class="sf-change__pair">
                <span v-if="0 in pair" class="sf-change__before">{{ side(pair[0]) }}</span>
                <span v-if="0 in pair && 1 in pair" class="sf-change__arrow" aria-hidden="true">→</span>
                <span v-if="1 in pair">{{ side(pair[1]) }}</span>
            </dd>
        </div>
    </dl>
</template>
