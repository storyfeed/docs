<script setup lang="ts">
/**
 * A docs-owned preview. The excerpt is a prop of the
 * `Storyfeed/Body/Component` body that names it, so a comment reads as a comment.
 */
defineProps<{ excerpt?: string | null }>();
</script>

<template>
    <blockquote v-if="excerpt" class="sf-note">{{ excerpt }}</blockquote>
</template>

<style scoped>
.sf-note {
    margin: 6px 0 0;
    border-left: 2px solid var(--vp-c-divider);
    padding: 0 0 0 12px;
    font-size: 13.5px;
    font-style: italic;
    color: var(--vp-c-text-2);
}
</style>
