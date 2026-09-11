#!/usr/bin/env node
/**
 * Print a built docs page to PDF, for the review loop.
 *
 * These pages are read on an iPad, annotated in ink, and handed back. That loop
 * had no script behind it: the PDFs in the review folder were produced ad hoc
 * and whatever produced them was not kept, so the next person to need one went
 * looking for a pipeline that did not exist. This is that pipeline, and it is
 * eleven lines of Chrome invocation precisely so it cannot rot.
 *
 * It prints the BUILT site rather than the dev server, because the dev server
 * renders components the built pages have already settled, and a review copy
 * should be the page that ships.
 *
 * Usage:
 *   npm run build
 *   npx vitepress preview docs --port 5174 &
 *   node scripts/print-pdf.mjs guide/usage-examples "05 Getting started — Usage examples"
 *
 * The second argument is the file name, and it carries the spine number the
 * review folder sorts by. It is passed rather than derived: the running order
 * is the owner's, not something a script should guess.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const [route, name] = process.argv.slice(2)

if (!route || !name) {
  console.error('usage: node scripts/print-pdf.mjs <route> <output name without .pdf>')
  process.exit(1)
}

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DOCS = join(homedir(), 'Library/Mobile Documents/com~apple~CloudDocs/Storyfeed Review/Docs')
const out = join(DOCS, `${name}.pdf`)

if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}`)
  process.exit(1)
}

/*
 * NEVER OVERWRITE AN ANNOTATED FILE. A marked-up PDF is the only copy of what
 * the reviewer said, and it has been nearly lost once: an annotated
 * Introduction survived a re-render only because a renumbering changed its
 * name. Annotated copies belong in ../Annotated, and this refuses to write over
 * anything already carrying ink rather than trusting a convention.
 */
if (existsSync(out)) {
  const { readFileSync } = await import('node:fs')
  const bytes = readFileSync(out)
  if (bytes.includes('/Annot')) {
    console.error(`${out}\ncarries annotations. Move it to ../Annotated first; refusing to overwrite.`)
    process.exit(1)
  }
}

execFileSync(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  `--print-to-pdf=${out}`,
  '--virtual-time-budget=15000',
  `http://localhost:5174/${route}.html`,
], { stdio: ['ignore', 'inherit', 'ignore'] })

console.log(`wrote ${out}`)
