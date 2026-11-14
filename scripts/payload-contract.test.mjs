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

test('the contract page documents the page media map', () => {
  assert.match(page, /"sync_token": "01J3…",\n\s+\/\/ .*\n\s+"media": \{/)
  assert.match(page, /"media_ref": "m[0-9a-f]{16}"/)
  assert.match(page, /### Page Media Map/)
  assert.match(page, /storyfeed\.payload\.inline_media/)
  assert.match(page, /STORYFEED_INLINE_MEDIA/)
  assert.match(page, /falls back to the entity's inline copies/)
  assert.match(page, /never applies to `get\(\)`/)
  assert.match(page, /never\n`->toArray\(\)\['data'\]`/)
  assert.match(page, /`appendPage\(\)`/)
})

test('the contract page documents the page entity map', () => {
  assert.match(page, /"media": \{ "m[0-9a-f]{16}".*\},\n\s+\/\/ .*\n\s+"entities": \{/)
  assert.match(page, /"entity_ref": "e[0-9a-f]{16}"/)
  assert.match(page, /### Page Entity Map/)
  assert.match(page, /storyfeed\.payload\.inline_entities/)
  assert.match(page, /STORYFEED_INLINE_ENTITIES/)
  assert.match(page, /"actor": \{ "type": "user", "id": "7", "entity_ref": "e[0-9a-f]{16}" \}/)
  assert.match(page, /the `media` map is always empty/)
  assert.match(page, /resolves entities before media/)
  assert.match(page, /`media` and\n`entities` maps/)
})

test('the contract page documents the sample cap', () => {
  assert.match(page, /`samples\(\$limit\)`/)
  assert.match(page, /`samples\(0\)` sends none/)
  assert.match(page, /never a missing key/)
})
