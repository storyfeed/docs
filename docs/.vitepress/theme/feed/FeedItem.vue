<script setup lang="ts">
import { computed, toRef } from 'vue';
import EntityAvatar from './EntityAvatar.vue';
import FeedHeadline from './FeedHeadline.vue';
import FeedIcon from './FeedIcon.vue';
import FeedThread from './FeedThread.vue';
import { detailsIn } from './details';
import FeedMedia from './FeedMedia.vue';
import FeedMediaStrip from './FeedMediaStrip.vue';
import { rail as parseRail, railFor, withoutSecondary } from './rail';
import { useRelativeTime } from './useRelativeTime';
import type { Rail, RailName } from './rail';
import type { ActivityNode } from './types';

const props = withDefaults(
    defineProps<{
        item: ActivityNode;
        /** Compact rendering for group children: tighter spacing, no badge. */
        dense?: boolean;
        /** Hide the rail below this row (last visible row). */
        isLast?: boolean;
        /**
         * Which fact the rail answers first — `actor`, `activity`,
         * `activity-only`, `actor-only`. See `rail.ts` for the model.
         */
        rail?: Rail | RailName | null;
    }>(),
    { dense: false, isLast: false, rail: null },
);

const time = useRelativeTime(toRef(() => props.item.published_at));

/**
 * THE KIT'S DEFAULT IS WHAT IT ALREADY DREW. A row with no rail asked for shows
 * one face and no badge (`actor-only`); a group child shows the verb alone
 * (`activity-only`). Both are legal configurations, so naming them costs no
 * existing page a repaint. The Filament plugin's default is `actor` — a face
 * with the verb badged onto it — and a page that wants to show it says so.
 *
 * When a rail IS asked for, `dense` means exactly what it means in the plugin:
 * the same rail without its badge, not a fifth configuration.
 */
const resolved = computed<Rail>(() => {
    if (props.rail === null) {
        return parseRail(props.dense ? 'activity-only' : 'actor-only');
    }

    const asked = parseRail(props.rail);

    return props.dense ? withoutSecondary(asked) : asked;
});


/**
 * A collapsed group shows a SAMPLE of its members' photographs. A tile stands
 * for an entity, so it keeps that entity's link, and the overflow counts the
 * entities not shown rather than the members.
 */
const strip = computed(() => {
    const exemplars = (props.item as any).exemplars?.objects ?? [];
    const tiles = exemplars
        .map((e: any) => ({ image: e.media?.preview ?? e.media?.url ?? null, href: e.url ?? null }))
        .filter((t: any) => t.image !== null);
    const distinct = (props.item as any).distinct?.objects ?? tiles.length;

    return { tiles, overflow: Math.max(distinct - tiles.length, 0) };
});

/**
 * The details this node carries, activity-level first, then each entity's.
 *
 * A detail lands at an APP-CHOSEN key inside the app's own map, so finding one
 * means walking `data` rather than reading a fixed key. An unrecognised form
 * yields nothing and the activity renders as it always would, minus the block.
 */
const details = computed(() => [
    ...detailsIn(props.item.data),
    ...['object', 'target', 'context', 'actor'].flatMap((role) =>
        detailsIn((props.item as any)[role]?.data).map((found) => ({
            ...found,
            entityLabel: (props.item as any)[role]?.label ?? null,
            entityMedia: (props.item as any)[role]?.media ?? null,
        })),
    ),
]);

/**
 * The row's own picture: the object's preview, or the object itself when the
 * resource IS an image. Never `icon`, which is representational rather than a
 * look at the thing.
 */
const media = computed(() => {
    const slots = (props.item as any).object?.media;

    if (!slots) return null;

    // A FORM THAT NAMES A SLOT OWNS IT. `MediaObject` stores `image: "preview"`
    // and draws that slot itself, so the row must not paint the same picture
    // above it — one photograph, in the place the form put it.
    const claimed = details.value.map((found: any) => found.payload?.image).filter(Boolean);

    if (claimed.includes('preview') || claimed.includes('url')) return null;

    return slots.preview ?? slots.url ?? null;
});

const slots = computed(() =>
    railFor(resolved.value, {
        actors: props.item.actor ? 1 : 0,
        glyph: Boolean(props.item.glyph),
    }),
);
</script>

<template>
    <div class="sf-row">
        <div class="sf-rail">
            <!--
                THE DISC. One of three things: the face, the verb, or the blank
                mark that says the row belongs to the history it sits in when
                neither arrived. Activities are never hidden by the read path,
                so a rail may be empty and may never be broken.
            -->
            <div class="sf-rail__disc">
                <EntityAvatar
                    v-if="slots.disc === 'actor'"
                    :entity="item.actor"
                />
                <FeedIcon
                    v-else-if="slots.disc === 'activity'"
                    :icon="item.glyph"
                    :intent="item.glyph_intent"
                />
                <span v-else class="sf-icon sf-icon--blank" aria-hidden="true" />

                <!--
                    THE BADGE, on the disc's lower corner. It is why this rail
                    can answer "who" and "what" in the same 2rem instead of
                    choosing one.
                -->
                <FeedIcon
                    v-if="slots.badge === 'activity'"
                    :icon="item.glyph"
                    variant="badge"
                />
                <EntityAvatar
                    v-else-if="slots.badge === 'actor'"
                    :entity="item.actor"
                    size="badge"
                />
            </div>
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
            <FeedThread
                v-if="item.thread"
                :thread="item.thread"
                :actor-label="item.actor?.label"
            />
            <slot v-else name="body" :node="item" />

            <FeedMedia v-if="media" :image="media" />

            <FeedMediaStrip
                v-else-if="strip.tiles.length"
                :tiles="strip.tiles"
                :overflow="strip.overflow"
            />

            <!--
                Recognised detail forms, drawn from the app's own `data`. One
                block per detail, in the order the walk found them.
            -->
            <div
                v-for="(found, index) in details"
                :key="index"
                class="sf-detail"
            >
                <component
                    :is="found.component"
                    :payload="found.payload"
                    :entity-label="(found as any).entityLabel"
                    :entity-media="(found as any).entityMedia"
                />
            </div>

            <!--
                Annotations slot: for documentation and debugging surfaces that
                need to explain a node rather than render it — a slot mapping, a
                payload dump, a curation trace. Separate from `body` on purpose,
                so annotating a feed never costs you the app's own previews.
            -->
            <slot name="annotations" :node="item" />
        </div>
    </div>
</template>
