<script setup lang="ts">
import { computed } from 'vue';
import type { FeedThread } from './types';

const props = defineProps<{
    thread: FeedThread;
    /**
     * The row's actor label. `by` arrives unconditionally because only the
     * presenter knows whether the headline above already named them.
     */
    actorLabel?: string | null;
}>();

const quote = computed(() => props.thread.text.trim());

/**
 * Dropped when it repeats the actor the headline just named — "Nayani replied"
 * under ":actor commented on :target" is the row saying it twice.
 */
const by = computed(() => {
    const by = props.thread.by;

    return by && by !== props.actorLabel ? by : null;
});

/**
 * Floored at two, and both ends of that are deliberate:
 *
 * - `null` means nobody counted and prints nothing — core is explicit that it
 *   is not a zero.
 * - `0` is a real fact ("no replies yet"), but in this feed it is the fact on
 *   the majority of comment rows, where it announces the absence of the thing
 *   it names.
 * - `1` points either at the quote directly above it or at a message this app
 *   gives the reader no way to reach — Newsroom has no comment permalinks.
 *
 * At two it starts describing a conversation, which is what the reader is
 * being offered. (The plugin reached the same floor independently; noted so
 * the agreement is not mistaken for one of us copying the other.)
 */
const replies = computed(() => {
    const count = props.thread.replies;

    return count !== null && count >= 2 ? `${count} replies` : null;
});

const meta = computed(() =>
    [[by.value, props.thread.kind].filter(Boolean).join(' '), replies.value]
        .filter((part) => part !== null && part !== '')
        .join(' · '),
);
</script>

<template>
    <div v-if="quote || meta" class="sf-thread">
        <!--
            A rule and an indent, not a card. A feed row already carries a
            headline, a time and sometimes a body; a third boxed thing turns a
            stream into a stack of panels. This is also the shape bodies/Note
            already uses for an entity's excerpt, so a quote reads the same way
            wherever it comes from.
        -->
        <blockquote
            v-if="quote"
            class="sf-thread__quote"
        >
            {{ quote
            }}<span v-if="thread.truncated" aria-label="truncated">…</span>
        </blockquote>

        <p
            v-if="meta"
            class="sf-thread__meta"
            :class="{ 'sf-thread__meta--quoted': quote }"
        >
            {{ meta }}
        </p>
    </div>
</template>
