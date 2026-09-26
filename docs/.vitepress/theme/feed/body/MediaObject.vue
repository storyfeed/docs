<script setup lang="ts">
import { computed, inject } from 'vue'
import { FEED_LINK } from '../keys'
import FeedMedia from '../FeedMedia.vue'

/**
 * `Storyfeed/Body/MediaObject` — the shape of a post: a title line, some
 * prose, one picture, the files it names, and a line of small print.
 *
 * THE DETAIL STORES NO IMAGE. `image` is a slot NAME — icon, preview or image
 * — and the picture is the entity's media for that slot, minted at read time.
 * A row recorded under an old thumbnail conversion draws the current one, and
 * a slot the resolver left empty draws no picture and no placeholder.
 *
 * A supplied subject is always shown. A link without an href uses the owning
 * entity's current URL; a plain string remains unlinked.
 */
const props = defineProps<{
    payload: Record<string, any>
    entityLabel?: string | null
    entityUrl?: string | null
    entityMedia?: Record<string, any> | null
}>()

const linkComponent = inject(FEED_LINK, 'a')

const subject = computed(() => {
    const value = props.payload.subject
    const label = typeof value === 'string' ? value : value?.label

    return label ? { label, href: typeof value === 'string' ? null : value.href ?? props.entityUrl ?? null } : null
})

const files = computed(() => {
    const listed = 'files' in props.payload ? props.payload.files
        : (props.payload.$v ?? 1) < 2 ? props.payload.attachments : []
    return Array.isArray(listed) ? listed : []
})

const picture = computed(() =>
    ['icon', 'preview', 'image'].includes(props.payload.image) ? (props.entityMedia?.[props.payload.image] ?? null) : null,
)

const footnote = computed(() => {
    const value = props.payload.footnote

    return typeof value === 'string' ? { label: value, href: null }
        : value ? { label: value.label, href: value.href ?? props.entityUrl ?? null } : null
})
</script>

<template>
    <div class="sf-media-object">
        <div v-if="picture" class="sf-media-object__image">
            <FeedMedia :image="picture" />
        </div>
        <div class="sf-media-object__body">
            <p v-if="subject" class="sf-media-object__subject">
                <component :is="linkComponent" v-if="subject.href" :href="subject.href">{{ subject.label }}</component>
                <template v-else>{{ subject.label }}</template>
            </p>

            <p v-if="payload.content" class="sf-prose sf-media-object__content">{{ payload.content }}</p>

            <ul v-if="files.length" class="sf-media-object__attachments">
            <li v-for="(file, i) in files ?? []" :key="i" class="sf-file">
                <component :is="linkComponent" :href="file.href">{{ file.name ?? file.href }}</component>
                <span v-if="file.mediaType"> · {{ file.mediaType }}</span>
            </li>
            </ul>

            <p v-if="footnote" class="sf-media-object__footnote">
                <component :is="linkComponent" v-if="footnote.href" :href="footnote.href">{{ footnote.label }}</component>
                <template v-else>{{ footnote.label }}</template>
            </p>
        </div>
    </div>
</template>
