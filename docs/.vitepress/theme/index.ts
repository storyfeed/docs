import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import FeedStream from './feed/FeedStream.vue'
import FeedNode from './feed/FeedNode.vue'
import SlotMapping from './components/SlotMapping.vue'
import FeedBody from './components/FeedBody.vue'
import Annotation from './components/Annotation.vue'
import { FEED_NOW } from './feed/keys'
import './feed/feed.css'
import './custom.css'

/**
 * A fixed reference point for relative times.
 *
 * Every page here is prerendered against static sample payloads, so without
 * this a build would bake "2h ago" into the HTML and the phrase would drift
 * further from the truth every day the site was not rebuilt. Pinning it also
 * stops the ticking timer from ever starting.
 *
 * This instant is the one the sample payloads were captured against.
 */
const DOCS_NOW = Date.parse('2026-08-14T15:00:00Z')

// The feed widgets are the demo app's own renderer, ported (see feed/README.md).
// Registered globally so any page can show a feed without an import block, and
// node-shaped: `:items` takes payload nodes verbatim, so a documented example
// and the payload contract cannot drift apart.
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('FeedStream', FeedStream)
    app.component('FeedNode', FeedNode)
    app.component('SlotMapping', SlotMapping)
    app.component('FeedBody', FeedBody)
    app.component('Annotation', Annotation)
    app.provide(FEED_NOW, DOCS_NOW)
  },
} satisfies Theme
