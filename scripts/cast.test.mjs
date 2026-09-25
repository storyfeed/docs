// A manifest value must never appear literally in a page. Prose that names the
// cast reads the manifest ({{ who.designer.label }}) or a world pack's role
// ({{ role.customer.label }}); a literal name is what a recast would miss. Every
// pack's own manifest (theme/worlds/<pack>/manifest.ts) counts. Code fences are exempt: a printed verification report is
// example output, not prose.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'docs')
const worlds = resolve(root, '.vitepress/theme/worlds')
const manifests = [
  resolve(root, '.vitepress/theme/manifest.ts'),
  ...readdirSync(worlds, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => resolve(worlds, e.name, 'manifest.ts')),
]
const manifest = manifests.map(file => readFileSync(file, 'utf8')).join('\n')
const values = [...manifest.matchAll(/^\s*[a-zA-Z0-9]+:\s+'((?:[^'\\]|\\.)+)',?$/gm)].map(m => m[1].replace(/\\'/g, "'"))

function pages(dir = root) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = resolve(dir, e.name)
    if (e.isDirectory()) return /^(\.vitepress|briefs|public)$/.test(e.name) ? [] : pages(p)
    return p.endsWith('.md') && e.name !== 'tone-lab.md' ? [p] : []
  })
}

const prose = text => text
  .replace(/<script setup>[\s\S]*?<\/script>/g, '')
  .replace(/```[\s\S]*?```/g, '')
  .replace(/`[^`\n]*`/g, '')

test('no manifest value appears literally in prose', () => {
  const leaks = []
  for (const file of pages()) {
    const text = prose(readFileSync(file, 'utf8'))
    for (const value of values) {
      if (text.includes(value)) leaks.push(`${relative(root, file)}: "${value}"`)
    }
  }
  assert.deepEqual(leaks, [], `manifest values in prose:\n  ${leaks.join('\n  ')}`)
})
