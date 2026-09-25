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
      // Strip before code-group titles are read too: a memo may contain [brackets].
      md.core.ruler.push('code-memo', (state) => {
        for (const token of state.tokens) {
          if (token.type !== 'fence') continue
          const start = /(?:^|\s)memo=/.exec(token.info)
          if (!start) continue
          const value = /^memo="([^"]*)"(?=\s|$)/.exec(token.info.slice(start.index).trimStart())
          if (!value || !value[1].trim()) {
            throw new Error('Code memo requires a non-empty, double-quoted value: memo="…"')
          }
          token.meta = { ...token.meta, memo: value[1] }
          token.info = token.info.slice(0, start.index) + token.info.slice(start.index).replace(/^(\s*)memo="[^"]*"/, '$1')
          if (/(?:^|\s)memo=/.test(token.info)) throw new Error('Only one memo is allowed per code block')
        }
      })

      const fence = md.renderer.rules.fence!
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const memo = tokens[idx].meta?.memo
        const html = fence(tokens, idx, options, env, self)
        if (memo === undefined) return html
        // Keep button → language → pre siblings intact for VitePress's copy handler.
        return html.replace(/^(<div class="[^"]*)"([^>]*>)/,
          (_, opening, closing) => `${opening} sf-code-memo"${closing}<div class="sf-code-memo__bar" v-pre>${md.utils.escapeHtml(memo)}</div>`)
      }

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
        // Laravel's order: set up, get it working, then see what it can do.
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Quickstart', link: '/guide/quickstart' },
          { text: 'Usage Examples', link: '/guide/usage-examples' },
        ],
      },
      {
        // Definitions before publishing, as Routing comes before Controllers.
        text: 'The Basics',
        items: [
          { text: 'Feedable Models', link: '/basics/feedable-models' },
          { text: 'The Feed File', link: '/basics/the-feed-file' },
          { text: 'Recording Activities', link: '/basics/recording' },
          { text: 'Activity Verbs', link: '/basics/verbs' },
          { text: 'Activity Content', link: '/basics/activity-content' },
        ],
      },
      {
        // Choose the feed, then inspect it, then draw it.
        text: 'Reading and Rendering',
        items: [
          { text: 'Reading Feeds', link: '/basics/reading' },
          { text: 'Named Feeds', link: '/basics/named-feeds' },
          { text: 'Latest Activity per Object', link: '/deeper/latest-per-object' },
          { text: 'The Payload', link: '/basics/the-payload' },
          { text: 'Anatomy of a Row', link: '/basics/anatomy-of-a-row' },
          { text: 'Rendering', link: '/basics/rendering' },
        ],
      },
      {
        // Grouped by capability family, as Laravel's Digging Deeper is.
        text: 'Digging Deeper',
        items: [
          { text: 'Story Classes', link: '/deeper/stories' },
          { text: 'Named Stories', link: '/deeper/named-stories' },
          { text: 'Constraining Roles', link: '/deeper/constraining-roles' },
          { text: 'Story Middleware & Batching', link: '/deeper/story-middleware-and-batching' },
          { text: 'Publishing From Events', link: '/deeper/events' },
          { text: 'Parties & Anonymous Actors', link: '/deeper/parties' },
          { text: 'Containers & Context', link: '/deeper/context' },
          { text: 'Activity Scopes', link: '/deeper/activity-scopes' },
          { text: 'Queued Publishing', link: '/deeper/queues' },
          { text: 'Keeping the Latest Activity', link: '/deeper/keeping-the-latest-activity' },
          { text: 'Aggregation', link: '/deeper/aggregation' },
          { text: 'Grouping Periods', link: '/deeper/grouping-periods' },
          { text: 'Composites', link: '/deeper/composites' },
          { text: 'Activity Body Content', link: '/deeper/body' },
          { text: 'Localization', link: '/deeper/localization' },
          { text: 'Activity Streams 2.0', link: '/deeper/activity-streams' },
        ],
      },
      {
        // Keeping a feed correct over time.
        text: 'Testing and Maintenance',
        items: [
          { text: 'Testing', link: '/deeper/testing' },
          { text: 'Doctor', link: '/reference/doctor' },
          { text: 'Deleted Models', link: '/deeper/deleted-models' },
          { text: 'Retention', link: '/deeper/retention' },
          { text: 'Healing a Feed', link: '/deeper/healing' },
        ],
      },
      {
        // Application recipes, in the order a reader meets the problem.
        text: 'Cookbook',
        items: [
          { text: 'Composing a Coherent Activity', link: '/cookbook/read-the-fields-back' },
          { text: 'Choosing a Verb', link: '/cookbook/choosing-a-verb' },
          { text: 'Choosing When to Publish', link: '/cookbook/choosing-when-to-publish' },
          { text: 'Choosing What Not to Record', link: '/cookbook/choosing-what-not-to-record' },
          { text: 'Repeating Activities', link: '/cookbook/repeating-activities' },
          { text: 'Recording Deletions', link: '/cookbook/activities-about-deletions' },
          { text: 'Activities Without an Actor', link: '/cookbook/activities-without-an-actor' },
          { text: 'Recording an Authoriser', link: '/cookbook/an-authoriser-who-is-not-an-actor' },
          { text: 'Headlines for Grouped Activities', link: '/cookbook/grouped-headlines' },
          { text: 'Keeping Verbs and Grammar Together', link: '/cookbook/verbs-and-grammar-together' },
          { text: 'Counts That Keep Changing', link: '/cookbook/counts-that-keep-moving' },
        ],
      },
      {
        // What you type, then the shapes, then policy.
        text: 'Reference',
        items: [
          { text: 'Configuration', link: '/reference/configuration' },
          { text: 'Commands', link: '/reference/commands' },
          { text: 'Feedable API', link: '/reference/feedable' },
          { text: 'Verb Vocabulary', link: '/reference/verbs' },
          { text: 'The Payload Contract', link: '/reference/payload' },
          { text: 'Schema', link: '/reference/schema' },
          { text: 'Compatibility', link: '/reference/compatibility' },
          { text: 'Glossary', link: '/reference/glossary' },
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
