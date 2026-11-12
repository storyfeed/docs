// The Payload Contract page documents every key core emits on an activity or
// group node. payloads.json and scenes.json are core's own output, so a key core adds (as
// `bindings` was) fails here until the reference names it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const page = readFileSync(resolve(root, 'docs/reference/payload-contract.md'), 'utf8')
const section = (heading) => {
  const start = page.indexOf(`\n## ${heading}\n`)
  assert.notEqual(start, -1, `missing section ${heading}`)
  const end = page.indexOf('\n## ', start + 1)
  return page.slice(start, end === -1 ? undefined : end)
}
// Keys in the first column of the section's table rows.
const documented = (text) => new Set(
  text.split('\n').filter((line) => line.startsWith('| `'))
    .flatMap((line) => [...line.split('|')[1].matchAll(/`([a-z_]+)`/g)].map((m) => m[1])),
)

const worlds = resolve(root, 'docs/.vitepress/theme/worlds')
const nodes = readdirSync(worlds, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) => ['payloads.json', 'scenes.json']
    .map((file) => JSON.parse(readFileSync(resolve(worlds, d.name, file), 'utf8'))))
// Every node anywhere in the generated files, children and scene feeds included.
const walk = (value, out) => {
  if (!value || typeof value !== 'object') return out
  if (!Array.isArray(value) && (value.kind === 'activity' || value.kind === 'group')) out.push(value)
  for (const child of Object.values(value)) walk(child, out)
  return out
}
const all = nodes.flatMap((n) => walk(n, []))

for (const [kind, heading] of [['activity', 'Activity Nodes'], ['group', 'Group Nodes']]) {
  test(`every ${kind} node key core emits is documented`, () => {
    const keys = new Set(all.filter((n) => n.kind === kind).flatMap(Object.keys))
    assert.ok(keys.size > 0, `no ${kind} nodes in payloads.json`)
    const names = documented(section(heading))
    assert.deepEqual([...keys].filter((k) => !names.has(k)), [])
  })
}

test('the contract page explains bound values', () => {
  assert.match(page, /#### Bound Values/)
  assert.match(page, /"bindings": \{ "recipient": /)
})
