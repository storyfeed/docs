<script setup lang="ts">
import { computed } from 'vue'
import FeedMedia from './FeedMedia.vue'

/**
 * A collapsed group's sample of photographs.
 *
 * The tile count lives on the CONTAINER and the stylesheet turns it into
 * widths, because "fewer photos get bigger tiles" and "no row is left holding
 * a single tile" are both statements about a row. A per-tile class would be
 * the same fact written N times and able to disagree with itself.
 *
 * The overflow tile consumes a slot rather than adding one, so it is inside
 * the count. It is an empty tile with a number in it, never a badge stamped
 * over someone's picture.
 */
const props = defineProps<{ tiles: Array<Record<string, any>>; overflow?: number | null }>()

const count = computed(() => props.tiles.length + (props.overflow ? 1 : 0))
</script>

<template>
    <div v-if="tiles.length" class="sf-media-strip" :class="`sf-media-strip--tiles-${count}`">
        <FeedMedia v-for="(tile, i) in tiles" :key="i" :image="tile.image" :href="tile.href" />
        <div v-if="overflow" class="sf-media-strip__more">+{{ overflow }} more</div>
    </div>
</template>
