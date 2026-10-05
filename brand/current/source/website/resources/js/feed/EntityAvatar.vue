<script setup lang="ts">
import { computed } from 'vue';
import type { FeedEntity } from './types';

const props = withDefaults(
    defineProps<{
        entity: FeedEntity | null;
        size?: 'sm' | 'md';
    }>(),
    { size: 'md' },
);

const FALLBACK_COLORS = [
    '#0ea5e9',
    '#8b5cf6',
    '#ec4899',
    '#f59e0b',
    '#10b981',
    '#ef4444',
    '#6366f1',
    '#14b8a6',
];

const initials = computed(() => {
    const provided = props.entity?.data?.initials;

    if (typeof provided === 'string' && provided.length > 0) {
        return provided;
    }

    const label = props.entity?.label ?? '?';

    return (
        label
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0]!.toUpperCase())
            .join('') || '?'
    );
});

// Prefer a color the entity carries in its snapshot; otherwise derive one
// deterministically so the same entity is always the same color — and so the
// server and the client agree, which a random pick would not.
const color = computed(() => {
    const provided = props.entity?.data?.avatar_color;

    if (typeof provided === 'string' && provided.length > 0) {
        return provided;
    }

    const key = `${props.entity?.type ?? ''}:${props.entity?.id ?? ''}`;
    let hash = 0;

    for (const char of key) {
        hash = (hash * 31 + char.charCodeAt(0)) | 0;
    }

    return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
});
</script>

<template>
    <span
        role="img"
        :aria-label="entity?.label ?? 'Someone'"
        :title="entity?.label ?? 'Someone'"
        class="sf-avatar"
        :class="size === 'sm' ? 'sf-avatar--sm' : 'sf-avatar--md'"
        :style="{ backgroundColor: color }"
    >
        {{ initials }}
    </span>
</template>
