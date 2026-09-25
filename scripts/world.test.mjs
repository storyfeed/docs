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
      ...scene.repeats.flat(), scene.distant, ...scene.cameo, ...scene.glance]
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

  test(`${name}: cookbook scenes preserve the behaviours being taught`, () => {
    const c = scene.cookbook
    const rows = [c.actorless.anonymous, c.actorless.paid, c.actorless.expired,
      c.transitions.confirmed, ...c.transitions.timeline, ...c.pricing,
      c.deletion, c.discussion, ...c.grouped.repeat, ...c.grouped.actors]
    for (const row of rows) {
      assert.ok(Date.parse(row.published_at) < now, `${row.id}: visible before now`)
      assert.ok(world.everything().some((entry) => entry.id === row.id), `${row.id}: catalogued`)
    }
    assert.equal(c.actorless.anonymous.actor, null)
    assert.equal(c.actorless.anonymous.verb, 'place')
    assert.ok(same(c.actorless.paid.actor, role.service))
    assert.equal(c.actorless.paid.verb, 'pay')
    assert.equal(c.actorless.paid.object.type, 'order')
    assert.equal(c.actorless.expired.actor, null)
    assert.equal(c.actorless.expired.verb, 'expire')
    assert.equal(c.transitions.confirmed.verb, 'confirm')
    assert.ok(same(c.transitions.confirmed.actor, role.staff))
    const timeline = [...c.transitions.timeline].sort((a, b) => a.published_at.localeCompare(b.published_at))
    assert.deepEqual(timeline.map((r) => r.verb), ['place', 'confirm', 'place'])
    assert.ok(timeline.every((r) => same(r.object, scene.order.object)))
    assert.deepEqual(c.pricing.map((r) => r.verb), ['add', 'reprice'])
    assert.ok(c.pricing.every((r) => same(r.object, role.product)))
    assert.equal(c.deletion.verb, 'remove')
    assert.ok(same(c.deletion.object, role.product))
    assert.equal(c.discussion.verb, 'reply')
    assert.equal(c.discussion.object.type, 'discussion')
    const [repeat] = world.liveOf(c.grouped.repeat)
    assert.equal(repeat.axis, 'repeat')
    assert.equal(repeat.count, 3)
    assert.equal(repeat.distinct.objects, 3)
    assert.deepEqual(ids(repeat.children), ids(c.grouped.repeat))
    const [crowd] = world.summaryOf(c.grouped.actors)
    assert.equal(crowd.axis, 'actors')
    assert.equal(crowd.count, 3)
    assert.equal(crowd.distinct.actors, 3)
    assert.equal(crowd.distinct.objects, 1)
    assert.deepEqual(ids(crowd.children), ids(c.grouped.actors))
  })

  test(`${name}: deeper scenes preserve the examples' relationships`, () => {
    const d = scene.deeper
    const nodes = Object.values(d).flatMap(section => Object.values(section).flat())
    for (const node of nodes) {
      assert.ok(Date.parse(node.published_at) <= now, node.id)
      assert.ok(now - Date.parse(node.published_at) > 60_000, `${node.id}: a real relative time`)
    }
    const orders = d.aggregation.orders
    assert.equal(orders.length, 3)
    assert.equal(new Set(orders.map(row => row.object.id)).size, 3)
    for (const row of orders) {
      assert.equal(row.verb, 'place')
      assert.ok(same(row.actor, role.customer))
      assert.ok(same(row.target, role.shop))
    }
    assert.equal(world.liveOf(orders).length, 1)
    assert.equal(world.liveOf(orders)[0].children.length, 3)
    assert.equal(d.aggregation.customers.length, 5)
    assert.equal(new Set(d.aggregation.customers.map(row => row.actor.id)).size, 5)
    for (const row of d.aggregation.customers) {
      assert.equal(row.verb, 'place')
      assert.ok(same(row.target, role.shop))
    }
    const timeline = d.latestPerObject.timeline
    assert.deepEqual(timeline.map(row => row.verb), ['place', 'confirm', 'ready', 'pay'])
    for (const row of timeline) assert.ok(same(row.object, timeline[0].object))
    assert.ok(same(timeline.at(-1).actor, role.service))
    assert.equal(new Set(d.latestPerObject.board.map(row => row.object.id)).size, 3)
    assert.equal(world.liveOf(d.latestPerObject.confirmations)[0].count, 3)
    const [early, latest, other] = d.keepingLatest.saves
    assert.ok(same(early.object, latest.object) && same(latest.object, other.object))
    assert.ok(same(early.actor, latest.actor) && !same(latest.actor, other.actor))
    assert.ok(early.published_at < latest.published_at && latest.published_at < other.published_at)
    const weekly = d.groupingPeriods.orders
    assert.equal(new Set(weekly.map(row => row.published_at.slice(0, 10))).size, 3)
    const monday = row => { const at = new Date(row.published_at); at.setUTCHours(0, 0, 0, 0); return +at - ((at.getUTCDay() + 6) % 7) * DAY }
    assert.equal(new Set(weekly.map(monday)).size, 1)
    for (const row of weekly) {
      assert.equal(row.verb, 'place')
      assert.ok(same(row.actor, role.customer) && same(row.target, role.shop))
    }
    const views = d.retention.views
    assert.equal(world.liveOf(views)[0].count, 5)
    const retained = views.filter(row => Date.parse(row.published_at) >= now - 3_600_000)
    assert.equal(world.liveOf(retained)[0].count, 2)
    const tasks = d.composites.tasks
    assert.equal(tasks.length, 2)
    assert.ok(same(tasks[0].actor, tasks[1].actor))
    assert.ok(!same(tasks[0].object, tasks[1].object))
    for (const row of tasks) assert.equal(row.verb, 'complete')
    const moved = worldOf(pack, MOVED).scene.deeper
    const shifted = Object.values(moved).flatMap(section => Object.values(section).flat())
    nodes.forEach((row, i) => assert.equal(now - Date.parse(row.published_at), MOVED - Date.parse(shifted[i].published_at)))
    const summary = world.summaryOf(world.everything())
    assert.ok(summary.filter(row => row.kind === 'group').length >= 5, 'long feed demonstrates several folds')
    for (const group of summary.filter(row => row.kind === 'group')) assert.equal(group.count, group.children.length)
  })

  test(`${name}: guide and basics scenes support their teaching examples`, () => {
    const { activityContent: content, recording, feedFile, namedFeeds } = scene.basics
    const { repeatOrders, photos } = scene.guide.usageExamples
    const rows = [...repeatOrders, ...photos, ...Object.values(content), recording.paid,
      recording.priced, ...recording.photos, ...Object.values(feedFile), ...namedFeeds.shop]
    for (const node of rows) {
      assert.ok(Date.parse(node.published_at) < now, `${node.id}: dated before now`)
      assert.ok(pack.rows.some(row => row.id === node.id), `${node.id}: from the catalogue`)
    }
    assert.equal(repeatOrders.length, 3, 'three separately recorded orders')
    for (const node of repeatOrders) {
      assert.equal(node.verb, 'place')
      assert.ok(same(node.actor, role.customer))
      assert.ok(same(node.target, role.shop))
      assert.equal(node.object.type, 'order')
    }
    assert.equal(new Set(repeatOrders.map(node => node.object.id)).size, 3)
    const orderGroup = world.liveOf(repeatOrders)
    assert.equal(orderGroup.length, 1)
    assert.equal(orderGroup[0].axis, 'repeat')
    assert.deepEqual(ids(orderGroup[0].children), ids(repeatOrders))

    for (const list of [photos, recording.photos]) {
      assert.ok(list.length >= 2)
      for (const node of list) {
        assert.equal(node.verb, 'upload')
        assert.equal(node.object.type, 'photo')
        assert.ok(same(node.actor, list[0].actor))
        assert.ok(same(node.target, list[0].target))
      }
      assert.equal(world.liveOf(list).length, 1)
    }
    assert.equal(content.note.verb, 'post')
    assert.equal(content.note.object.type, 'note')
    assert.ok(same(content.note.target, scene.order.object))
    assert.ok(same(content.note.actor, role.customer))
    for (const [key, verb] of [['ready', 'ready'], ['confirmed', 'confirm']]) {
      assert.equal(content[key].verb, verb)
      assert.ok(same(content[key].object, scene.order.object))
      assert.ok(same(content[key].actor, role.staff))
    }
    assert.ok(content.ready.object.body.some(body => body.$body === 'Storyfeed/Body/Excerpt' && body.text && body.truncated === false))
    assert.ok(content.photo.object.media?.preview?.src)
    assert.ok(content.photo.object.url)
    assert.ok(same(content.photo.target, role.product))
    assert.ok(same(content.product.object, role.product))
    assert.ok(content.product.object.body.some(body => body.$body === 'Storyfeed/Body/MediaObject'))
    assert.equal(recording.paid.verb, 'pay')
    assert.ok(same(recording.paid.actor, role.service))
    assert.ok(same(recording.paid.object, scene.order.object))
    assert.equal(recording.priced.verb, 'reprice')
    assert.ok(same(recording.priced.object, role.product))
    assert.equal(feedFile.completed.verb, 'complete')
    assert.equal(feedFile.created.verb, 'create')
    for (const node of Object.values(feedFile)) assert.ok(same(node.object, scene.order.object))
    assert.ok(namedFeeds.shop.some(node => !['place', 'confirm', 'ready'].includes(node.verb)))
    for (const verb of ['place', 'confirm', 'ready']) {
      assert.ok(namedFeeds.shop.some(node => node.verb === verb && same(node.object, scene.order.object)))
    }
    for (const node of namedFeeds.shop) assert.ok(same(node.target, role.shop), 'shop scope is truthful')

    const shifted = worldOf(pack, MOVED)
    const scenes = value => Array.isArray(value) ? value.flatMap(scenes)
      : value?.kind === 'activity' ? [value] : Object.values(value).flatMap(scenes)
    const before = scenes({ guide: scene.guide, basics: scene.basics })
    const after = scenes({ guide: shifted.scene.guide, basics: shifted.scene.basics })
    assert.deepEqual(ids(before), ids(after))
    for (const [i, node] of before.entries()) {
      assert.equal(MOVED - Date.parse(after[i].published_at), now - Date.parse(node.published_at))
    }
  })

  test(`${name}: the long reading feed keeps the same facts in all three modes`, () => {
    const rows = world.everything().filter(node => Date.parse(node.published_at) >= now - 7 * DAY)
    const live = world.liveOf(rows)
    const summary = world.summaryOf(rows)
    assert.ok(rows.length > scene.glance.length * 2, 'a long feed')
    assert.ok(summary.length < live.length && live.length < rows.length)
    const members = nodes => nodes.flatMap(node => node.kind === 'group' ? node.children : [node])
    assert.deepEqual(ids(members(live)), ids(rows))
    assert.deepEqual(ids(members(summary)), ids(rows))
    for (const node of [...live, ...summary].filter(node => node.kind === 'group')) {
      assert.equal(node.count, node.children.length)
      assert.equal(node.children_truncated, false)
      assert.equal(new Set(node.children.map(child => child.published_at.slice(0, 10))).size, 1)
    }
  })

  test(`${name}: the glance is short and wide, and each mode does its one job`, () => {
    const glance = scene.glance
    assert.ok(glance.length <= 24, `glance has ${glance.length} rows`)
    const recent = glance.filter((n) => n.id !== scene.distant.id)
    assert.ok(new Set(recent.map((n) => n.published_at.slice(0, 10))).size <= 4, 'a few days')
    for (const n of recent) assert.ok(now - Date.parse(n.published_at) < 7 * DAY, `${n.id} is within the week`)
    assert.ok(new Set(glance.map((n) => n.verb)).size >= 6, 'many kinds of activity')

    const groups = (nodes) => nodes.filter((n) => n.kind === 'group')
    const live = world.liveOf(glance)
    const summary = world.summaryOf(glance)

    // Live stays glanceable, and folds the repeats, and only the repeats.
    assert.ok(live.length >= 10 && live.length <= 14, `Live shows ${live.length} rows`)
    assert.ok(scene.repeats.length >= 3, 'several expanders')
    const byFirst = (a, b) => a[0].localeCompare(b[0])
    assert.deepEqual(groups(live).map((g) => ids(g.children).sort()).sort(byFirst),
      scene.repeats.map((run) => ids(run).sort()).sort(byFirst))
    assert.ok(groups(live).every((g) => g.axis === 'repeat'))
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

// Lane C has completed the migration; prevent reintroducing its legacy world.
test('cookbook, reference and tone lab use scenes with an anchored clock', () => {
  const scope = [...files(resolve(docs, 'cookbook'), /\.md$/),
    ...files(resolve(docs, 'reference'), /\.md$/), resolve(docs, 'tone-lab.md')]
  for (const file of scope) {
    const text = readFileSync(file, 'utf8')
    assert.doesNotMatch(text, /\b(?:who|where|dishes|scenes)\.[a-zA-Z]+/, relative(docs, file))
    assert.doesNotMatch(text, /<FeedExample[^>]*\bcontext\b/, relative(docs, file))
    assert.doesNotMatch(text, /published_at:\s*['"]\d{4}-/, relative(docs, file))
    assert.doesNotMatch(text, /\$kitchen|Models\\Kitchen/, relative(docs, file))
  }
})
// Lane B must not silently regain the legacy cast through FeedExample padding.
test('deeper pages use world scenes without legacy context padding', () => {
  for (const file of files(resolve(docs, 'deeper'), /\.md$/)) {
    const source = readFileSync(file, 'utf8')
    assert.doesNotMatch(source, /theme\/(samples|manifest)|\bscenes\.|2026-\d\d-\d\d|<FeedExample[^>]*\bcontext(?:\s|=|>)/, relative(docs, file))
  }
})

// Execute the actual page expressions: an omitted variable otherwise lets
// VitePress report success while its server renderer prints an error.
test('every deeper feed expression produces dated payload nodes', async () => {
  const api = await import('../docs/.vitepress/theme/world.ts')
  let feeds = 0
  for (const file of files(resolve(docs, 'deeper'), /\.md$/)) {
    const source = readFileSync(file, 'utf8')
    const script = source.match(/<script setup>([\s\S]*?)<\/script>/)?.[1]
    if (!script) continue
    const body = script.replace(/import \{([^}]+)\} from ['"][^'"]+['"]/g, 'const {$1} = api')
    const expressions = [...source.matchAll(/<FeedExample[^>]*:items="([^"]+)"/g)].map(match => match[1])
    for (const expression of expressions) {
      const nodes = new Function('api', `${body}; return (${expression})`)(api)
      assert.ok(Array.isArray(nodes) && nodes.length, `${relative(docs, file)}: ${expression}`)
      for (const node of nodes) {
        assert.ok(node && Number.isFinite(Date.parse(node.published_at)), `${relative(docs, file)}: dated node`)
        assert.ok(Date.parse(node.published_at) < api.WORLD_ANCHOR, `${relative(docs, file)}: before now`)
      }
      feeds++
    }
  }
  assert.ok(feeds >= 50, `exercised ${feeds} rendered examples`)
})

// W28-A: migrated pages must not silently bring back the legacy kitchen via
// imports or FeedExample's context padding. Other lanes migrate independently.
test('guide and basics examples use the world without legacy padding', () => {
  const leaks = []
  for (const file of [...files(resolve(docs, 'guide'), /\.md$/), ...files(resolve(docs, 'basics'), /\.md$/)]) {
    if (file.endsWith('/introduction.md')) continue
    const text = readFileSync(file, 'utf8')
    if (/theme\/(samples|manifest)|\bscenes\.|2026-\d\d-\d\d/.test(text)) leaks.push(relative(docs, file))
    if (/<FeedExample[^>]*\scontext(?:\s|=|>)/.test(text)) leaks.push(`${relative(docs, file)}: legacy padding`)
    if (/\$kitchen|\bKitchen\b/.test(text)) leaks.push(`${relative(docs, file)}: themed code names`)
  }
  assert.deepEqual(leaks, [])
})
