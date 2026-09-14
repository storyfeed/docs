<script setup lang="ts">
import { computed, useSlots } from 'vue'

/**
 * A rendered feed with its payload one click away.
 *
 * The JSON is serialised from the SAME nodes the stream just drew, never
 * written beside it, so an example and its source cannot drift — the failure
 * every hand-maintained "and here is the JSON" block eventually has.
 *
 * Slots are forwarded, because a page that annotates a node or draws a body
 * should not have to choose between that and showing the payload.
 */
const props = defineProps<{ items: any[]; label?: string }>()

const slots = useSlots()

const json = computed(() => JSON.stringify(props.items, null, 2))
</script>

<template>
    <div class="sf-example">
        <FeedStream :items="items" :grouped="false" v-bind="$attrs">
            <template v-for="(_, name) in slots" #[name]="slotProps">
                <slot :name="name" v-bind="slotProps as any" />
            </template>
        </FeedStream>

        <details class="sf-example__source">
            <summary>{{ label ?? 'View payload' }}</summary>
            <pre><code>{{ json }}</code></pre>
        </details>
    </div>
</template>

<style scoped>
.sf-example__source {
    margin-top: 0.5rem;
}
.sf-example__source summary {
    cursor: pointer;
    font-size: 13px;
    color: var(--vp-c-text-2);
    user-select: none;
}
.sf-example__source summary:hover {
    color: var(--vp-c-text-1);
}
.sf-example__source pre {
    margin: 0.5rem 0 0;
    padding: 0.75rem 1rem;
    max-height: 22rem;
    overflow: auto;
    border-radius: 8px;
    background: var(--vp-code-block-bg);
    font-size: 12.5px;
    line-height: 1.5;
}
.sf-example__source code {
    font-family: var(--vp-font-family-mono);
    color: var(--vp-c-text-2);
    white-space: pre;
}
</style>
