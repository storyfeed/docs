<script setup lang="ts">
import { computed } from 'vue';
import EntityLink from './EntityLink.vue';
import { leftoverRoles } from './meta';
import type { FeedNode } from './types';
const props = defineProps<{ node: FeedNode; templates: (string | null | undefined)[] }>();
const roles = computed(() => leftoverRoles(props.node, props.templates));
</script>

<template>
    <div class="sf-meta">
        <slot />
        <template v-for="part in roles" :key="part.role">
            {{ ' · ' }}<span class="sf-meta__role">{{ part.word + ' ' }}<template v-for="(entity, index) in part.entities" :key="entity.id"><EntityLink :entity="entity" /><template v-if="part.overflow === 0 && index === part.entities.length - 2"> and </template><template v-else-if="index < part.entities.length - 1">, </template></template><template v-if="part.overflow > 0"> and {{ part.overflow }} more</template></span>
        </template>
    </div>
</template>
