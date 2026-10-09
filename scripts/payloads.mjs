/**
 * The world's activities, read through Storyfeed itself.
 *
 * Every row of every world pack goes to core's `array` source as an item, with
 * the pack's verb wording registered as definitions (`Story::verb()`, its
 * headline and icon) and the docs' glyph intents as `->intent()`. Core reads
 * them all in Log mode and the payload node of each row is written to
 * `docs/.vitepress/theme/worlds/<pack>/payloads.json`, keyed by row id.
 * world.ts builds every scene, and `everything`, from those nodes.
 *
 * Two things a row carries that the array source has no key for are laid
 * over the generated nodes by world.ts, not written here: a row's own
 * `headline` (a one-off wording for one activity) and an entity's `media`
 * (resolved by an app's `feedMedia()`, which a source item has no model for).
 * Live groups for the ad-hoc subsets pages pass to `liveOf()` are still folded
 * in world.ts.
 *
 *   node scripts/payloads.mjs           write the files (needs core and PHP)
 *   node scripts/payloads.mjs --check   exit 1 when a file is stale
 *
 * Core is STORYFEED_CORE, a storyfeed/storyfeed checkout with its Composer
 * dependencies installed. The drift guard runs `--check` wherever core is.
 */
import { registerHooks } from 'node:module'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
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

const here = dirname(fileURLToPath(import.meta.url))
const theme = resolve(here, '../docs/.vitepress/theme')
const core = process.env.STORYFEED_CORE || '/Users/jasper/Dev/projects/storyfeed'
const check = process.argv.includes('--check')

const { BASE_VERBS } = await import(`${theme}/world.ts`)
const { INTENTS } = await import(`${theme}/samples.ts`)
const { PACKS } = await import(`${theme}/worlds/index.ts`)

const ROLES = ['actor', 'object', 'target', 'context', 'instrument']

/** A payload entity as an array-source entity: the keys a source item takes. */
function entityOf(entity) {
  if (!entity) return null
  const item = { type: entity.type, id: String(entity.id), label: entity.label }
  if (entity.url) item.url = entity.url
  if (entity.data && Object.keys(entity.data).length) item.data = entity.data
  if (entity.body) item.body = entity.body
  return item
}

/** A row as a source item. Rows are wall-clock times written with a `Z`. */
function itemOf(row) {
  const item = { id: row.id, verb: row.verb, published_at: `${row.at.replace(' ', 'T')}:00Z` }
  for (const role of ROLES) {
    if (row[role]) item[role] = entityOf(row[role])
  }
  if (row.data) item.data = row.data
  return item
}

export function payloadsFile(name) {
  return resolve(theme, 'worlds', name, 'payloads.json')
}

/** Core's payload node for every row of one pack, keyed by row id, in the order core reads them. */
export function generate(pack) {
  const verbs = { ...BASE_VERBS, ...pack.verbs }
  const input = {
    verbs: Object.fromEntries(Object.entries(verbs).map(([verb, w]) => [verb, { headline: w.headline, glyph: w.glyph }])),
    intents: INTENTS,
    items: pack.rows.map(itemOf),
  }

  const output = execFileSync(process.env.PHP_BINARY || 'php', [resolve(here, 'payloads/read.php'), core], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })

  return `${JSON.stringify(JSON.parse(output), null, 2)}\n`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!existsSync(resolve(core, 'vendor/autoload.php'))) {
    console.log(`payloads: core not at ${core} — skipped (set STORYFEED_CORE to run it here)`)
    process.exit(check ? 0 : 1)
  }

  let stale = 0
  for (const [name, pack] of Object.entries(PACKS)) {
    const file = payloadsFile(name)
    const fresh = generate(pack)
    if (check) {
      if (!existsSync(file) || readFileSync(file, 'utf8') !== fresh) {
        console.error(`payloads: ${name} does not match core. Run \`npm run payloads\`.`)
        stale++
      }
    } else {
      writeFileSync(file, fresh)
      console.log(`payloads: wrote ${pack.rows.length} nodes for ${name}`)
    }
  }

  if (check && stale === 0) console.log('payloads: every world matches core')
  process.exit(stale ? 1 : 0)
}
