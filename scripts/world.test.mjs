// Every world pack can tell every scene the docs ask for, and the world keeps
// its shape wherever "now" is anchored. A new pack runs through all of this by
// being registered in theme/worlds/index.ts.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// The theme's modules import each other without extensions, as Vite allows.
registerHooks({
  resolve(specifier, context, next) {
    if (/^\.\.?\//.test(specifier) && !/\.\w+$/.test(specifier)) {
      for (const suffix of ['.ts', '/index.ts']) {
        try { return next(`${specifier}${suffix}`, context) } catch {}
      }
    }
    return next(specifier, context)
  },
})

const { worldOf, BASE_VERBS } = await import('../docs/.vitepress/theme/world.ts')
const { PACKS } = await import('../docs/.vitepress/theme/worlds/index.ts')
const { APP_KINDS } = await import('../docs/.vitepress/theme/worlds/contract.ts')

const DAY = 86_400_000
const MOVED = Date.parse('2026-09-30T19:00:00Z')
const daysBack = (iso, now) => Math.round((Math.floor(now / DAY) - Math.floor(Date.parse(iso) / DAY)))
const shape = (nodes) => nodes.map((n) => `${n.kind}:${n.id}:${n.count ?? 1}`)
const ids = (nodes) => nodes.map((n) => n.id).sort()
const same = (a, b) => a && b && a.type === b.type && a.id === b.id

for (const [name, pack] of Object.entries(PACKS)) {
  const world = worldOf(pack)
  const { scene, role } = world
  const now = Date.parse(pack.canonicalNow)
  const verbs = { ...BASE_VERBS, ...pack.verbs }

  test(`${name}: every row has wording, a known source and a unique id`, () => {
    assert.equal(new Set(pack.rows.map((r) => r.id)).size, pack.rows.length)
    for (const r of pack.rows) {
      assert.ok(verbs[r.verb], `${r.id}: verb "${r.verb}" has no wording`)
      assert.ok(r.src in pack.sources, `${r.id}: source "${r.src}"`)
    }
    for (const r of pack.rows.filter((r) => r.actor?.label === 'Jasper Tey')) assert.equal(r.cameo, true, `${r.id} is Jasper's`)
  })

  test(`${name}: every role is an entity`, () => {
    for (const key of ['customer', 'shop', 'product', 'staff', 'service']) {
      assert.ok(role[key]?.type && role[key]?.id && role[key]?.label, `role.${key}`)
    }
  })

  test(`${name}: every scene resolves, published by now, and does its job`, () => {
    const all = [scene.order, scene.question, ...Object.values(scene.otherApps), ...scene.busyPlace,
      ...scene.repeat, scene.distant, ...scene.cameo, ...scene.glance]
    for (const node of all) assert.ok(Date.parse(node.published_at) <= now, `${node.id} is after now`)

    assert.equal(scene.order.verb, 'place')
    assert.ok(same(scene.order.actor, role.customer), 'order: the customer places it')
    assert.ok(same(scene.order.target, role.shop), 'order: with the shop')
    assert.ok(scene.order.object, 'order: an object')

    assert.equal(scene.question.verb, 'ask')
    assert.ok(same(scene.question.actor, role.customer), 'question: the customer asks')
    assert.ok(same(scene.question.target, role.product), 'question: about the product')
    assert.equal(scene.question.object?.type, 'note', 'question: with a note')

    for (const [kind, verb] of Object.entries(APP_KINDS)) {
      assert.equal(scene.otherApps[kind]?.verb, verb, `otherApps.${kind} uses "${verb}"`)
    }

    for (const r of pack.scenes.cameo) assert.equal(world.pack.rows.find((x) => x.id === r).cameo, true, `cameo ${r}`)
    assert.ok(scene.cameo.length > 0, 'a cameo')

    assert.ok(now - Date.parse(scene.distant.published_at) >= 30 * DAY, 'distant is 30 days back or more')
  })

  test(`${name}: the glance is short and wide, and each mode does its one job`, () => {
    const glance = scene.glance
    assert.ok(glance.length >= 10 && glance.length <= 14, `glance has ${glance.length} rows`)
    const recent = glance.filter((n) => n.id !== scene.distant.id)
    assert.ok(new Set(recent.map((n) => n.published_at.slice(0, 10))).size <= 4, 'a few days')
    for (const n of recent) assert.ok(now - Date.parse(n.published_at) < 7 * DAY, `${n.id} is within the week`)
    assert.ok(new Set(glance.map((n) => n.verb)).size >= 6, 'many kinds of activity')

    const groups = (nodes) => nodes.filter((n) => n.kind === 'group')
    const live = world.liveOf(glance)
    const summary = world.summaryOf(glance)

    // Live folds the repeat, and only the repeat.
    assert.deepEqual(groups(live).map((g) => [g.axis, ids(g.children)]), [['repeat', ids(scene.repeat)]])
    // Summary also folds the busy place, as one many-people group.
    const busy = groups(summary).filter((g) => g.axis === 'actors')
    assert.deepEqual(busy.map((g) => ids(g.children)), [ids(scene.busyPlace)])
    assert.ok(busy[0].distinct.actors >= 3, 'three people or more')
    assert.ok(groups(summary).some((g) => g.axis === 'repeat'), 'Summary still folds the repeat')
    assert.ok(summary.length < live.length && live.length < glance.length, 'Summary < Live < Log')
  })

  test(`${name}: moving the anchor moves every date and keeps every distance from now`, () => {
    const before = worldOf(pack).everything()
    const moved = worldOf(pack, MOVED)
    const after = moved.everything()
    assert.equal(before.length, after.length)
    for (const [i, node] of before.entries()) {
      assert.notEqual(after[i].published_at, node.published_at)
      assert.equal(MOVED - Date.parse(after[i].published_at), now - Date.parse(node.published_at), node.id)
      assert.equal(daysBack(after[i].published_at, MOVED), daysBack(node.published_at, now), node.id)
    }
    assert.deepEqual(shape(moved.liveOf(moved.scene.glance)), shape(world.liveOf(scene.glance)))
    assert.deepEqual(shape(moved.summaryOf(moved.scene.glance)), shape(world.summaryOf(scene.glance)))
  })
}

test('the default anchor is the pack\'s own now', async () => {
  const { WORLD_ANCHOR, WORLD_CANONICAL_NOW, pack } = await import('../docs/.vitepress/theme/world.ts')
  assert.equal(WORLD_ANCHOR, WORLD_CANONICAL_NOW)
  assert.equal(WORLD_ANCHOR, Date.parse(pack.canonicalNow))
})

// Pages and snippets speak in roles and scenes: no page reaches into a pack.
const docs = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'docs')
const files = (dir, ext) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = resolve(dir, e.name)
  if (e.isDirectory()) return /^(\.vitepress|public|node_modules)$/.test(e.name) ? [] : files(p, ext)
  return ext.test(e.name) ? [p] : []
})

test('no page or snippet imports a pack or picks a pack\'s rows', () => {
  const leaks = []
  for (const file of files(docs, /\.(md|php)$/)) {
    const text = readFileSync(file, 'utf8')
    if (/theme\/worlds\//.test(text)) leaks.push(`${relative(docs, file)}: imports a pack`)
    if (/\b(worldOf|pack\.rows|pack\.scenes)\b/.test(text)) leaks.push(`${relative(docs, file)}: reaches into a pack`)
  }
  assert.deepEqual(leaks, [])
})
