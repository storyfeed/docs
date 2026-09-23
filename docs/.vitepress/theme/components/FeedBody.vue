<script setup lang="ts">
import { computed } from 'vue';
import { resolveBody } from '../feed/bodies';

/**
 * The app-side half of the `body` slot: finds the object's
 * `Storyfeed/Body/Component` body, resolves the component it names, and hands
 * it the props. This is what an app's own FeedItem does with a Component body,
 * reproduced here as a slot filler so the docs render the same previews.
 */
const props = defineProps<{ node: Record<string, any> }>();

const found = computed(() => {
    const bodies: any[] = Array.isArray(props.node.object?.body) ? props.node.object.body : [];
    const body = bodies.find((b) => b?.$body === 'Storyfeed/Body/Component');
    const component = resolveBody(body?.name);

    return component ? { component, props: body.props ?? {} } : null;
});
</script>

<template>
    <component :is="found.component" v-if="found" v-bind="found.props" />
</template>
