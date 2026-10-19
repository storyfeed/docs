import { defineConfig } from 'vitepress'
import tailwindcss from '@tailwindcss/vite'
import { uiResolve, uiSource } from '../../scripts/ui-kit.mjs'

// R&D pages (docs/rnd/) are proposals written as if shipped, for review before
// any code exists. They show only on the local dev server: gitignored, left out
// of every build, and absent from the sidebar the llms script reads.
const rnd = process.argv.includes('dev')
import container from 'markdown-it-container'
import { createHighlighter } from 'shiki'
import { cpSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// Inline code's highlighter (see code_inline below), with VitePress's own
// colour replacements so a token matches the same token in a code block.
const INLINE_LANGS = ['css', 'attrs']
const inlineHighlighter = await createHighlighter({ themes: ['github-light', 'github-dark'], langs: ['css', 'html'] })
const colorReplacements = {
  'github-light': {
    '#959da5': '#6c676f', '#28a745': '#0e790b', '#b08800': '#846312', '#e36209': '#c13617',
    '#3192aa': '#05728b', '#d73a49': '#c62739', '#22863a': '#11782a', '#6a737d': '#62687b',
    '#1b7c83': '#06747a', '#0366d6': '#0663d0', '#cb2431': '#c82430',
  },
  'github-dark': { '#586069': '#5b93a3', '#6a737d': '#818e99', '#ea4a5a': '#ef5564', '#2188ff': '#268bf9' },
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  vite: {
    resolve: uiResolve,
    plugins: [uiSource, tailwindcss()],
  },
  title: 'Storyfeed',
  description: 'The activity feed pattern for Laravel — timeline and aggregated reads, W3C Activity Streams 2.0 serialization.',
  lang: 'en-US',

  // Served at the root of docs.storyfeed.dev, so no base path.
  base: '/',

  // GitHub Pages resolves /getting-started/installation → /getting-started/installation.html.
  cleanUrls: true,
  lastUpdated: true,

  // Second lock on the same door as .gitignore's `docs/briefs/`: internal lane
  // briefs sit inside the source root, so without this a committed one becomes
  // a page on docs.storyfeed.dev. Two mechanisms because one of them is a
  // convention somebody can defeat with `git add -f`.
  srcExclude: rnd ? ['briefs/**'] : ['briefs/**', 'rnd/**'],

  // Each page's plain-text copy, which llms.txt links to (scripts/llms.mjs).
  buildEnd({ outDir, srcDir }) {
    const copies = join(srcDir, '.vitepress/llms')
    if (existsSync(copies)) cpSync(copies, outDir, { recursive: true })
  },

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
       * Highlighted inline code: `.sf-feed { --sf-gap: 2rem; }`{css} runs the
       * span through Shiki with the code blocks' themes and colours.
       * `{attrs}` is for a component's attributes alone, `rail="activity"`,
       * which no grammar reads outside a tag: they are highlighted inside one
       * and the tag's tokens are dropped again. VitePress's own highlighter is
       * async and markdown-it's inline renderer is not, hence a second one.
       */
      const codeInline = md.renderer.rules.code_inline!
      md.renderer.rules.code_inline = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        const lang = INLINE_LANGS.find((name) => token.attrGet(name) !== null)
        if (!lang) return codeInline(tokens, idx, options, env, self)
        token.attrs = token.attrs!.filter(([name]) => name !== lang)
        const attrs = lang === 'attrs'
        const [line] = inlineHighlighter.codeToTokens(attrs ? `<a ${token.content}>` : token.content, {
          lang: attrs ? 'html' : lang, themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false, colorReplacements,
        }).tokens
        const kept = attrs ? line.slice(2, -1) : line
        if (attrs && (line[1]?.content !== 'a' || line.at(-1)?.content !== '>')) {
          throw new Error(`Inline attrs did not highlight as attributes: ${token.content}`)
        }
        // A space between attributes rides on the token before it: Vue drops
        // a whitespace-only span's text when the page compiles the template.
        const merged = kept.reduce((all, t) => {
          if (t.content.trim() !== '') all.push({ ...t })
          else if (all.length) all.at(-1)!.content += t.content
          return all
        }, [] as typeof kept)
        const spans = merged.map((t) => {
          const tokenStyles = Object.entries(t.htmlStyle ?? {}).map(([k, v]) => `${k}:${v}`).join(';')
          return `<span style="${tokenStyles}">${md.utils.escapeHtml(t.content)}</span>`
        })
        return `<code class="shiki sf-inline-code" v-pre>${spans.join('').replace(/^(<span[^>]*>)\s+/, '$1')}</code>`
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
      const HEADLESS_TITLE = 'Rendering the Feed'
      const HEADLESS_BODY =
        'Storyfeed serializes the feed as a structured payload, and your frontend chooses how to render it. Storyfeed UI supplies Blade, Vue and React components.'

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
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'author', content: 'Jasper Tey' }],
    ['meta', { property: 'article:author', content: 'Jasper Tey' }],
    ['meta', { property: 'article:publisher', content: 'Tey Labs' }],
    ['meta', { property: 'article:published_time', content: '2026-09-30T19:00:00-04:00' }],
    ['meta', { property: 'og:site_name', content: 'Storyfeed' }],
    ['meta', { property: 'og:image', content: 'https://docs.storyfeed.dev/og-image.jpg?v=tim10' }],
    ['meta', { property: 'og:image:type', content: 'image/jpeg' }],
    ['meta', { property: 'og:image:width', content: '2400' }],
    ['meta', { property: 'og:image:height', content: '1200' }],
    ['meta', { property: 'og:image:alt', content: 'The Storyfeed mark and lowercase wordmark above a quiet feed of Storyfeed milestones. Activity streams for Laravel.' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: 'https://docs.storyfeed.dev/og-image.jpg?v=tim10' }],
    ['link', { rel: 'icon', href: '/favicon.ico?v=tim08', sizes: 'any' }],
    ['link', { rel: 'icon', href: '/favicon.svg?v=tim08', type: 'image/svg+xml' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png?v=tim08' }],
    ['meta', { name: 'theme-color', content: '#0f172a' }],
  ],

  themeConfig: {
    logo: { light: '/logo-light.svg?v=tim09-text', dark: '/logo-dark.svg?v=tim09-text', alt: '' },
    siteTitle: 'storyfeed',

    // The trifecta convention: every site's chrome links the other two, same
    // order everywhere — storyfeed.dev pitches, this site teaches, the
    // Newsroom proves.
    nav: [
      { text: 'Guide', link: '/getting-started/introduction', activeMatch: '/getting-started/' },
      { text: 'storyfeed.dev', link: 'https://storyfeed.dev' },
      { text: 'Live demo', link: 'https://newsroom.storyfeed.dev' },
      { text: 'Sponsor', link: 'https://github.com/sponsors/storyfeed' },
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
      ...(rnd ? [{ text: 'R&D (local only)', items: [
        { text: 'Body Versions', link: '/rnd/body-versions' },
        { text: 'Autoconfig', link: '/rnd/autoconfig' },
      ] }] : []),
      {
        // Laravel's order: set up, get it working, then see what it can do.
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/getting-started/introduction' },
          { text: 'Installation', link: '/getting-started/installation' },
          { text: 'Quickstart', link: '/getting-started/quickstart' },
          { text: 'What You Can Build', link: '/getting-started/what-you-can-build' },
        ],
      },
      {
        // Record an activity first, then declare what it reads as: no page
        // leans on one further down.
        text: 'The Basics',
        items: [
          { text: 'Feedable Models', link: '/basics/feedable-models' },
          { text: 'Recording Activities', link: '/basics/recording-activities' },
          { text: 'The Feed File', link: '/basics/the-feed-file' },
          { text: 'Story Classes', link: '/basics/story-classes' },
          { text: 'Constraining Roles', link: '/basics/constraining-roles' },
          { text: 'Named Stories', link: '/basics/named-stories' },
          { text: 'Activity Verbs', link: '/basics/activity-verbs' },
          { text: 'Activity Content', link: '/basics/activity-content' },
          { text: 'Feed Media', link: '/basics/feed-media' },
        ],
      },
      {
        // Choose and retrieve the feed before using a rendering kit.
        text: 'Retrieving and Rendering',
        items: [
          { text: 'Retrieving Feeds', link: '/retrieving/retrieving-feeds' },
          { text: 'Composing Feeds', link: '/retrieving/composing-feeds' },
          { text: 'Named Feeds', link: '/retrieving/named-feeds' },
          { text: 'Feed Sources', link: '/retrieving/feed-sources' },
        ],
      },
      {
        text: 'Storyfeed UI',
        items: [
          { text: 'Installing the Kits', link: '/ui/installing-the-kits' },
          { text: 'Blade', link: '/ui/blade' },
          { text: 'Vue', link: '/ui/vue' },
          { text: 'React', link: '/ui/react' },
          { text: 'Customizing the Kits', link: '/ui/customizing-the-kits' },
          { text: 'Building Your Own Components', link: '/ui/building-your-own-components' },
          { text: 'Blade Components', link: '/ui/reference/blade-components' },
          { text: 'Vue Components', link: '/ui/reference/vue-components' },
          { text: 'React Components', link: '/ui/reference/react-components' },
          { text: 'Pages, Rails and Styles', link: '/ui/reference/pages-rails-and-styles' },
        ],
      },
      {
        // Who acted and where first, then the classes and pipeline that
        // build on them: no page leans on one further down.
        text: 'Recording in Depth',
        items: [
          { text: 'Parties & Anonymous Actors', link: '/recording/parties-and-anonymous-actors' },
          { text: 'Publishing From Events', link: '/recording/publishing-from-events' },
          { text: 'Publishing Story Classes', link: '/recording/publishing-story-classes' },
          { text: 'Containers & Context', link: '/recording/containers-and-context' },
          { text: 'Distant Relations', link: '/recording/distant-relations' },
          { text: 'Casting Activity Data', link: '/recording/casting-activity-data' },
          { text: 'Activity Scopes', link: '/recording/activity-scopes' },
          { text: 'Story Middleware', link: '/recording/story-middleware' },
          { text: 'Queued Publishing', link: '/recording/queued-publishing' },
        ],
      },
      {
        // How stored activities become the rows a feed shows, grouping first.
        text: 'Shaping the Feed',
        items: [
          { text: 'Aggregation', link: '/shaping/aggregation' },
          { text: 'Live Burst Windows', link: '/shaping/live-burst-windows' },
          { text: 'Batching Activities', link: '/shaping/batching-activities' },
          { text: 'Custom Axes', link: '/shaping/custom-axes' },
          { text: 'Keeping the Latest Activity', link: '/shaping/keeping-the-latest-activity' },
          { text: 'Composites', link: '/shaping/composites' },
          { text: 'Resolving Bodies When Retrieved', link: '/shaping/resolving-bodies-when-retrieved' },
          { text: 'Custom Body Types', link: '/shaping/custom-body-types' },
          { text: 'Localization', link: '/shaping/localization' },
          { text: 'Activity Streams 2.0', link: '/shaping/activity-streams' },
        ],
      },
      {
        // Keeping a feed correct over time.
        text: 'Testing and Maintenance',
        items: [
          { text: 'Testing', link: '/maintenance/testing' },
          { text: 'Updating Dependencies', link: '/maintenance/updating-dependencies' },
          { text: 'Diagnosing Your Feed', link: '/maintenance/diagnosing-your-feed' },
          { text: 'Deleted Models', link: '/maintenance/deleted-models' },
          { text: 'Retention', link: '/maintenance/retention' },
          { text: 'Healing a Feed', link: '/maintenance/healing-a-feed' },
        ],
      },
      {
        text: 'Package Authors',
        items: [
          { text: 'Package Integration', link: '/packages/package-integration' },
        ],
      },
      {
        // Application recipes, in the order a reader meets the problem.
        text: 'Cookbook',
        items: [
          { text: 'Composing a Coherent Activity', link: '/cookbook/composing-a-coherent-activity' },
          { text: 'Recording Value Changes', link: '/cookbook/recording-value-changes' },
          { text: 'Choosing a Verb', link: '/cookbook/choosing-a-verb' },
          { text: 'Choosing When to Publish', link: '/cookbook/choosing-when-to-publish' },
          { text: 'Choosing to Record or Compose', link: '/cookbook/choosing-to-record-or-compose' },
          { text: 'Recording Deletions', link: '/cookbook/recording-deletions' },
          { text: 'Activities Without an Actor', link: '/cookbook/activities-without-an-actor' },
          { text: 'Recording Email Lifecycle Events', link: '/cookbook/recording-email-lifecycle-events' },
          { text: 'Keeping a Pulse Per Record', link: '/cookbook/keeping-a-pulse-per-record' },
          { text: 'Recording an Authoriser', link: '/cookbook/recording-an-authoriser' },
          { text: 'Recording Connected App Writes', link: '/cookbook/recording-connected-app-writes' },
          { text: 'Choosing What to Group', link: '/cookbook/choosing-what-to-group' },
          { text: 'Headlines for Grouped Activities', link: '/cookbook/headlines-for-grouped-activities' },
          { text: 'Naming Group Members From Activity Data', link: '/cookbook/naming-group-members-from-activity-data' },
          { text: 'Computed Values in the Feed', link: '/cookbook/computed-values-in-the-feed' },
        ],
      },
      {
        // What you type, then the shapes, then policy.
        text: 'Reference',
        items: [
          { text: 'Configuration', link: '/reference/configuration' },
          { text: 'Commands', link: '/reference/commands' },
          { text: 'Doctor Checks', link: '/reference/doctor-checks' },
          { text: 'Feedable API', link: '/reference/feedable-api' },
          { text: 'FeedItem API', link: '/reference/feed-item-api' },
          { text: 'Entry API', link: '/reference/entry-api' },
          { text: 'Verb Vocabulary', link: '/reference/verb-vocabulary' },
          { text: 'The Payload Contract', link: '/reference/payload-contract' },
          { text: 'Schema', link: '/reference/schema' },
          { text: 'Storage Architecture', link: '/reference/storage-architecture' },
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
      // The brand footer (teylabs/brand README): two lines, no ©.
      copyright: 'Storyfeed<br>Built by <a href="https://teylabs.com" target="_blank" rel="noopener">Tey Labs</a>.',
    },
  },
})
