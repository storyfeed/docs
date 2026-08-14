<script setup lang="ts">
import { computed, inject } from 'vue';
import { FEED_LINK } from './keys';
import type { FeedEntity } from './types';

const props = defineProps<{
    entity: FeedEntity | null;
    /** Rendered when the entity itself is null (e.g. an anonymous actor). */
    fallback?: string;
}>();

const linkComponent = inject(FEED_LINK, 'a');

// Degraded entities (no snapshot yet) have a null label; render a neutral
// placeholder derived from the type so the sentence still reads.
const label = computed(() => {
    if (!props.entity) {
        return props.fallback ?? 'something';
    }

    return props.entity.label ?? `a ${props.entity.type.replace(/[._-]/g, ' ')}`;
});
</script>

<template>
    <component
        :is="linkComponent"
        v-if="entity?.url"
        :href="entity.url"
        v-bind="entity.attributes"
        class="sf-entity"
    >
        {{ label }}
    </component>
    <span
        v-else
        class="sf-entity"
        :class="{ 'sf-entity--unknown': !entity?.label }"
    >
        {{ label }}
    </span>
</template>
