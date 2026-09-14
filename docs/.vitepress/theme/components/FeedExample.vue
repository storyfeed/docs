<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'

/**
 * A rendered feed and the payload behind it, in one card.
 *
 * The JSON is serialised from the SAME nodes the stream just drew, never
 * written beside it, so an example and its source cannot drift — the failure
 * every hand-maintained "and here is the JSON" block eventually has.
 *
 * Collapsed by default, because most pages are teaching the sentence rather
 * than the shape. `expanded` opens it for the pages where the data IS the
 * lesson.
 */
const props = withDefaults(
    defineProps<{ items: any[]; expanded?: boolean; label?: string }>(),
    { expanded: false, label: 'Payload' },
)

const slots = useSlots()
const open = ref(props.expanded)
const copied = ref(false)

const json = computed(() => JSON.stringify(props.items, null, 2))

/**
 * A small highlighter, because the payload is built at runtime and never
 * reaches the build's syntax highlighter. Escaped first, then tokenised, so
 * nothing in a label can become markup.
 */
const highlighted = computed(() =>
    json.value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"(\s*:)?/g, (_, body, colon) =>
            colon
                ? `<span class="j-key">"${body}"</span>${colon}`
                : `<span class="j-str">"${body}"</span>`,
        )
        .replace(/\b(true|false|null)\b/g, '<span class="j-lit">$1</span>')
        .replace(/(:\s)(-?\d+\.?\d*)/g, '$1<span class="j-num">$2</span>'),
)

async function copy() {
    try {
        await navigator.clipboard.writeText(json.value)
        copied.value = true
        setTimeout(() => (copied.value = false), 1400)
    } catch {
        // A denied clipboard is not worth an error state on a docs page.
    }
}
</script>

<template>
    <div class="sf-example">
        <div class="sf-example__preview">
            <FeedStream :items="items" :grouped="false" v-bind="$attrs">
                <template v-for="(_, name) in slots" #[name]="slotProps">
                    <slot :name="name" v-bind="slotProps as any" />
                </template>
            </FeedStream>
        </div>

        <div class="sf-example__code" :class="{ 'is-open': open }">
            <button
                type="button"
                class="sf-example__toggle"
                :aria-expanded="open"
                @click="open = !open"
            >
                <span class="sf-example__chevron" aria-hidden="true">▸</span>
                {{ label }}
            </button>

            <div v-if="open" class="sf-example__source">
                <button
                    type="button"
                    class="sf-example__copy"
                    :aria-label="copied ? 'Copied' : 'Copy payload'"
                    @click="copy"
                >
                    {{ copied ? 'Copied' : 'Copy' }}
                </button>
                <pre><code v-html="highlighted" /></pre>
            </div>
        </div>
    </div>
</template>

<style scoped>
.sf-example {
    margin: 1rem 0;
    border: 1px solid var(--vp-c-divider);
    border-radius: 10px;
    overflow: hidden;
    background: var(--vp-c-bg);
}
.sf-example__preview {
    padding: 1.1rem 1.25rem;
}
.sf-example__code {
    border-top: 1px solid var(--vp-c-divider);
    background: var(--vp-code-block-bg);
}
.sf-example__toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    width: 100%;
    padding: 0.5rem 1rem;
    font-size: 12.5px;
    font-family: var(--vp-font-family-mono);
    color: var(--vp-c-text-2);
    text-align: left;
    cursor: pointer;
}
.sf-example__toggle:hover {
    color: var(--vp-c-text-1);
}
.sf-example__chevron {
    display: inline-block;
    transition: transform 0.15s ease;
}
.sf-example__code.is-open .sf-example__chevron {
    transform: rotate(90deg);
}
.sf-example__source {
    position: relative;
    border-top: 1px solid var(--vp-c-divider);
}
.sf-example__copy {
    position: absolute;
    top: 0.5rem;
    right: 0.6rem;
    padding: 0.2rem 0.55rem;
    border: 1px solid var(--vp-c-divider);
    border-radius: 6px;
    background: var(--vp-c-bg);
    font-size: 11.5px;
    color: var(--vp-c-text-2);
    cursor: pointer;
}
.sf-example__copy:hover {
    color: var(--vp-c-text-1);
    border-color: var(--vp-c-text-3);
}
.sf-example__source pre {
    margin: 0;
    padding: 0.9rem 1rem;
    max-height: 24rem;
    overflow: auto;
    font-size: 12.5px;
    line-height: 1.55;
}
.sf-example__source code {
    font-family: var(--vp-font-family-mono);
    color: var(--vp-c-text-2);
    white-space: pre;
}
.sf-example__source :deep(.j-key) { color: var(--vp-c-brand-1); }
.sf-example__source :deep(.j-str) { color: var(--vp-c-green-2); }
.sf-example__source :deep(.j-lit) { color: var(--vp-c-purple-2); }
.sf-example__source :deep(.j-num) { color: var(--vp-c-yellow-2); }
</style>
