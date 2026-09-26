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

const words = (type: string) => type.replace(/[._-]/g, ' ');
const article = (noun: string) => (/^[aeiou]/i.test(noun) ? 'an' : 'a');

/**
 * A tombstone is a deleted entity. The payload gives the facts (the former
 * type, and the label only when the model kept it); the wording is this kit's
 * own choice, as it would be any renderer's.
 */
const tombstone = computed(() => props.entity?.tombstone ?? null);

// Degraded entities (no snapshot yet) have a null label; render a neutral
// placeholder derived from the type so the sentence still reads.
const label = computed(() => {
    if (!props.entity) {
        return props.fallback ?? 'something';
    }

    if (tombstone.value) {
        const noun = `removed ${words(tombstone.value.formerType)}`;

        return props.entity.label ?? `${article(noun)} ${noun}`;
    }

    // Core's degraded fallback: a missing label reads as "Something" (storyfeed::feed.something).
    return props.entity.label ?? 'Something';
});
</script>

<template>
    <component
        :is="linkComponent"
        v-if="entity?.url && !tombstone"
        :href="entity.url"
        :modal="entity.modal || undefined"
        v-bind="entity.attributes"
        class="sf-entity"
    >
        {{ label }}
    </component>
    <span
        v-else
        class="sf-entity"
        :class="{
            'sf-entity--tombstone': tombstone,
            'sf-entity--unknown': !tombstone && !entity?.label,
        }"
    >
        {{ label }}
    </span>
</template>
