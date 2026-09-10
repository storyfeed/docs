<script setup lang="ts">
import FeedGroup from './FeedGroup.vue';
import FeedItem from './FeedItem.vue';
import type { Rail, RailName } from './rail';
import type { FeedNode } from './types';

withDefaults(
    defineProps<{
        item: FeedNode;
        isLast?: boolean;
        /** Which fact the rail answers first. Null keeps this kit's default. */
        rail?: Rail | RailName | null;
    }>(),
    { isLast: false, rail: null },
);
</script>

<template>
    <!--
        Dispatch on `kind` and nothing else. There are exactly two node kinds,
        and everything downstream is total on the payload — no verb switch, no
        axis switch, no special case that a new axis or a new verb could break.
    -->
    <FeedItem
        v-if="item.kind === 'activity'"
        :item="item"
        :is-last="isLast"
        :rail="rail"
    >
        <template #body="slotProps"><slot name="body" v-bind="slotProps" /></template>
        <template #annotations="slotProps"><slot name="annotations" v-bind="slotProps" /></template>
        <!--
            The fallback matters: forwarding a slot the consumer did not
            provide would render empty and silently erase the timestamp.
        -->
        <template #time="slotProps"
            ><slot name="time" v-bind="slotProps">{{
                slotProps.label
            }}</slot></template
        >
    </FeedItem>
    <FeedGroup
        v-else-if="item.kind === 'group'"
        :item="item"
        :is-last="isLast"
        :rail="rail"
    >
        <template #body="slotProps"><slot name="body" v-bind="slotProps" /></template>
        <template #annotations="slotProps"><slot name="annotations" v-bind="slotProps" /></template>
        <template #time="slotProps">
            <slot name="time" v-bind="slotProps">{{ slotProps.label }}</slot>
        </template>
    </FeedGroup>
    <!-- Unknown kinds (future payload additions) are skipped, never fatal. -->
</template>
