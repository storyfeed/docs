<script setup lang="ts">
import { computed, inject } from 'vue';
import { FEED_COMPONENTS } from '../keys';
const props = defineProps<{ payload: Record<string, unknown> }>();
const registry = inject(FEED_COMPONENTS, {});
const component = computed(() =>
    typeof props.payload.name === 'string' &&
    Object.hasOwn(registry, props.payload.name)
        ? registry[props.payload.name]
        : undefined,
);
</script>

<template>
    <component v-if="component" :is="component" v-bind="payload.props ?? {}" />
</template>
