<script setup lang="ts">
/** `Storyfeed/Body/Excerpt` — a passage, and where it came from. */
defineProps<{ payload: Record<string, any> }>()
</script>

<template>
    <figure v-if="payload.text" class="sf-excerpt-block">
        <blockquote class="sf-excerpt">
            {{ payload.text }}<span v-if="payload.truncated" aria-hidden="true">…</span>
        </blockquote>
        <figcaption v-if="payload.from" class="sf-excerpt__from">{{ payload.from }}</figcaption>
    </figure>
</template>
