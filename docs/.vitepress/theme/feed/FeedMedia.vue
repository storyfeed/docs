<script setup lang="ts">
/**
 * One picture, at the feed's scale.
 *
 * The image object is core's `FeedImage`, minted by the resolver at READ time,
 * so the src is current however old the row is. `width` and `height` are
 * advisory: they reserve the box before the bytes arrive, which is what stops
 * a feed jumping as photos load.
 *
 * A tile in a group's strip is the other caller, and it differs in one way: a
 * tile stands for an entity and keeps that entity's link, where a row's own
 * picture does not navigate — the payload's `entity.url` for a photo IS the
 * full file, so tapping one would leave the feed for a raw image.
 */
import { inject } from 'vue'
import { FEED_LINK } from './keys'

defineProps<{ image: Record<string, any>; href?: string | null }>()

// The same seam an entity link uses, so a docs page can make a tile inert and
// an app can hand it a router component.
const linkComponent = inject(FEED_LINK, 'a')
</script>

<template>
    <component
        :is="href ? linkComponent : 'div'"
        :href="href || undefined"
        class="sf-media"
        :style="image.width && image.height ? { aspectRatio: `${image.width} / ${image.height}` } : undefined"
    >
        <img :src="image.src" :alt="image.alt ?? ''" loading="lazy" />
    </component>
</template>
