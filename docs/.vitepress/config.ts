import { defineConfig } from 'vitepress'
import container from 'markdown-it-container'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Storyfeed',
  description: 'The activity feed pattern for Laravel — timeline and aggregated reads, W3C Activity Streams 2.0 serialization.',
  lang: 'en-US',

  // Served at the root of docs.storyfeed.dev, so no base path.
  base: '/',

  // GitHub Pages resolves /guide/installation → /guide/installation.html.
  cleanUrls: true,
  lastUpdated: true,

  // Second lock on the same door as .gitignore's `docs/briefs/`: internal lane
  // briefs sit inside the source root, so without this a committed one becomes
  // a page on docs.storyfeed.dev. Two mechanisms because one of them is a
  // convention somebody can defeat with `git add -f`.
  srcExclude: ['briefs/**'],

  markdown: {
    config(md) {
      /*
       * `::: headless` — one callout, one message, every word of it here. The
       * Quickstart introduces "headless" in prose; this box is the callback,
       * and it says the same thing wherever a reader meets it. A page writes
       * `::: headless` and `:::` and nothing else: anything after the name, or
       * a body written on the page, fails the build, because that is where a
       * second wording would start.
       *
       * A container rather than a Vue component, because house rule 9 allows
       * exactly one spelling of a callout and it is the container spelling.
       */
      const HEADLESS_TITLE = 'Storyfeed is headless: it has no views'
      const HEADLESS_BODY =
        'Storyfeed serializes the feed as a structured payload. Your frontend chooses how to render it to suit your application. Official Storyfeed UI components are currently in development.'

      md.use(container, 'headless', {
        render: (tokens: any[], idx: number) => {
          if (tokens[idx].nesting !== 1) return '</div>\n'

          const extra = tokens[idx].info.trim().slice('headless'.length).trim()

          if (extra !== '' || tokens[idx + 1]?.type !== 'container_headless_close') {
            throw new Error('::: headless takes no title and no body; both live in config.ts')
          }

          return `<div class="sf-headless custom-block"><p class="custom-block-title">${md.utils.escapeHtml(HEADLESS_TITLE)}</p><div class="sf-headless__body"><p>${md.renderInline(HEADLESS_BODY)}</p></div>`
        },
      })
    },
  },

  sitemap: {
    hostname: 'https://docs.storyfeed.dev',
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico', sizes: 'any' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
    ['meta', { name: 'theme-color', content: '#0f172a' }],
  ],

  themeConfig: {
    logo: { light: '/logo-light.svg', dark: '/logo-dark.svg' },

    // The trifecta convention: every site's chrome links the other two, same
    // order everywhere — storyfeed.dev pitches, this site teaches, the
    // Newsroom proves.
    nav: [
      { text: 'Guide', link: '/guide/introduction', activeMatch: '/guide/' },
      { text: 'storyfeed.dev', link: 'https://storyfeed.dev' },
      { text: 'Live demo', link: 'https://newsroom.storyfeed.dev' },
      {
        text: 'v0.x',
        items: [
          { text: 'Roadmap', link: 'https://github.com/storyfeed/storyfeed/blob/main/ROADMAP.md' },
          { text: 'Changelog', link: 'https://github.com/storyfeed/storyfeed/blob/main/CHANGELOG.md' },
        ],
      },
    ],

    // The whole spine, visible from any page: a reader should see the shape of
    // the documentation before deciding to trust it. Every entry resolves —
    // planned-but-unwritten pages live in IA.md, never here.
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Usage Examples', link: '/guide/usage-examples' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Quickstart', link: '/guide/quickstart' },
        ],
      },
      {
        // Feedable Models stays first: a model must be feedable before recording
        // does anything, and the failure is silent. After that, simple to complex:
        // the elementary act, then the typed layer over it, then reading and
        // drawing, then a second audience, then renderer-specific pages.
        text: 'The Basics',
        items: [
          { text: 'Feedable Models', link: '/basics/feedable-models' },
          { text: 'Recording Activities', link: '/basics/recording' },
          { text: 'Verbs', link: '/basics/verbs' },
          { text: 'Headlines', link: '/basics/headlines' },
          { text: 'What an Activity Shows', link: '/basics/activity-content' },
          { text: 'Reading Feeds', link: '/basics/reading' },
          { text: 'The Payload', link: '/basics/the-payload' },
          { text: 'Anatomy of a Row', link: '/basics/anatomy-of-a-row' },
          { text: 'Rendering', link: '/basics/rendering' },
          { text: 'Named Feeds', link: '/basics/named-feeds' },
        ],
      },
      {
        // Recording depth, then payload depth, then grouping, then operations.
        text: 'Digging Deeper',
        items: [
          { text: 'Publishing from Events', link: '/deeper/events' },
          { text: 'Containers & Context', link: '/deeper/context' },
          { text: 'Parties & Anonymous Actors', link: '/deeper/parties' },
          { text: 'Story Classes', link: '/deeper/stories' },
          { text: 'Activity Body Content', link: '/deeper/body' },
          { text: 'Aggregation', link: '/deeper/aggregation' },
          { text: 'Composites', link: '/deeper/composites' },
          { text: 'Queues', link: '/deeper/queues' },
          { text: 'Testing', link: '/deeper/testing' },
          { text: 'Activity Streams 2.0', link: '/deeper/activity-streams' },
          { text: 'Deleted Models', link: '/deeper/deleted-models' },
          { text: 'Retention', link: '/deeper/retention' },
          { text: 'Healing a Feed', link: '/deeper/healing' },
        ],
      },
      {
        // In the order a reader meets the problem.
        text: 'Cookbook',
        items: [
          { text: 'Composing a Coherent Activity', link: '/cookbook/read-the-fields-back' },
          { text: 'Choosing When to Publish', link: '/cookbook/choosing-when-to-publish' },
          { text: 'Choosing What Not to Record', link: '/cookbook/choosing-what-not-to-record' },
          { text: 'Repeating Activities', link: '/cookbook/repeating-activities' },
          { text: 'Recording Deletions', link: '/cookbook/activities-about-deletions' },
          { text: 'Activities Without an Actor', link: '/cookbook/activities-without-an-actor' },
          { text: 'Recording an Authoriser', link: '/cookbook/an-authoriser-who-is-not-an-actor' },
          { text: 'Headlines for Grouped Activities', link: '/cookbook/grouped-headlines' },
          { text: 'Choosing a Verb', link: '/cookbook/choosing-a-verb' },
          { text: 'Keeping Verbs and Grammar Together', link: '/cookbook/verbs-and-grammar-together' },
          { text: 'Counts That Keep Changing', link: '/cookbook/counts-that-keep-moving' },
        ],
      },
      {
        // Vocabulary, then what you type, then the shapes, then the policy pages.
        text: 'Reference',
        items: [
          { text: 'Glossary', link: '/reference/glossary' },
          { text: 'Configuration', link: '/reference/configuration' },
          { text: 'Commands', link: '/reference/commands' },
          { text: 'Verb Vocabulary', link: '/reference/verbs' },
          { text: 'Doctor', link: '/reference/doctor' },
          { text: 'Feedable API', link: '/reference/feedable' },
          { text: 'The Payload Contract', link: '/reference/payload' },
          { text: 'Schema', link: '/reference/schema' },
          { text: 'Compatibility', link: '/reference/compatibility' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/storyfeed/storyfeed' },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/storyfeed/docs/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    outline: 'deep',

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026–present <a href="https://teylabs.com">Tey Labs</a>',
    },
  },
})
