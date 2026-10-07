import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import FeedStream from '@storyfeed/ui/FeedStream.vue'
import FeedNode from '@storyfeed/ui/FeedNode.vue'
import SlotMapping from './components/SlotMapping.vue'
import Annotation from './components/Annotation.vue'
import StabilityBanner from './components/StabilityBanner.vue'
import BodyPlaceholder from './components/BodyPlaceholder.vue'
import FeedExample from './components/FeedExample.vue'
import SampleLink from './components/SampleLink.vue'
import { FEED_LINK, FEED_NOW, FEED_COMPONENTS } from '@storyfeed/ui/keys'
import { WORLD_ANCHOR } from './world'
import { BODIES } from './bodies'
import './tailwind.css'
import './custom.css'

/**
 * A fixed reference point for relative times.
 *
 * Every page here is prerendered against static sample payloads, so without
 * this a build would bake "2h ago" into the HTML and the phrase would drift
 * further from the truth every day the site was not rebuilt. Pinning it also
 * stops the ticking timer from ever starting.
 *
 * It is the world's present anchor (see world.ts): the Fourth of July, 1985,
 * in Hawkins, unless the anchor is set to another moment.
 */
const DOCS_NOW = WORLD_ANCHOR

// Feed widgets come from the shared Storyfeed UI kit through the Vite alias.
// Registered globally so any page can show a feed without an import block, and
// node-shaped: `:items` takes payload nodes verbatim, so a documented example
// and the payload contract cannot drift apart.
export default {
  extends: DefaultTheme,
  // The pre-1.0 notice rides in `layout-top`, above the nav, so it is on every
  // route rather than only on the pages a reader enters through.
  Layout: () => h(DefaultTheme.Layout, null, {
    'layout-top': () => h(StabilityBanner),
  }),
  enhanceApp({ app }) {
    app.component('FeedStream', FeedStream)
    app.component('FeedNode', FeedNode)
    app.component('SlotMapping', SlotMapping)
    app.component('Annotation', Annotation)
    app.component('BodyPlaceholder', BodyPlaceholder)
    app.component('FeedExample', FeedExample)
    app.provide(FEED_NOW, DOCS_NOW)
    app.provide(FEED_COMPONENTS, BODIES)
    // Sample URLs are real-looking and this site has no such routes, so an
    // entity keeps a link's appearance and loses its destination. See the
    // component for why the URL still matters.
    app.provide(FEED_LINK, SampleLink)
  },
} satisfies Theme
