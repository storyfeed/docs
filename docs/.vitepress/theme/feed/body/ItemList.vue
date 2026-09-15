<script setup lang="ts">
import { computed, inject } from 'vue'
import { FEED_LINK } from '../keys'

/**
 * `Storyfeed/Body/ItemList` — several things, each a name and maybe a link.
 *
 * An item is a string or a link, stored as the union rather than flattened,
 * because text that leads nowhere and text that leads somewhere are different
 * facts. `ordered` says whether the sequence carries meaning; the numbering
 * is this renderer's answer to that fact, not an instruction from the payload.
 *
 * HOW MANY TO SHOW IS NOT IN THE PAYLOAD and never will be — a threshold
 * depends on the viewport, which a server cannot know. `totalItems` says how
 * many exist when more were not sent, and `more` is where those live.
 */
const props = defineProps<{ payload: Record<string, any> }>()

const linkComponent = inject(FEED_LINK, 'a')

const items = computed(() => (props.payload.items ?? []).filter(Boolean))
const remaining = computed(() => {
    const total = props.payload.totalItems
    return typeof total === 'number' ? Math.max(total - items.value.length, 0) : 0
})
</script>

<template>
    <figure v-if="items.length" class="sf-list-block">
        <figcaption v-if="payload.title" class="sf-list__title">{{ payload.title }}</figcaption>

        <component :is="payload.ordered ? 'ol' : 'ul'" class="sf-list">
            <li v-for="(item, index) in items" :key="index" class="sf-list__item">
                <component
                    :is="linkComponent"
                    v-if="typeof item !== 'string' && item.href"
                    :href="item.href"
                    class="sf-entity"
                >{{ item.label }}</component>
                <template v-else>{{ typeof item === 'string' ? item : item.label }}</template>
            </li>
        </component>

        <figcaption v-if="remaining || payload.more" class="sf-list__more">
            <span v-if="remaining">{{ remaining }} more</span>
            <component
                :is="linkComponent"
                v-if="payload.more"
                :href="payload.more.href"
                class="sf-entity"
            >{{ payload.more.label }}</component>
        </figcaption>
    </figure>
</template>
