<script setup lang="ts">
import { computed } from 'vue'
import FeedMedia from '../FeedMedia.vue'

/**
 * `Storyfeed/Detail/MediaObject` — the shape of a post: a title line, some
 * prose, one picture, the files it names, and a line of small print.
 *
 * THE DETAIL STORES NO IMAGE. `image` is a slot NAME — icon, preview or image
 * — and the picture is the entity's media for that slot, minted at read time.
 * A row recorded under an old thumbnail conversion draws the current one, and
 * a slot the resolver left empty draws no picture and no placeholder.
 *
 * The subject is shown only when the sentence above did not already say it: a
 * preview complements a headline, it does not restate it.
 */
const props = defineProps<{
    payload: Record<string, any>
    entityLabel?: string | null
    entityMedia?: Record<string, any> | null
}>()

const subject = computed(() => {
    const value = props.payload.subject
    const label = typeof value === 'string' ? value : value?.label

    return label && label !== props.entityLabel ? { label, href: value?.href ?? null } : null
})

const picture = computed(() =>
    props.payload.image ? (props.entityMedia?.[props.payload.image] ?? null) : null,
)

const footnote = computed(() => {
    const value = props.payload.footnote

    return typeof value === 'string' ? { label: value, href: null } : value
})
</script>

<template>
    <div class="sf-media-object">
        <p v-if="subject" class="sf-media-object__subject">
            <a v-if="subject.href" :href="subject.href">{{ subject.label }}</a>
            <template v-else>{{ subject.label }}</template>
        </p>

        <p v-if="payload.content" class="sf-prose">{{ payload.content }}</p>

        <FeedMedia v-if="picture" :image="picture" />

        <p v-for="(file, i) in payload.attachments ?? []" :key="i" class="sf-file">
            <a :href="file.href">{{ file.name ?? file.href }}</a>
            <span v-if="file.mediaType"> · {{ file.mediaType }}</span>
        </p>

        <p v-if="footnote" class="sf-media-object__footnote">
            <a v-if="footnote.href" :href="footnote.href">{{ footnote.label }}</a>
            <template v-else>{{ footnote.label }}</template>
        </p>
    </div>
</template>
