<script setup lang="ts">
import { computed } from 'vue';
import type { FeedEntity } from '../types';

/**
 * Ported from the demo app (resources/js/components/feed/bodies/Note.vue), with
 * Tailwind utilities swapped for feed.css classes. The logic is unchanged: the
 * excerpt comes from the entity snapshot, so a comment reads as a comment.
 */
const props = defineProps<{ entity: FeedEntity }>();

const excerpt = computed(() => {
    const text = props.entity.data?.excerpt;

    return typeof text === 'string' ? text : null;
});
</script>

<template>
    <blockquote v-if="excerpt" class="sf-note">{{ excerpt }}</blockquote>
</template>
