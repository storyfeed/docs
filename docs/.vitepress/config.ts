import { defineConfig } from 'vitepress'

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

  sitemap: {
    hostname: 'https://docs.storyfeed.dev',
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico', sizes: 'any' }],
    ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
    ['meta', { name: 'theme-color', content: '#0f172a' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

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
        text: 'Getting started',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Anatomy of an activity stream', link: '/guide/anatomy' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Your first feed', link: '/guide/quickstart' },
          { text: 'Upgrading', link: '/guide/upgrading' },
        ],
      },
      {
        // Order follows the order of NEED, matching the quickstart: a model
        // must be feedable before recording it is useful. Recording a
        // non-Feedable object does not error — it produces an activity whose
        // entity never snapshots — so the wrong order fails silently.
        text: 'The basics',
        items: [
          { text: 'Feedable models', link: '/basics/feedable-models' },
          { text: 'Verbs', link: '/basics/verbs' },
          { text: 'Story classes', link: '/basics/stories' },
          { text: 'Recording activities', link: '/basics/recording' },
          { text: 'Reading feeds', link: '/basics/reading' },
          { text: 'Rendering', link: '/basics/rendering' },
          { text: 'A live renderer', link: '/basics/live-renderer' },
        ],
      },
      {
        text: 'Digging deeper',
        items: [
          { text: 'Aggregation', link: '/deeper/aggregation' },
          { text: 'Grammar', link: '/deeper/grammar' },
          { text: 'Composites', link: '/deeper/composites' },
          { text: 'Publishing from events', link: '/deeper/events' },
          { text: 'Containers & context', link: '/deeper/context' },
          { text: 'Parties & anonymous actors', link: '/deeper/parties' },
          { text: 'Activity Streams 2.0', link: '/deeper/activity-streams' },
          { text: 'Testing', link: '/deeper/testing' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'The payload contract', link: '/reference/payload' },
          { text: 'Configuration', link: '/reference/configuration' },
          { text: 'Commands', link: '/reference/commands' },
          { text: 'Doctor', link: '/reference/doctor' },
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
