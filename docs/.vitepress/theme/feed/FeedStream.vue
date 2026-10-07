<script setup lang="ts">
import { toRef } from 'vue';
import FeedNodeView from './FeedNode.vue';
import type { Rail, RailName } from './rail';
import type { FeedNode } from './types';
import { useFeedDays } from './useRelativeTime';

const props = withDefaults(
    defineProps<{
        items: FeedNode[];
        /** Null means the end of the feed — never an empty page. */
        nextCursor?: string | null;
        loadingMore?: boolean;
        /** Set false for a static excerpt with no day headings. */
        grouped?: boolean;
        /**
         * Which fact the rail answers first — `actor`, `activity`,
         * `activity-only`, `actor-only`. Null keeps this kit's default; see
         * `rail.ts` and `/basics/the-rail`.
         */
        rail?: Rail | RailName | null;
        /**
         * Labels to draw on the rail before particular items, keyed by item
         * id: `{ [firstTimelineId]: 'Timeline' }`. Drawn like a day heading,
         * as a node on the rail rather than a heading above it.
         */
        dividers?: Record<string, string>;
    }>(),
    {
        nextCursor: null,
        loadingMore: false,
        grouped: true,
        rail: null,
        dividers: () => ({}),
    },
);

const emit = defineEmits<{ loadMore: [] }>();

const days = useFeedDays(toRef(() => props.items));
</script>

<template>
    <div class="sf-feed">
        <div v-if="items.length === 0" class="sf-empty">
            <slot name="empty">No activity yet.</slot>
        </div>

        <div v-else role="list">
            <section v-for="(day, dayIndex) in days" :key="day.label">
                <div v-if="grouped" class="sf-row sf-divider">
                    <div class="sf-rail">
                        <div aria-hidden="true" class="sf-rail__node" />
                        <div aria-hidden="true" class="sf-rail__line" />
                    </div>
                    <h2 class="sf-day">{{ day.label }}</h2>
                </div>

                <div
                    v-for="(item, index) in day.items"
                    :key="item.id"
                    role="listitem"
                >
                    <div v-if="dividers[item.id]" class="sf-row sf-divider">
                        <div class="sf-rail">
                            <div aria-hidden="true" class="sf-rail__node" />
                            <div aria-hidden="true" class="sf-rail__line" />
                        </div>
                        <h2 class="sf-day">{{ dividers[item.id] }}</h2>
                    </div>
                    <FeedNodeView
                        :item="item"
                        :is-last="
                            dayIndex === days.length - 1 &&
                            index === day.items.length - 1 &&
                            !nextCursor
                        "
                        :rail="rail"
                    >
                        <template #body="slotProps"
                            ><slot name="body" v-bind="slotProps"
                        /></template>
                        <template #annotations="slotProps"
                            ><slot name="annotations" v-bind="slotProps"
                        /></template>
                        <template v-if="$slots.time" #time="slotProps"
                            ><slot name="time" v-bind="slotProps"
                        /></template>
                    </FeedNodeView>
                </div>
            </section>

            <div v-if="nextCursor" class="sf-row">
                <div class="sf-rail">
                    <div aria-hidden="true" class="sf-rail__line" />
                </div>
                <button
                    type="button"
                    class="sf-more"
                    :disabled="loadingMore"
                    @click="emit('loadMore')"
                >
                    {{ loadingMore ? 'Loading…' : 'Load older activity' }}
                </button>
            </div>
        </div>
    </div>
</template>
