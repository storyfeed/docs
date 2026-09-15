<script setup lang="ts">
/**
 * `Storyfeed/Body/Markdown` — authored body text, carried as SOURCE.
 *
 * The form stores what the author wrote; turning it into HTML is the
 * renderer's job and its choice of parser. This kit shows the source as a
 * paragraph, which is honest for a docs example and keeps a parser out of a
 * page about payload shapes.
 */
defineProps<{ payload: Record<string, any> }>()
</script>

<template>
    <p v-if="payload.content" class="sf-prose">{{ payload.content }}</p>
</template>
