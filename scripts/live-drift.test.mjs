// The docs fold Live groups in JavaScript (liveOf() in world.ts) for the
// subsets pages pass it. Until every example is core's own output (#41), this
// checks the copy against core: each named scene of every world pack, and the
// whole pack, read in Live through core's array source, must give the same
// page as liveOf() on the same rows: the same groups (axis, count, members)
// in the same order.
//
// Two things are deliberately not compared. Items that share an instant are
// unordered here: core breaks those ties on its grouping hash (every dated
// activity is curated into a bucket, a lone one included), which liveOf()
// does not reproduce. And group headlines: core reads its aggregate grammar
// from translations the world does not register.
//
// Skipped where core is not checked out, as the payloads check is.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { live, coreAvailable } from './payloads.mjs'

const { worldOf } = await import('../docs/.vitepress/theme/world.ts')
const { PACKS } = await import('../docs/.vitepress/theme/worlds/index.ts')

/** Newest first, with items at one instant in a fixed order of their own. */
const canonical = (nodes, key) => [...nodes].sort((a, b) =>
  b.published_at.localeCompare(a.published_at) || key(a).localeCompare(key(b)))

/** What a page shows of a node: which activities, folded how. */
const shape = (node) => node.kind === 'group'
  ? `group ${node.axis} ×${node.count} [${canonical(node.children, (child) => child.id).map((child) => child.id).join(' ')}]`
  : `activity ${node.id}`

/** A page as its nodes' shapes, newest first. */
const page = (nodes) => canonical(nodes, shape).map(shape)

/** Every list of two or more activities under `scene`, by its path. */
function scenes(value, path = 'scene', found = {}) {
  if (Array.isArray(value)) {
    if (value.length >= 2 && value.every((node) => node?.kind === 'activity')) found[path] = value
    else value.forEach((item, i) => scenes(item, `${path}[${i}]`, found))
  } else if (value && typeof value === 'object' && value.kind === undefined) {
    for (const [key, item] of Object.entries(value)) scenes(item, `${path}.${key}`, found)
  }
  return found
}

for (const [name, pack] of Object.entries(PACKS)) {
  test(`liveOf() folds ${name}'s scenes as core's Live does`, { skip: !coreAvailable() && 'core not checked out' }, () => {
    const world = worldOf(pack)
    const subsets = { ...scenes(world.scene), everything: world.everything() }
    const core = live(pack, Object.fromEntries(Object.entries(subsets).map(([path, nodes]) => [path, nodes.map((node) => node.id)])))

    assert.ok(Object.keys(subsets).length > 10, `only ${Object.keys(subsets).length} scenes found`)
    for (const [path, nodes] of Object.entries(subsets)) {
      assert.deepEqual(page(world.liveOf(nodes)), page(core[path]), `${path}: liveOf() and core's Live differ`)
    }
  })
}
