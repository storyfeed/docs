// The world keeps its shape wherever "now" is anchored. Moving the anchor moves
// every date and nothing else: each row stays the same distance from now, lands
// the same number of days back, and the three modes fold it the same way.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

// The theme's modules import each other without extensions, as Vite allows.
registerHooks({
  resolve(specifier, context, next) {
    if (/^\.\.?\//.test(specifier) && !/\.\w+$/.test(specifier)) {
      try { return next(`${specifier}.ts`, context) } catch {}
    }
    return next(specifier, context)
  },
})

const world = await import('../docs/.vitepress/theme/world.ts')
const { CANON, SOURCES, WORLD_CANONICAL_NOW, WORLD_ANCHOR, everything, liveOf, summaryOf, logOf } = world

const TALK = Date.parse('2026-09-30T19:00:00Z')
const DAY = 86_400_000
const daysBack = (iso, now) => Math.round((Math.floor(now / DAY) * DAY - Math.floor(Date.parse(iso) / DAY) * DAY) / DAY)
const shape = (nodes) => nodes.map((n) => `${n.kind}:${n.id}:${n.count ?? 1}`)

test('the default anchor is the canonical now, so the show\'s dates come out exactly', () => {
  assert.equal(WORLD_ANCHOR, WORLD_CANONICAL_NOW)
  const alexei = everything().find((n) => n.id === 'k42')
  assert.equal(alexei.published_at, '1985-07-04T18:35:00.000000Z')
})

test('moving the anchor moves every date and keeps every distance from now', () => {
  const before = everything(WORLD_CANONICAL_NOW)
  const after = everything(TALK)
  assert.equal(before.length, after.length)
  for (const [i, node] of before.entries()) {
    const moved = after[i]
    assert.notEqual(moved.published_at, node.published_at)
    assert.equal(TALK - Date.parse(moved.published_at), WORLD_CANONICAL_NOW - Date.parse(node.published_at), node.id)
    assert.equal(daysBack(moved.published_at, TALK), daysBack(node.published_at, WORLD_CANONICAL_NOW), node.id)
  }
})

test('the three modes fold the same rows under any anchor', () => {
  for (const make of [logOf, liveOf, summaryOf]) {
    assert.deepEqual(shape(make(everything(TALK))), shape(make(everything(WORLD_CANONICAL_NOW))))
  }
})

test('every canon row names a known source, and the future stays out of the feeds', () => {
  for (const row of CANON) assert.ok(row.src in SOURCES, `${row.id}: ${row.src}`)
  assert.equal(new Set(CANON.map((row) => row.id)).size, CANON.length, 'ids are unique')
  for (const node of everything()) assert.ok(Date.parse(node.published_at) <= WORLD_ANCHOR, node.id)
})

test('Jasper\'s rows are flagged for his review', () => {
  const his = CANON.filter((row) => row.actor?.label === 'Jasper Tey')
  assert.ok(his.length > 0)
  for (const row of his) assert.equal(row.cameo, true, row.id)
})
