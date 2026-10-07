<script setup lang="ts">
import { Comment, Fragment, Text, computed, useSlots } from 'vue';
import type { VNode } from 'vue';

import EntityLink from './EntityLink.vue';
import { leftoverRoles } from './meta';
import type { FeedNode } from './types';
const props = defineProps<{
    node: FeedNode;
    templates: (string | null | undefined)[];
}>();
const slots = useSlots();
function hasContent(nodes: VNode[]): boolean {
    return nodes.some((node) => {
        if (node.type === Comment) {
            return false;
        }

        if (node.type === Fragment || typeof node.type === 'string') {
            return Array.isArray(node.children)
                ? hasContent(node.children as VNode[])
                : Boolean(node.children);
        }

        if (node.type === Text) {
            return Boolean(String(node.children ?? '').trim());
        }

        return true;
    });
}
const roles = computed(() => leftoverRoles(props.node, props.templates));
</script>

<template>
    <div
        v-if="roles.length || hasContent(slots.default?.() ?? [])"
        class="sf-meta"
    >
        <slot v-if="hasContent(slots.default?.() ?? [])" />
        <template v-for="part in roles" :key="part.role">
            {{ ' · '
            }}<span class="sf-meta__role"
                >{{ part.word + ' '
                }}<template
                    v-for="(entity, index) in part.entities"
                    :key="entity.id"
                    ><EntityLink :entity="entity" /><template
                        v-if="
                            part.overflow === 0 &&
                            index === part.entities.length - 2
                        "
                    >
                        and </template
                    ><template v-else-if="index < part.entities.length - 1"
                        >,
                    </template></template
                ><template v-if="part.overflow > 0">
                    and {{ part.overflow }} more</template
                ></span
            >
        </template>
    </div>
</template>
