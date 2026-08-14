<script setup lang="ts">
import { toRef } from 'vue';
import FeedNodeView from './FeedNode.vue';
import { useFeedDays } from './useRelativeTime';
import type { FeedNode } from './types';

const props = withDefaults(
    defineProps<{
        items: FeedNode[];
        /** Null means the end of the feed — never an empty page. */
        nextCursor?: string | null;
        loadingMore?: boolean;
        /** Set false for a static excerpt with no day headings. */
        grouped?: boolean;
    }>(),
    { nextCursor: null, loadingMore: false, grouped: true },
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
                <div v-if="grouped" class="sf-row">
                    <div class="sf-rail">
                        <div
                            aria-hidden="true"
                            class="sf-rail__line"
                            :class="dayIndex === 0 ? 'sf-rail__line--lead' : ''"
                        />
                    </div>
                    <h2
                        class="sf-day"
                        :class="dayIndex === 0 ? '' : 'sf-day--later'"
                    >
                        {{ day.label }}
                    </h2>
                </div>

                <div
                    v-for="(item, index) in day.items"
                    :key="item.id"
                    role="listitem"
                >
                    <FeedNodeView
                        :item="item"
                        :is-last="
                            dayIndex === days.length - 1 &&
                            index === day.items.length - 1 &&
                            !nextCursor
                        "
                    >
                        <template #body="slotProps"
                            ><slot name="body" v-bind="slotProps"
                        /></template>
                        <template #annotations="slotProps"
                            ><slot name="annotations" v-bind="slotProps"
                        /></template>
                        <template #time="slotProps"
                            ><slot name="time" v-bind="slotProps">{{
                                slotProps.label
                            }}</slot></template
                        >
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
