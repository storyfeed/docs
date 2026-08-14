<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import EntityAvatar from './EntityAvatar.vue';
import FeedHeadline from './FeedHeadline.vue';
import FeedIcon from './FeedIcon.vue';
import FeedItem from './FeedItem.vue';
import { useRelativeTime } from './useRelativeTime';
import type { GroupNode } from './types';

const props = withDefaults(
    defineProps<{
        item: GroupNode;
        isLast?: boolean;
    }>(),
    { isLast: false },
);

// A group the package declined to name (no template, no headline) has nothing
// to summarize, so it opens on its members instead of hiding them behind a
// count. Reachable by design — the payload contract requires renderers to
// handle it, and it is not an error state.
const unnamed = computed(
    () => !props.item.headline_template && !props.item.headline,
);

const expanded = ref(unnamed.value);

const time = useRelativeTime(toRef(() => props.item.published_at));

// Group nodes pin roles per axis; the head member fills in what the
// aggregate template needs beyond the exemplars.
const head = computed(() => props.item.children[0] ?? null);

// Singular slots come from the exemplar lists: where the axis pins a role the
// list holds exactly one entity, which is precisely when a singular token is
// allowed. The head member fills the rest for unpinned roles the template
// cannot legally reference anyway.
const entities = computed(() => ({
    actor: props.item.exemplars.actors[0] ?? head.value?.actor ?? null,
    object: props.item.exemplars.objects[0] ?? head.value?.object ?? null,
    target: props.item.exemplars.targets[0] ?? head.value?.target ?? null,
    context: props.item.exemplars.contexts[0] ?? head.value?.context ?? null,
}));

// `count` is the TRUE total and `children` is capped by the server, so the
// remainder has to be stated rather than implied by the list length.
const hiddenBeyondChildren = computed(
    () => props.item.count - props.item.children.length,
);
</script>

<template>
    <div class="sf-row">
        <div class="sf-rail">
            <div v-if="item.exemplars.actors.length > 0" class="sf-avatars">
                <EntityAvatar
                    v-for="actor in item.exemplars.actors.slice(0, 3)"
                    :key="actor.id"
                    :entity="actor"
                    :size="item.exemplars.actors.length > 1 ? 'sm' : 'md'"
                />
            </div>
            <FeedIcon v-else :icon="item.icon" />
            <div
                v-if="!isLast || expanded"
                aria-hidden="true"
                class="sf-rail__line"
            />
        </div>

        <div class="sf-body" :class="isLast && !expanded ? '' : 'sf-body--spaced'">
            <div class="sf-head">
                <FeedHeadline
                    :template="item.headline_template"
                    :headline="item.headline"
                    :entities="entities"
                    :exemplars="item.exemplars"
                    :distinct="item.distinct"
                    :count="item.count"
                    :verb="item.verb"
                    aggregate
                />
                <time
                    :datetime="item.published_at"
                    :title="time.full.value"
                    class="sf-time"
                >
                    {{ time.label.value }}
                </time>
            </div>

            <!--
                A group is a node too, so it gets the same annotations slot an
                activity does — otherwise a documentation surface can annotate
                every kind of node except the interesting one.
            -->
            <slot name="body" :node="item" />

            <slot name="annotations" :node="item" />

            <button
                v-if="item.children.length > 0"
                type="button"
                class="sf-toggle"
                :aria-expanded="expanded"
                @click="expanded = !expanded"
            >
                {{ expanded ? 'Show less' : `Show all ${item.count}` }}
            </button>

            <div v-if="expanded" class="sf-children">
                <FeedItem
                    v-for="(child, index) in item.children"
                    :key="child.id"
                    :item="child"
                    dense
                    :is-last="
                        index === item.children.length - 1 &&
                        hiddenBeyondChildren === 0
                    "
                >
                    <template #body="slotProps">
                        <slot name="body" v-bind="slotProps" />
                    </template>
                    <template #annotations="slotProps">
                        <slot name="annotations" v-bind="slotProps" />
                    </template>
                </FeedItem>
                <p v-if="hiddenBeyondChildren > 0" class="sf-overflow">
                    …and {{ hiddenBeyondChildren }} more not shown
                </p>
            </div>
        </div>
    </div>
</template>
