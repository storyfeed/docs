<script setup lang="ts">
/**
 * A docs-owned preview. The excerpt is a prop of the
 * `Storyfeed/Body/Component` body that names it, so a comment reads as a comment.
 */
defineProps<{ excerpt?: string | null }>();
</script>

<template>
    <blockquote v-if="excerpt" class="sf-note [margin:6px_0_0] [border-left:2px_solid_var(--vp-c-divider)] [padding:0_0_0_12px] [font-size:13.5px] [font-style:italic] [color:var(--vp-c-text-2)]">{{ excerpt }}</blockquote>
</template>
