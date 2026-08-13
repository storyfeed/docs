import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import './custom.css'

// Default theme plus brand tokens. When the splash site and storyfeed/ui exist,
// the shared pieces (header, footer, palette) can move into components imported
// here — VitePress is Vue 3, so those files can be the same ones the Laravel
// app uses, provided they take props and avoid Inertia's Link/usePage.
export default {
  extends: DefaultTheme,
} satisfies Theme
