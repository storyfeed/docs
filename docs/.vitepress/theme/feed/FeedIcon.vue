<script setup lang="ts">
import {
    Activity,
    Archive,
    Building2,
    CircleCheck,
    File,
    FileCheck,
    FilePen,
    FileUp,
    Folder,
    MessageCircle,
    SquareCheck,
    UserPlus,
} from 'lucide-vue-next';
import { computed } from 'vue';
import type { Component } from 'vue';

const props = withDefaults(
    defineProps<{
        icon: string | null;
        /**
         * The payload's `glyph_intent` — the app's own word for what this
         * glyph means. Passed through verbatim to `data-sf-intent` and never
         * interpreted here; see below.
         */
        intent?: string | null;
        /** `badge` is the small corner variant; `disc` is the 2rem rail disc. */
        variant?: 'disc' | 'badge';
    }>(),
    { intent: null, variant: 'disc' },
);

/**
 * The payload delivers a resolved icon TOKEN — `file-up`, `message-circle` —
 * and mapping tokens to an icon set is the renderer's one styling decision.
 * The package ships no icons and has no opinion about which set you use;
 * swap this map for Heroicons, Bootstrap Icons or inline SVG and nothing
 * else in the kit changes.
 *
 * Unknown tokens fall back rather than throwing, so a payload that gains a
 * new token never breaks a renderer that has not been updated.
 */
const ICONS: Record<string, Component> = {
    activity: Activity,
    archive: Archive,
    'building-2': Building2,
    'circle-check': CircleCheck,
    file: File,
    'file-check': FileCheck,
    'file-pen': FilePen,
    'file-up': FileUp,
    folder: Folder,
    'message-circle': MessageCircle,
    'square-check': SquareCheck,
    'user-plus': UserPlus,
};

const component = computed<Component>(
    () => ICONS[props.icon ?? ''] ?? Activity,
);

/**
 * `data-sf-intent` carries the app's word onto the element and stops there.
 * This kit knows no intent vocabulary and must not learn one — it is the app's
 * string exactly as the token is, and it is inert until a stylesheet claims it.
 * `feed.css` claims three of them for this site's own examples; an app that
 * says something else says it in its own CSS.
 *
 * Only the disc carries it. A 0.75rem badge is a silhouette, and colouring one
 * says less than it costs; the plugin makes the same call in `node.blade.php`.
 */
const intent = computed(() =>
    props.variant === 'disc' && props.intent ? props.intent : undefined,
);
</script>

<template>
    <span
        class="sf-icon-slot"
        :class="variant === 'badge' ? 'sf-badge' : 'sf-icon'"
        :data-sf-intent="intent"
        aria-hidden="true"
    >
        <component :is="component" />
    </span>
</template>
