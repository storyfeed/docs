<script setup lang="ts">
/**
 * `Storyfeed/Body/Prose` — authored text, carried as SOURCE.
 *
 * The form stores what the author wrote and the `mediaType` says how to read
 * it. A renderer parses ONLY what it positively recognises and shows
 * everything else as characters, which is both the honest default and the
 * safe one: a media type half-known is an injection surface.
 *
 * This kit parses nothing at all, which is honest for a docs example and
 * keeps a parser out of a page about payload shapes. `verbatim` is the one
 * thing it acts on — the fact that the text is reproduced exactly — and it
 * answers with a fixed width, which is a renderer's conclusion rather than
 * something the payload asked for.
 */
defineProps<{ payload: Record<string, any> }>()
</script>

<template>
    <figure v-if="payload.content" class="sf-prose-block">
        <figcaption v-if="payload.title" class="sf-prose__title">{{ payload.title }}</figcaption>
        <pre v-if="payload.verbatim" class="sf-verbatim"><code>{{ payload.content }}</code></pre>
        <p v-else class="sf-prose">{{ payload.content }}</p>
    </figure>
</template>
