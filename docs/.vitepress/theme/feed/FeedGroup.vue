<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import EntityAvatar from './EntityAvatar.vue';
import FeedHeadline from './FeedHeadline.vue';
import FeedIcon from './FeedIcon.vue';
import FeedItem from './FeedItem.vue';
import { rail as parseRail, railFor } from './rail';
import { useRelativeTime } from './useRelativeTime';
import type { Rail, RailName } from './rail';
import type { GroupNode } from './types';

const props = withDefaults(
    defineProps<{
        item: GroupNode;
        isLast?: boolean;
        /** Which fact the rail answers first. Null keeps this kit's default. */
        rail?: Rail | RailName | null;
    }>(),
    { isLast: false, rail: null },
);

/** See `FeedItem` for why an unasked-for rail is `actor-only` here. */
const resolved = computed<Rail>(() =>
    parseRail(props.rail === null ? 'actor-only' : props.rail),
);

// A group's faces are its exemplars, capped at three — and more than one of
// them suppresses the badge, because a single face over a group of several
// actors is the one-actor lie the exemplar list exists to refuse.
const faces = computed(() => props.item.exemplars.actors.slice(0, 3));

const slots = computed(() =>
    railFor(resolved.value, {
        actors: faces.value.length,
        glyph: Boolean(props.item.glyph),
    }),
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

// The server names a group's pinned roles for us (v0.9) — this used to
// reconstruct them from `exemplars[0] ?? children[0]`, which is the thing that
// release removed the need for, and which quietly names one entity out of many
// the first time a group is not uniform.
//
// Recover a singular from the exemplars ONLY when the group genuinely has one.
// `distinct` is the true total from the aggregate query, so a one-item exemplar
// list is not on its own proof.
const singular = (role: 'actor' | 'object' | 'target' | 'context') => {
    const named = props.item[role];

    if (named) return named;

    const shown = props.item.exemplars[`${role}s`] ?? [];

    return shown.length === 1 && props.item.distinct[`${role}s`] === 1
        ? shown[0]
        : null;
};

const entities = computed(() => ({
    actor: singular('actor'),
    object: singular('object'),
    target: singular('target'),
    context: singular('context'),
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
            <div class="sf-rail__disc">
                <div v-if="slots.disc === 'actor'" class="sf-avatars">
                    <EntityAvatar
                        v-for="actor in faces"
                        :key="actor.id"
                        :entity="actor"
                        :size="faces.length > 1 ? 'sm' : 'md'"
                    />
                </div>
                <!--
                    One dividend of the flip: an activity-centric group is a
                    single glyph, so the stacking case simply does not arise.
                -->
                <FeedIcon
                    v-else-if="slots.disc === 'activity'"
                    :icon="item.glyph"
                    :intent="item.glyph_intent"
                />
                <span v-else class="sf-icon sf-icon--blank" aria-hidden="true" />

                <FeedIcon
                    v-if="slots.badge === 'activity'"
                    :icon="item.glyph"
                    variant="badge"
                />
                <EntityAvatar
                    v-else-if="slots.badge === 'actor'"
                    :entity="faces[0] ?? null"
                    size="badge"
                />
            </div>
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
                    <slot name="time" :node="item" :label="time.label.value">{{ time.label.value }}</slot>
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
                    :rail="rail"
                    :is-last="
                        index === item.children.length - 1 &&
                        hiddenBeyondChildren === 0
                    "
                >
                    <template #time="slotProps">
                        <slot name="time" v-bind="slotProps">{{ slotProps.label }}</slot>
                    </template>
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
