<script setup lang="ts">
/**
 * Ported from the demo app (resources/js/components/feed/bodies/Note.vue), with
 * Tailwind utilities swapped for feed.css classes. The excerpt is a prop of the
 * `Storyfeed/Body/Component` body that names it, so a comment reads as a comment.
 */
defineProps<{ excerpt?: string | null }>();
</script>

<template>
    <blockquote v-if="excerpt" class="sf-note">{{ excerpt }}</blockquote>
</template>
