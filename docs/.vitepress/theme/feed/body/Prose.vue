<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

/** Parse recognised formats only. Verbatim always preserves escaped source. */
const props = defineProps<{ payload: Record<string, any> }>()
const markdown = new MarkdownIt({ html: false })
const rich = computed(() => !props.payload.verbatim && ['text/markdown', 'text/html'].includes(props.payload.mediaType))
const rendered = computed(() => {
    if (!rich.value) return ''
    const source = props.payload.content ?? ''
    return sanitizeHtml(props.payload.mediaType === 'text/markdown' ? markdown.render(source) : source, {
        allowedTags: ['p', 'br', 'strong', 'em', 's', 'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code', 'a', 'hr'],
        allowedAttributes: { a: ['href', 'title'], ol: ['start'] },
        allowedSchemes: ['http', 'https', 'mailto'],
        allowProtocolRelative: false,
    })
})
</script>

<template>
    <figure v-if="payload.content" class="sf-prose-block" :class="{ 'sf-prose-block--verbatim': payload.verbatim }">
        <figcaption v-if="payload.title" class="sf-prose__title">{{ payload.title }}</figcaption>
        <pre v-if="payload.verbatim" class="sf-verbatim" tabindex="0"><code>{{ payload.content }}</code></pre>
        <div v-else-if="rich" class="sf-rich-text" tabindex="0" v-html="rendered" />
        <p v-else class="sf-prose sf-prose--scroll" tabindex="0">{{ payload.content }}</p>
    </figure>
</template>
