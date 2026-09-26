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

const { worldOf, BASE_VERBS, liveOf, summaryOf } = await import('../docs/.vitepress/theme/world.ts')
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

  test(`${name}: pickup progress belongs to an order and carries plain component props`, () => {
    const progress = scene.deeper.body.progress
    assert.equal(progress.object.type, 'order')
    assert.ok(same(progress.target, role.shop))
    assert.equal(progress.object.body.length, 1)
    const body = progress.object.body[0]
    assert.equal(body.$body, 'Storyfeed/Body/Component')
    assert.equal(body.name, 'Orders/Progress')
    assert.equal(body.props.title, progress.object.label)
    assert.ok(body.props.steps.includes(body.props.current))
    assert.equal(typeof body.props.pickup, 'string')
    assert.deepEqual(JSON.parse(JSON.stringify(body.props)), body.props)
  })

  test(`${name}: every row has wording, a known source and a unique id`, () => {
    assert.equal(new Set(pack.rows.map((r) => r.id)).size, pack.rows.length)
    for (const r of pack.rows) {
      assert.ok(verbs[r.verb], `${r.id}: verb "${r.verb}" has no wording`)
      assert.ok(r.src in pack.sources, `${r.id}: source "${r.src}"`)
    }
    for (const r of pack.rows.filter((r) => r.actor?.label === 'Jasper Tey')) assert.equal(r.cameo, true, `${r.id} is Jasper's`)
  })

  test(`${name}: every group headline names in the singular only what its axis pins`, () => {
    // StoryfeedManager::defaultAxes(); core refuses anything else (StoryMisconfigured::unpinnedToken).
    const pins = { repeat: ['actor', 'target'], actors: ['target'], targets: ['actor'], object: ['actor', 'object'] }
    for (const [verb, wording] of Object.entries(verbs)) {
      for (const [axis, pinned] of Object.entries(pins)) {
        for (const [, role] of (wording[axis] ?? '').matchAll(/:(actor|object|target|context)\b/g)) {
          assert.ok(pinned.includes(role), `${verb}.${axis}: :${role} is not pinned on ${axis}`)
        }
      }
    }
  })

  test(`${name}: every row that names an entity shows the same body`, () => {
    const seen = new Map()
    for (const row of pack.rows) {
      for (const slot of ['actor', 'object', 'target']) {
        const entity = row[slot]
        if (!entity || typeof entity !== 'object' || entity.tombstone) continue
        const key = `${entity.type}:${entity.id}`
        const body = JSON.stringify(entity.body ?? null)
        if (!seen.has(key)) seen.set(key, [body, row.id])
        else assert.equal(body, seen.get(key)[0], `${key} in ${row.id} differs from ${seen.get(key)[1]}`)
      }
    }
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
    assert.ok(same(c.computed.object, role.product))
    assert.equal(c.computed.object.body.length, 1)
    assert.equal(c.computed.object.body[0].$body, 'Storyfeed/Body/KeyValue')
    assert.equal(c.computed.object.body[0].title, c.computed.object.label)
    assert.equal(typeof c.computed.object.body[0].items.find((item) => item.key === 'Orders').value, 'number')
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
    const [crowd] = world.liveOf(c.grouped.actors)
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
    const list = content.itemList.object.body[0]
    assert.equal(list.$body, 'Storyfeed/Body/ItemList')
    assert.ok(list.title.includes(content.itemList.object.label))
    assert.ok(list.items.some(item => typeof item === 'string'))
    assert.ok(list.items.some(item => typeof item === 'object' && item.href))
    assert.ok(list.totalItems > list.items.length)
    assert.equal(list.more.href, content.itemList.object.url)
    assert.ok(list.more.href)
    assert.equal(list.more.label, content.itemList.object.label)
    const notice = content.notice.object.body[0]
    const linkedNotice = content.linkedNotice.object.body[0]
    for (const body of [notice, linkedNotice]) assert.equal(body.$body, 'Storyfeed/Body/MediaObject')
    assert.equal(notice.subject.label, content.notice.object.label)
    assert.equal(notice.subject.href, content.notice.object.url)
    assert.ok(content.notice.object.url)
    assert.ok(linkedNotice.subject.href && linkedNotice.subject.href !== content.linkedNotice.object.url)
    assert.equal(content.note.verb, 'post')
    assert.equal(content.note.object.type, 'note')
    assert.ok(same(content.note.target, scene.order.object))
    assert.ok(same(content.note.actor, role.customer))
    for (const [key, verb] of [['ready', 'ready'], ['confirmed', 'confirm']]) {
      assert.equal(content[key].verb, verb)
      assert.ok(same(content[key].object, scene.order.object))
      assert.ok(same(content[key].actor, role.staff))
    }
    // The order carries no body: Activity Content builds its Prose on its own example.
    assert.ok(!content.ready.object.body?.length, 'the shared order has no body')
    assert.ok(content.photo.object.media?.preview?.src)
    assert.ok(content.photo.object.url)
    assert.ok(same(content.photo.target, role.product))
    assert.ok(same(content.product.object, role.product))
    assert.ok(content.product.object.body.some(body => body.$body === 'Storyfeed/Body/KeyValue' && body.title === role.product.label))
    assert.ok(role.product.body?.some(body => body.$body === 'Storyfeed/Body/KeyValue'), 'the card is on the item itself')
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

    // Live stays glanceable: it folds every run, and the busy place into one crowd.
    assert.ok(live.length >= 10 && live.length <= 14, `Live shows ${live.length} rows`)
    assert.ok(scene.repeats.length >= 3, 'several expanders')
    const byFirst = (a, b) => a[0].localeCompare(b[0])
    assert.deepEqual(groups(live).filter((g) => ['repeat', 'object'].includes(g.axis)).map((g) => ids(g.children)).sort(byFirst),
      scene.repeats.map((run) => ids(run)).sort(byFirst))
    const busy = groups(live).filter((g) => g.axis === 'actors')
    assert.deepEqual(busy.map((g) => ids(g.children)), [ids(scene.busyPlace)])
    assert.ok(busy[0].distinct.actors >= 3, 'three people or more')
    assert.ok(summary.length < live.length && live.length < glance.length, 'Summary < Live < Log')
  })

  test(`${name}: Summary is one row per person per day, and a crowd for one identical thing`, () => {
    const summary = world.summaryOf(scene.glance)
    const members = (nodes) => nodes.flatMap((n) => n.kind === 'group' ? n.children : [n])
    assert.deepEqual(ids(members(summary)), ids(scene.glance), 'nothing is hidden')

    for (const row of summary.filter((n) => n.kind === 'group')) {
      assert.equal(row.axis, 'summary')
      assert.equal(row.period, 'day')
      assert.equal(row.headline_template, null)
      assert.equal(row.count, row.children.length)
      assert.equal(new Set(row.children.map((c) => c.published_at.slice(0, 10))).size, 1, 'one day')
      assert.equal(row.phrases.reduce((sum, p) => sum + p.count, 0), row.count, 'phrases cover the row')
      assert.deepEqual(row.phrases.map((p) => p.verb), [...new Set([...row.children].reverse().map((c) => c.verb))],
        'one phrase per verb, as they happened')
      for (const p of row.phrases) assert.ok(p.headline_template && !p.headline_template.includes(':actor'), `${p.verb}: a phrase starts at the verb`)
      const verbs = new Set(row.children.map((c) => c.verb))
      assert.equal(row.verb, verbs.size === 1 ? row.children[0].verb : null)
      if (verbs.size > 1) assert.equal(row.glyph, null, 'a row across verbs wears no glyph')
      if (row.distinct.actors > 1) {
        assert.equal(row.phrases.length, 1, 'a crowd did one thing')
        assert.equal(row.actor, null)
      } else {
        assert.ok(row.actor, 'the actor is pinned')
      }
    }
    // Every person has one row a day.
    const perDay = summary.filter((n) => n.kind === 'group' ? n.distinct.actors === 1 : n.actor)
      .map((n) => `${n.published_at.slice(0, 10)}|${(n.actor ?? n.sample.actors[0]).id}`)
    assert.equal(new Set(perDay).size, perDay.length, 'one row per person per day')

    // The acceptance picture: each row's shape, day by day.
    const shapeOf = (n) => n.kind === 'activity' ? `${n.verb}` : n.phrases.map((p) => `${p.verb}×${p.count}`).join('+')
      + (n.distinct.actors > 1 ? ` by ${n.distinct.actors}` : '')
    const days = [...new Set(summary.map((n) => n.published_at.slice(0, 10)))]
      .map((day) => summary.filter((n) => n.published_at.startsWith(day)).map(shapeOf).sort())
    if (name === 'stranger-things') {
      assert.deepEqual(days, [
        ['check_in×1+get×1+ride×3', 'check_in×2 by 2', 'drink', 'pay×3', 'play×3+win×1'],
        ['complete'],
        ['call', 'check_in×1+call×2'],
        ['score'],
      ])
    }
  })

  test(`${name}: a weekly Summary is one row per person per ISO week`, () => {
    const rows = world.everything().filter((n) => Date.parse(n.published_at) >= now - 7 * DAY)
    const weekly = world.summaryOf(rows, 'week')
    assert.ok(weekly.length < world.summaryOf(rows).length)
    const monday = (iso) => { const at = new Date(iso.slice(0, 10) + 'T00:00:00Z'); return +at - ((at.getUTCDay() + 6) % 7) * DAY }
    for (const row of weekly.filter((n) => n.kind === 'group')) {
      assert.equal(row.period, 'week')
      assert.equal(new Set(row.children.map((c) => monday(c.published_at))).size, 1, 'one week')
    }
    const members = (nodes) => nodes.flatMap((n) => n.kind === 'group' ? n.children : [n])
    assert.deepEqual(ids(members(weekly)), ids(rows), 'nothing is hidden')
  })

  test(`${name}: a busy day caps its phrases at three and counts the rest`, () => {
    const rows = world.everything().filter((n) => Date.parse(n.published_at) >= now - 7 * DAY)
    const busy = world.summaryOf(rows).filter((n) => n.phrases?.length > 3)
    assert.ok(busy.length > 0, 'someone had a busy day')
    for (const row of busy) assert.equal(row.phrases.reduce((sum, p) => sum + p.count, 0), row.count)
    // An activity with no actor stays on its own.
    const actorless = rows.filter((n) => !n.actor)
    for (const n of actorless) assert.ok(world.summaryOf(rows).includes(n), `${n.id} stands alone`)
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

// ── Core's grouping, rule by rule ───────────────────────────────────────────
// CurateCluster and FeedBuilder::crowds(), on rows small enough to count.

const who = (id) => ({ type: 'user', id, label: id })
const it = (type, id) => ({ type, id, label: `${type} ${id}` })
let serial = 0
const act = (verb, actor, object, target, at = '2026-09-25T12:00') =>
  ({ kind: 'activity', id: `r${String(++serial).padStart(3, '0')}`, verb, glyph: null, headline_template: `:actor ${verb}`,
    published_at: `${at}:00.000000Z`, actor, object, target })
const WORDS = { go: { glyph: 'x', headline: ':actor went', repeat: 'r', actors: 'a', targets: 't', object: 'o', summary: 'went|went :count times' } }
const axes = (nodes) => nodes.map((n) => n.kind === 'group' ? `${n.axis}:${n.count}` : 'activity').sort()
const fair = it('place', 'fair'), arcade = it('place', 'arcade'), mall = it('place', 'mall')

test('actors: three people at one target, whatever each acted on', () => {
  const rows = ['a', 'b', 'c'].map((p, i) => act('go', who(p), it('ticket', i), fair))
  assert.deepEqual(axes(liveOf(rows, WORDS)), ['actors:3'])
  assert.deepEqual(axes(liveOf(rows.slice(0, 2), WORDS)), ['activity', 'activity'], 'two people are not a crowd')
})

test('actors needs a target, and counts only people', () => {
  const untargeted = ['a', 'b', 'c'].map((p) => act('go', who(p), null, null))
  assert.deepEqual(axes(liveOf(untargeted, WORDS)), ['activity', 'activity', 'activity'])
  const two = [act('go', who('a'), null, fair), act('go', who('b'), null, fair), act('go', null, null, fair)]
  assert.deepEqual(axes(liveOf(two, WORDS)), ['activity', 'activity', 'activity'], 'anonymous is not a third person')
})

test('targets: one person at two targets or more, three times or more', () => {
  const a = who('a')
  assert.deepEqual(axes(liveOf([act('go', a, null, fair), act('go', a, null, arcade)], WORDS)), ['activity', 'activity'])
  assert.deepEqual(axes(liveOf([act('go', a, null, fair), act('go', a, null, arcade), act('go', a, null, arcade)], WORDS)), ['targets:3'])
})

test('object: one person, one object, twice, before repeat', () => {
  const a = who('a'), game = it('game', 'galaga')
  assert.deepEqual(axes(liveOf([act('go', a, game, fair), act('go', a, game, fair)], WORDS)), ['object:2'])
  assert.deepEqual(axes(liveOf([act('go', a, it('game', 1), fair), act('go', a, it('game', 2), fair)], WORDS)), ['repeat:2'])
})

test('repeat keys on the object type, and folds the anonymous too', () => {
  const a = who('a')
  assert.deepEqual(axes(liveOf([act('go', a, it('game', 1), fair), act('go', a, it('prize', 2), fair)], WORDS)), ['activity', 'activity'])
  assert.deepEqual(axes(liveOf([act('go', null, it('game', 1), fair), act('go', null, it('game', 2), fair)], WORDS)), ['repeat:2'])
})

test('a cluster counts every member, whichever axis each one won', () => {
  const [a, b, c] = ['a', 'b', 'c'].map(who)
  // a's check-in at the fair wins actors; her targets cluster still counts it.
  const rows = [act('go', a, null, fair), act('go', b, null, fair), act('go', c, null, fair),
    act('go', a, null, arcade), act('go', a, null, mall)]
  assert.deepEqual(axes(liveOf(rows, WORDS)), ['actors:3', 'targets:2'])
})

test('no group spans a day, and wording never decides a group', () => {
  const a = who('a')
  const days = [act('go', a, null, fair, '2026-09-24T23:59'), act('go', a, null, fair, '2026-09-25T00:01')]
  assert.deepEqual(axes(liveOf(days, WORDS)), ['activity', 'activity'])
  const [group] = liveOf([act('go', a, null, fair), act('go', a, null, fair)], { go: { glyph: 'x', headline: ':actor went' } })
  assert.equal(group.axis, 'repeat')
  assert.equal(group.headline_template, null)
})

test('at one instant a group reads before an activity', () => {
  const a = who('a')
  const rows = [act('go', who('z'), null, arcade), act('go', a, null, fair), act('go', a, null, fair)]
  assert.deepEqual(liveOf(rows, WORDS).map((n) => n.kind), ['group', 'activity'])
})

test('a summary crowd is one activity each, the same verb at the same target, whatever the object', () => {
  const rows = [act('go', who('a'), it('ticket', 1), fair), act('go', who('b'), it('ticket', 2), fair), act('go', who('c'), null, arcade)]
  const digest = summaryOf(rows, 'day', WORDS)
  assert.deepEqual(axes(digest), ['activity', 'summary:2'])
  const twice = [act('go', who('a'), null, fair), act('go', who('b'), null, fair), act('go', who('b'), null, fair)]
  assert.deepEqual(axes(summaryOf(twice, 'day', WORDS)), ['activity', 'summary:2'], 'twice keeps a row of their own')
})
