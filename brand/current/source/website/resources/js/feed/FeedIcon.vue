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

const props = defineProps<{
    icon: string | null;
}>();

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
</script>

<template>
    <span class="sf-icon" aria-hidden="true">
        <component :is="component" />
    </span>
</template>
