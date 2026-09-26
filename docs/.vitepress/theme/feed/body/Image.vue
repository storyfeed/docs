<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    payload: Record<string, any>
    entityMedia?: Record<string, any> | null
}>()
const caption = computed(() => typeof props.payload.caption === 'string' ? props.payload.caption : null)
const picture = computed(() => {
    const slot = props.payload.image ?? 'preview'
    return ['icon', 'preview', 'image'].includes(slot) ? props.entityMedia?.[slot] ?? null : null
})
const alt = computed(() => typeof props.payload.alt === 'string' ? props.payload.alt : caption.value ?? '')
</script>

<template>
    <figure v-if="picture?.src" class="sf-image">
        <img :src="picture.src" :alt="alt" :width="payload.width ?? picture.width" :height="payload.height ?? picture.height" loading="lazy" />
        <figcaption v-if="caption">{{ caption }}</figcaption>
    </figure>
</template>

<style scoped>
.sf-image { margin: 0; }
.sf-image img { display: block; max-width: 100%; border-radius: 0.5rem; }
.sf-image figcaption { margin-top: 0.5rem; font-size: 0.875rem; color: var(--vp-c-text-2); }
</style>
