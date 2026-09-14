#!/usr/bin/env node
/**
 * Print the whole spine to PDF, numbered in sidebar order, for the iPad review
 * loop. Reads the order from the VitePress config so the folder always matches
 * the site; refuses to overwrite an annotated file (print-pdf.mjs does that).
 *
 * Usage: npm run build && npx vitepress preview docs --port 5174 & node scripts/print-spine.mjs
 */
import { readFileSync, readdirSync, unlinkSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'

const config = readFileSync(new URL('../docs/.vitepress/config.ts', import.meta.url), 'utf8')
const sidebar = config.slice(config.indexOf('sidebar: ['), config.indexOf('socialLinks'))
const DOCS = join(homedir(), 'Library/Mobile Documents/com~apple~CloudDocs/Storyfeed Review/Docs')

const pages = []
let section = null
for (const line of sidebar.split('\n')) {
  const s = line.match(/^\s*text: '([^']+)',\s*$/)
  if (s) { section = s[1]; continue }
  const p = line.match(/text: '([^']+)', link: '([^']+)'/)
  if (p && section) pages.push({ section, title: p[1], route: p[2].replace(/^\//, '') })
}

// Clear unannotated copies so renumbering leaves no stale file behind.
for (const f of readdirSync(DOCS)) {
  const path = join(DOCS, f)
  const inked = /\/Subtype\s*\/(Ink|Stamp|FreeText|Highlight|Underline|StrikeOut|Squiggly)\b/
  if (f.endsWith('.pdf') && !inked.test(readFileSync(path).toString('latin1'))) unlinkSync(path)
}

pages.forEach(({ section, title, route }, i) => {
  const name = `${String(i + 1).padStart(2, '0')} ${section} — ${title.replace(/\//g, '-')}`
  execFileSync('node', [new URL('./print-pdf.mjs', import.meta.url).pathname, route, name], { stdio: 'inherit' })
})
