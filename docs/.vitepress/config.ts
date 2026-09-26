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
       * Code block memo: `memo="app/Providers/AppServiceProvider.php"` names
       * where the snippet lives, and `at="boot()"` says where in that file,
       * drawn after the path as `path → boot()`. `at` needs a `memo`. Both are
       * stripped before code-group titles are read, since a memo may contain
       * [brackets].
       */
      const takeAttribute = (token: any, name: string): string | undefined => {
        const start = new RegExp(`(?:^|\\s)${name}=`).exec(token.info)
        if (!start) return undefined
        const value = new RegExp(`^${name}="([^"]*)"(?=\\s|$)`).exec(token.info.slice(start.index).trimStart())
        if (!value || !value[1].trim()) {
          throw new Error(`Code ${name} requires a non-empty, double-quoted value: ${name}="…"`)
        }
        token.info = token.info.slice(0, start.index) + token.info.slice(start.index).replace(new RegExp(`^(\\s*)${name}="[^"]*"`), '$1')
        if (new RegExp(`(?:^|\\s)${name}=`).test(token.info)) throw new Error(`Only one ${name} is allowed per code block`)
        return value[1]
      }

      md.core.ruler.push('code-memo', (state) => {
        for (const token of state.tokens) {
          if (token.type !== 'fence') continue
          const memo = takeAttribute(token, 'memo')
          const at = takeAttribute(token, 'at')
          if (at !== undefined && memo === undefined) throw new Error('Code at="…" needs a memo="…" to sit beside')
          if (memo !== undefined) token.meta = { ...token.meta, memo, at }
        }

        // A code group whose tabs all carry the same memo shows it once, above
        // the tabs: it's one file written two ways. Different memos stay per tab.
        const tokens = state.tokens
        for (let i = 0; i < tokens.length; i++) {
          if (tokens[i].type !== 'container_code-group_open') continue
          const fences = []
          for (let j = i + 1; j < tokens.length && tokens[j].type !== 'container_code-group_close'; j++) {
            if (tokens[j].type === 'fence') fences.push(tokens[j])
          }
          const first = fences[0]?.meta?.memo
          const same = first !== undefined && fences.every((f) => f.meta?.memo === first && f.meta?.at === fences[0].meta?.at)
          if (!same) continue
          tokens[i].meta = { ...tokens[i].meta, memo: first, at: fences[0].meta.at }
          for (const f of fences) f.meta = { ...f.meta, memo: undefined, at: undefined }
        }
      })

      const memoBar = (memo: string, at?: string) =>
        `<div class="sf-code-memo__bar" v-pre><span class="sf-code-memo__file">${md.utils.escapeHtml(memo)}</span>`
        + (at ? `<span class="sf-code-memo__at">${md.utils.escapeHtml(at)}</span>` : '')
        + '</div>'

      const groupOpen = md.renderer.rules['container_code-group_open']!
      md.renderer.rules['container_code-group_open'] = (tokens, idx, options, env, self) => {
        const html = groupOpen(tokens, idx, options, env, self)
        const { memo, at } = tokens[idx].meta ?? {}
        if (memo === undefined) return html
        return html.replace('<div class="vp-code-group">', `<div class="vp-code-group sf-code-memo-group">${memoBar(memo, at)}`)
      }

      const fence = md.renderer.rules.fence!
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const { memo, at } = tokens[idx].meta ?? {}
        const html = fence(tokens, idx, options, env, self)
        if (memo === undefined) return html
        // Keep button → language → pre siblings intact for VitePress's copy handler.
        return html.replace(/^(<div class="[^"]*)"([^>]*>)/,
          (_, opening, closing) => `${opening} sf-code-memo"${closing}${memoBar(memo, at)}`)
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
        'Storyfeed serializes the feed as a structured payload, and your frontend chooses how to render it. For Blade, Storyfeed UI renders it with one component.'

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
          { text: 'What You Can Build', link: '/guide/usage-examples' },
        ],
      },
      {
        // Record an activity first, then declare what it reads as: no page
        // leans on one further down.
        text: 'The Basics',
        items: [
          { text: 'Feedable Models', link: '/basics/feedable-models' },
          { text: 'Recording Activities', link: '/basics/recording' },
          { text: 'The Feed File', link: '/basics/the-feed-file' },
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
          { text: 'The Payload', link: '/basics/the-payload' },
          { text: 'Rendering', link: '/basics/rendering' },
        ],
      },
      {
        // Who acted and where first, then the classes and pipeline that
        // build on them: no page leans on one further down.
        text: 'Recording in Depth',
        items: [
          { text: 'Parties & Anonymous Actors', link: '/deeper/parties' },
          { text: 'Publishing From Events', link: '/deeper/events' },
          { text: 'Containers & Context', link: '/deeper/context' },
          { text: 'Casting Activity Data', link: '/deeper/casting-activity-data' },
          { text: 'Activity Scopes', link: '/deeper/activity-scopes' },
          { text: 'Story Classes', link: '/deeper/stories' },
          { text: 'Constraining Roles', link: '/deeper/constraining-roles' },
          { text: 'Story Middleware & Batching', link: '/deeper/story-middleware-and-batching' },
          { text: 'Named Stories', link: '/deeper/named-stories' },
          { text: 'Queued Publishing', link: '/deeper/queues' },
        ],
      },
      {
        // How stored activities become the rows a feed shows, grouping first.
        text: 'Shaping the Feed',
        items: [
          { text: 'Aggregation', link: '/deeper/aggregation' },
          { text: 'Grouping Periods', link: '/deeper/grouping-periods' },
          { text: 'Keeping the Latest Activity', link: '/deeper/keeping-the-latest-activity' },
          { text: 'Composites', link: '/deeper/composites' },
          { text: 'Custom Body Types', link: '/deeper/body' },
          { text: 'Localization', link: '/deeper/localization' },
          { text: 'Activity Streams 2.0', link: '/deeper/activity-streams' },
        ],
      },
      {
        // Keeping a feed correct over time.
        text: 'Testing and Maintenance',
        items: [
          { text: 'Testing', link: '/deeper/testing' },
          { text: 'Diagnosing Your Feed', link: '/deeper/diagnosing' },
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
          { text: 'Computed Values in the Feed', link: '/cookbook/computed-values' },
        ],
      },
      {
        // What you type, then the shapes, then policy.
        text: 'Reference',
        items: [
          { text: 'Configuration', link: '/reference/configuration' },
          { text: 'Commands', link: '/reference/commands' },
          { text: 'Doctor Checks', link: '/reference/doctor' },
          { text: 'Feedable API', link: '/reference/feedable' },
          { text: 'FeedItem API', link: '/reference/feed-item' },
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
