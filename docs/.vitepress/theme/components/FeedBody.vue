<script setup lang="ts">
import { computed } from 'vue';
import { resolveBody } from '../feed/bodies';

/**
 * The app-side half of the `body` slot: resolves the component the payload names
 * on `object.component` and hands it the object snapshot. This is exactly what
 * the demo app's FeedItem does internally — reproduced here as a slot filler so
 * the docs render the same previews the app does.
 */
const props = defineProps<{ node: Record<string, any> }>();

const body = computed(() => resolveBody(props.node.object?.component));
</script>

<template>
    <component :is="body" v-if="body && node.object" :entity="node.object" />
</template>
