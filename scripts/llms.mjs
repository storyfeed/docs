#!/usr/bin/env node
/**
 * Generates /llms.txt and /llms-full.txt from the docs source.
 *
 * Runs as part of `npm run build`, BEFORE VitePress, so the files land in
 * docs/public and get copied into dist. They are gitignored on purpose: a
 * committed copy is a copy that goes stale the first time someone edits a page
 * without building, and this project has spent enough of one week on documents
 * that were true when written.
 *
 * The hard part is honesty about what markdown cannot carry. These pages embed
 * live Vue components — <FeedStream> renders a real payload through the real
 * renderer, 28 times across the site, and it is doing the demonstrating rather
 * than decorating. Stripping those silently would hand a reader prose that
 * refers to something they cannot see. So each one becomes a visible marker
 * naming what was there and where to look at it.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const docs = join(root, 'docs')
const site = 'https://docs.storyfeed.dev'

/** Sidebar order, so the export reads the way the site is meant to be read. */
const config = readFileSync(join(docs, '.vitepress/config.ts'), 'utf8')
const sidebar = config.slice(config.indexOf('sidebar'))
// `index` is a meta-refresh stub to /guide/introduction, not a page. Skipping it
// deliberately: an entry whose summary is its own frontmatter helps nobody.
const routes = [...new Set(
  [...sidebar.matchAll(/'(\/[a-z0-9/-]+)'/g)]
    .map((m) => m[1].replace(/^\//, ''))
    .filter((r) => r && !r.includes('#') && existsSync(join(docs, r + '.md'))),
)]

const COMPONENTS = 'FeedStream|FeedNode|FeedBody|SlotMapping|Annotation'

const clean = (raw, route) => {
  let s = raw
    // YAML frontmatter, and build machinery — neither is content.
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(/<script setup>[\s\S]*?<\/script>\s*/g, '')

  // Live components: name what is missing rather than deleting the evidence.
  // Looped because they nest — <Annotation><SlotMapping/></Annotation> — and a
  // single pass rewrites the inner one and leaves the outer tags as litter.
  for (let i = 0; i < 5; i++) {
    const before = s
    s = s
      .replace(new RegExp(`<(${COMPONENTS})\\b[^>]*?/>`, 'g'),
        (_m, tag) => `> [${tag}: a live rendered sample, viewable at ${site}/${route}]`)
      .replace(new RegExp(`<(${COMPONENTS})\\b[^>]*>([\\s\\S]*?)</\\1>`, 'g'),
        (_m, tag, inner) => `> [${tag}: a live rendered sample, viewable at ${site}/${route}]\n${inner.trim()}`)
    if (s === before) break
  }

  return s
    .replace(/^::: ?(tip|warning|danger|info)\s*(.*)$/gm,
      (_m, kind, rest) => `> **${kind[0].toUpperCase() + kind.slice(1)}${rest ? ': ' + rest : ''}**`)
    .replace(/^:::\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const pages = routes.map((route) => {
  const body = clean(readFileSync(join(docs, route + '.md'), 'utf8'), route)
  const title = (body.match(/^#\s+(.+)$/m) || [, route])[1].trim()
  const summary = (body
    .replace(/^#\s+.+$/m, '')
    .split('\n\n')
    .map((s) => s.trim())
    .find((s) => s && !s.startsWith('#') && !s.startsWith('```') && !s.startsWith('>') && !s.startsWith('|')) || '')
    .replace(/\s+/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*`]/g, '')
    .slice(0, 180)
  return { route, title, summary, body }
})

const preamble = `> Storyfeed is an activity-feed package for Laravel: timeline and aggregated
> reads from one payload contract, with W3C Activity Streams 2.0 at the
> serialization boundary. Pre-1.0 — the API can change without a deprecation
> cycle.
>
> Generated from the docs source. Pages embed live Vue components that render
> real payloads through the real renderer; those cannot be carried in plain
> text and appear here as bracketed markers naming what is missing and where to
> see it.`

const index = `# Storyfeed\n\n${preamble}\n\n` +
  Object.entries(pages.reduce((acc, p) => {
    const section = p.route.includes('/') ? p.route.split('/')[0] : 'Home'
    ;(acc[section] ||= []).push(p)
    return acc
  }, {})).map(([section, ps]) =>
    `## ${section[0].toUpperCase() + section.slice(1)}\n\n` +
    ps.map((p) => `- [${p.title}](${site}/${p.route}.md)${p.summary ? ': ' + p.summary : ''}`).join('\n'),
  ).join('\n\n') +
  `\n\n## Optional\n\n- [Full documentation, single file](${site}/llms-full.txt)\n`

const full = `# Storyfeed documentation\n\n${preamble}\n\n` +
  pages.map((p) => `---\n\nSource: ${site}/${p.route}\n\n${p.body}`).join('\n\n')

const out = join(docs, 'public')
mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'llms.txt'), index)
writeFileSync(join(out, 'llms-full.txt'), full)
console.log(`llms.txt: ${pages.length} pages, ${index.length} bytes`)
console.log(`llms-full.txt: ${(full.length / 1024).toFixed(0)} KB`)
