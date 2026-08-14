import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import FeedActivity from './components/FeedActivity.vue'
import FeedStream from './components/FeedStream.vue'
import './custom.css'

// Default theme plus brand tokens and the feed widgets.
//
// The widgets are registered globally so any page can show a feed without an
// import block. They render a headline TEMPLATE with its tokens substituted —
// the same mechanism a real renderer uses — so a documented example cannot
// disagree with its own slot mapping.
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('FeedActivity', FeedActivity)
    app.component('FeedStream', FeedStream)
  },
} satisfies Theme
