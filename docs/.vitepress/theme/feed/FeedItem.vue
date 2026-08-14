<script setup lang="ts">
import { toRef } from 'vue';
import EntityAvatar from './EntityAvatar.vue';
import FeedHeadline from './FeedHeadline.vue';
import FeedIcon from './FeedIcon.vue';
import { useRelativeTime } from './useRelativeTime';
import type { ActivityNode } from './types';

const props = withDefaults(
    defineProps<{
        item: ActivityNode;
        /** Compact rendering for group children: no avatar, tighter spacing. */
        dense?: boolean;
        /** Hide the rail below this row (last visible row). */
        isLast?: boolean;
    }>(),
    { dense: false, isLast: false },
);

const time = useRelativeTime(toRef(() => props.item.published_at));
</script>

<template>
    <div class="sf-row">
        <div class="sf-rail">
            <EntityAvatar v-if="!dense && item.actor" :entity="item.actor" />
            <FeedIcon v-else :icon="item.icon" />
            <div v-if="!isLast" aria-hidden="true" class="sf-rail__line" />
        </div>

        <div
            class="sf-body"
            :class="[
                isLast ? '' : 'sf-body--spaced',
                dense ? 'sf-body--dense' : '',
            ]"
        >
            <div class="sf-head">
                <FeedHeadline
                    :template="item.headline_template"
                    :headline="item.headline"
                    :entities="{
                        actor: item.actor,
                        object: item.object,
                        target: item.target,
                        context: item.context,
                    }"
                    :verb="item.verb"
                />
                <time
                    :datetime="item.published_at"
                    :title="time.full.value"
                    class="sf-time"
                >
                    <!--
                        Slot so an app can make the timestamp a permalink to
                        the activity's Activity Streams 2.0 document, without
                        this component knowing your routes.
                    -->
                    <slot name="time" :node="item" :label="time.label.value">{{
                        time.label.value
                    }}</slot>
                </time>
            </div>

            <!--
                Body slot: render a preview under the headline — a comment's
                text, a document thumbnail. Left empty by default because what
                belongs here is entirely app-specific.
            -->
            <slot name="body" :node="item" />
        </div>
    </div>
</template>
