import { activity, group } from './samples'
export { activity, group, tombstone } from './samples'
import { APP_KINDS, type AppKind, type Row, type VerbWording, type WorldPack } from './worlds/contract'
import { PACKS } from './worlds'

/**
 * ── The world ────────────────────────────────────────────────────────────────
 *
 * One setting that every page's feeds are drawn from, so a reader moving
 * between pages meets one cast rather than many sets of samples. The setting
 * itself is a PACK (worlds/), chosen by one config value; this file knows
 * nothing about any of them.
 *
 * Pages speak in ROLES and SCENES (worlds/contract.ts):
 *
 *   {{ role.customer.label }} · <FeedExample :items="[scene.order]" />
 *   <FeedExample :items="liveOf(scene.glance)" days />
 *
 * and never name a pack's people or pick its rows by id, so swapping the pack
 * swaps every example on the site.
 */

// ── Which pack, and when "now" is ───────────────────────────────────────────

const env = ((import.meta as any).env ?? {}) as Record<string, string | undefined>

/** The active pack: `VITE_WORLD_PACK=<name>` at build time, or the default. */
export const WORLD_PACK_NAME = env.VITE_WORLD_PACK ?? 'stranger-things'

export const pack: WorldPack = PACKS[WORLD_PACK_NAME] ?? (() => {
  throw new Error(`No world pack "${WORLD_PACK_NAME}". Known: ${Object.keys(PACKS).join(', ')}`)
})()

/** The instant the pack is written against. */
export const WORLD_CANONICAL_NOW = Date.parse(pack.canonicalNow)

/**
 * "Now", for every page. Set it to any instant (`VITE_WORLD_ANCHOR=…` at build
 * time) and every activity keeps its distance from now: "15m ago" stays "15m
 * ago" and the dates move. Unset, it is the pack's own now, so the pack's dates
 * come out exactly. An anchor at the same clock time keeps every row on the
 * same side of midnight; another time moves the day boundaries with it, as a
 * real feed's would.
 */
export const WORLD_ANCHOR = env.VITE_WORLD_ANCHOR ? Date.parse(env.VITE_WORLD_ANCHOR) : WORLD_CANONICAL_NOW

// ── Verbs ────────────────────────────────────────────────────────────────────

/**
 * The verbs the contract's scenes use, and a few every app has. A pack adds
 * its own, or rewords these, in `pack.verbs`.
 */
export const BASE_VERBS: Record<string, VerbWording> = {
  place:    { glyph: 'shopping-bag', headline: ':actor placed :object with :target',
              repeat: ':actor placed :count orders with :target', actors: ':actors ordered from :target' },
  confirm:  { glyph: 'circle-check', headline: ':actor confirmed :object', repeat: ':actor confirmed :count orders', object: ':actor confirmed :object :count times' },
  ask:      { glyph: 'message-circle', headline: ':actor asked about :target',
              repeat: ':actor asked about :target :count times', targets: ':actor asked about :targets' },
  pay:      { glyph: 'receipt', headline: ':actor marked :object paid', repeat: ':actor marked :count invoices paid', object: ':actor marked :object paid :count times' },
  sign:     { glyph: 'file-pen', headline: ':actor signed :object', actors: ':actors signed :objects' },
  assign:   { glyph: 'ticket', headline: ':actor assigned :object to :target' },
  open:     { glyph: 'ticket', headline: ':actor opened :object', repeat: ':actor opened :count tickets' },
  resolve:  { glyph: 'circle-check', headline: ':actor resolved :object' },
  join:     { glyph: 'user-plus', headline: ':actor joined :target', actors: ':actors joined :target' },
  create:   { glyph: 'git-merge', headline: ':actor created :object' },
  merge:    { glyph: 'git-merge', headline: ':actor merged :object into :target',
              repeat: ':actor merged :count pull requests into :target' },
  approve:  { glyph: 'circle-check', headline: ':actor approved :object' },
  star:     { glyph: 'star', headline: ':actor starred :object', actors: ':actors starred :objects' },
  complete: { glyph: 'square-check', headline: ':actor completed :object on :target',
              repeat: ':actor completed :count tasks on :target' },
  upload:   { glyph: 'image', headline: ':actor uploaded :object to :target', repeat: ':actor uploaded :count photos to :target' },
}

const verbsOf = (p: WorldPack) => ({ ...BASE_VERBS, ...p.verbs })
export const VERBS = verbsOf(pack)

// ── The two modes ──────────────────────────────────────────────────────────

const newestFirst = (rows: any[]) => [...rows].sort((a, b) => b.published_at.localeCompare(a.published_at))
const uniq = (list: any[]) =>
  list.filter((e, i) => e && list.findIndex((x) => x && x.id === e.id && x.type === e.type) === i)
const idOf = (e: any) => (e ? `${e.type}:${e.id}` : '-')
// Groups never span days, as in core: the day is part of every key.
const dayOf = (r: any) => r.published_at.slice(0, 10)
const bucket = (rows: any[], key: (r: any) => string) =>
  rows.reduce((map, r) => map.set(key(r), [...(map.get(key(r)) ?? []), r]), new Map<string, any[]>())

type Axis = 'actors' | 'actors_target' | 'targets' | 'object' | 'repeat'

/** Core's `grouping.children_limit`: the members one group node carries. */
const CHILDREN_LIMIT = 25

const fold = (verbs: Record<string, VerbWording>, axis: Axis, members: any[]) => {
  const first = members[0]
  return group({
    id: `${axis}-${first.id}`, verb: first.verb, axis, count: members.length, glyph: first.glyph,
    // No aggregate grammar is a null template, never a reason not to group.
    published_at: first.published_at, headline_template: verbs[first.verb]?.[axis] ?? (axis === 'actors_target' ? verbs[first.verb]?.actors : null) ?? null,
    // A read names a sample and counts the rest, as the payload does.
    actors: uniq(members.map((m) => m.actor)).slice(0, 3),
    objects: uniq(members.map((m) => m.object)).slice(0, 3),
    targets: uniq(members.map((m) => m.target)).slice(0, 3),
    contexts: uniq(members.map((m) => m.context)).slice(0, 3),
    // A group carries its members, as a real read does, so it expands.
    children: members.slice(0, CHILDREN_LIMIT), children_truncated: members.length > CHILDREN_LIMIT,
    distinct: {
      contexts: uniq(members.map((m) => m.context)).length,
      actors: uniq(members.map((m) => m.actor)).length,
      objects: uniq(members.map((m) => m.object)).length,
      targets: uniq(members.map((m) => m.target)).length,
    },
  })
}

/** The log: every activity, one row each, newest first. */
export function logOf(rows: any[]) {
  return newestFirst(rows)
}

/** The built-in Live precedence and persisted burst windows. */
const distinctOf = (members: any[], role: string) => uniq(members.map((m) => m[role])).length
const place = (r: any) => idOf(r.context)
const AXES: { axis: Axis; key: (r: any) => string | null; eligible: (members: any[]) => boolean }[] = [
  { axis: 'actors', key: r => r.object ? `${r.verb}|${idOf(r.object)}|${idOf(r.target)}|${place(r)}` : null,
    eligible: members => distinctOf(members, 'actor') >= 3 },
  { axis: 'actors_target', key: r => r.target ? `${r.verb}|${idOf(r.target)}|${place(r)}` : null,
    eligible: members => distinctOf(members, 'actor') >= 3 },
  { axis: 'targets', key: r => r.actor ? `${idOf(r.actor)}|${r.verb}|${place(r)}` : null,
    eligible: members => distinctOf(members, 'target') >= 2 && members.length >= 3 },
  { axis: 'object', key: r => r.object ? `${idOf(r.actor)}|${r.verb}|${idOf(r.object)}|${idOf(r.target)}|${place(r)}` : null,
    eligible: members => members.length >= 2 },
  { axis: 'repeat', key: r => `${idOf(r.actor)}|${r.verb}|${r.object?.type ?? ''}|${idOf(r.target)}|${place(r)}`,
    eligible: () => true },
]

/** Chronological sample data, using core's 15-minute gap and four-hour ceiling. */
export function liveOf(rows: any[], verbs = VERBS, within = 15 * 60_000, ceiling = 4 * 3_600_000) {
  const chronological = [...rows].sort((a, b) => a.published_at.localeCompare(b.published_at) || String(a.id).localeCompare(String(b.id)))
  const clusters = AXES.map(({ key }) => {
    const open = new Map<string, { start: number; last: number; members: any[] }>()
    const membership = new Map<any, any[]>()
    for (const row of chronological) {
      const logical = key(row)
      if (logical === null) continue
      const time = Date.parse(row.published_at)
      let burst = open.get(logical)
      if (!burst || time - burst.last >= within || time - burst.start >= ceiling) {
        burst = { start: time, last: time, members: [] }
        open.set(logical, burst)
      }
      burst.last = time
      burst.members.push(row)
      membership.set(row, burst.members)
    }
    return membership
  })
  const winners = new Map<any[], { axis: Axis; members: any[] }>()
  for (const row of chronological) {
    const i = AXES.findIndex(({ eligible }, i) => clusters[i].has(row) && eligible(clusters[i].get(row)!))
    const cluster = clusters[i].get(row)!
    if (!winners.has(cluster)) winners.set(cluster, { axis: AXES[i].axis, members: [] })
    winners.get(cluster)!.members.push(row)
  }
  const nodes = [...winners.values()].map(({ axis, members }) => members.length === 1
    ? members[0] : fold(verbs, axis, newestFirst(members)))
  return nodes.sort((a, b) => b.published_at.localeCompare(a.published_at)
    || (a.kind === 'group' ? 0 : 1) - (b.kind === 'group' ? 0 : 1)
    || String(b.id).localeCompare(String(a.id)))
}

// ── Rows as payload nodes ────────────────────────────────────────────────────

const micro = (ms: number) => new Date(ms).toISOString().replace(/\.(\d{3})Z$/, '.$1000Z')
const localMs = (at: string) => Date.parse(`${at.replace(' ', 'T')}:00Z`)

/**
 * Everything a pack offers, on one anchor. The module's own exports below are
 * this for the active pack and WORLD_ANCHOR; tests build others.
 */
export function worldOf(p: WorldPack, anchor = Date.parse(p.canonicalNow)) {
  const verbs = verbsOf(p)
  const canonicalNow = Date.parse(p.canonicalNow)
  const byId = new Map(p.rows.map((r) => [r.id, r]))

  const nodeOf = (r: Row) => {
    const verb = verbs[r.verb]
    if (!verb) throw new Error(`Row "${r.id}": no wording for verb "${r.verb}"`)
    return activity({
      id: r.id,
      verb: r.verb,
      glyph: verb.glyph,
      published_at: micro(localMs(r.at) + (anchor - canonicalNow)),
      headline_template: r.headline ?? verb.headline,
      actor: r.actor,
      object: r.object ?? null,
      target: r.target ?? null,
      context: r.context ?? null,
      instrument: r.instrument ?? null,
      data: r.data ?? null,
    })
  }

  const one = (id: string) => {
    const r = byId.get(id)
    if (!r) throw new Error(`Pack "${p.name}" has no row "${id}"`)
    return nodeOf(r)
  }
  const many = (ids: string[]) => ids.map(one)

  const s = p.scenes
  const unique = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) === i)
  const glanceIds = unique([...s.busyPlace, ...s.repeats.flat(), s.distant, ...s.cameo, ...s.around])

  const deeper = s.deeper
  const scene = {
    cookbook: {
      delegated: { business: one(s.cookbook.delegated.business), audit: one(s.cookbook.delegated.audit) },
      verbChoices: Object.fromEntries(Object.entries(s.cookbook.verbChoices).map(([key, id]) => [key, one(id)])),
      rewrites: many(s.cookbook.rewrites),
      actorless: { anonymous: one(s.cookbook.actorless.anonymous), paid: one(s.cookbook.actorless.paid), expired: one(s.cookbook.actorless.expired) },
      transitions: { confirmed: one(s.cookbook.transitions.confirmed), timeline: many(s.cookbook.transitions.timeline) },
      pricing: many(s.cookbook.pricing),
      computed: one(s.cookbook.computed),
      deletion: one(s.cookbook.deletion),
      discussion: one(s.cookbook.discussion),
      grouped: { repeat: many(s.cookbook.grouped.repeat), actors: many(s.cookbook.grouped.actors) },
    },
    deeper: {
      body: { progress: one(deeper.body.progress) },
      aggregation: { orders: many(deeper.aggregation.orders), customers: many(deeper.aggregation.customers), menu: many(deeper.aggregation.menu), contexts: many(deeper.aggregation.contexts) },
      latestPerObject: { timeline: many(deeper.latestPerObject.timeline), board: many(deeper.latestPerObject.board),
        confirmations: many(deeper.latestPerObject.confirmations) },
      parties: { system: one(deeper.parties.system) },
      keepingLatest: { saves: many(deeper.keepingLatest.saves) },
      groupingPeriods: { orders: many(deeper.groupingPeriods.orders) },
      retention: { views: many(deeper.retention.views) },
      composites: { tasks: many(deeper.composites.tasks) },
    },
    /** A customer places an order with the shop: the standard example. */
    order: one(s.order),
    /** A customer asks about a product, with a note. */
    question: one(s.question),
    /** One row each from a task tracker, a code host, billing, e-signature, a support desk and a team. */
    otherApps: Object.fromEntries(
      (Object.keys(APP_KINDS) as AppKind[]).map((kind) => [kind, one(s.otherApps[kind])]),
    ) as Record<AppKind, any>,
    /** Three or more people at one place: Live folds them into one `actors` group. */
    busyPlace: many(s.busyPlace),
    /** Runs of one person doing one thing again: Live folds each. */
    repeats: s.repeats.map(many),
    /** One row from long ago. */
    distant: one(s.distant),
    /** Jasper's rows. */
    cameo: many(s.cameo),
    /** The short, wide feed: every scene above that belongs in one, and the rows around them. Newest first. */
    glance: logOf(many(glanceIds)),
    guide: {
      usageExamples: {
        repeatOrders: many(s.guide.usageExamples.repeatOrders),
        photos: many(s.guide.usageExamples.photos),
      },
    },
    basics: {
      reading: { note: one(s.basics.reading.note) },
      // Includes the ItemList and both MediaObject link lessons, resolved from pack rows.
      // Includes authored records in plain, verbatim, Markdown and HTML form.
      activityContent: Object.fromEntries(Object.entries(s.basics.activityContent).map(([key, id]) => [key, one(id)])) as Record<keyof typeof s.basics.activityContent, any>,
      recording: {
        paid: one(s.basics.recording.paid),
        priced: one(s.basics.recording.priced),
        photos: many(s.basics.recording.photos),
      },
      feedFile: {
        completed: one(s.basics.feedFile.completed),
        created: one(s.basics.feedFile.created),
      },
      namedFeeds: { shop: many(s.basics.namedFeeds.shop) },
    },
  }

  /** Every row published by the anchor (the future is left out), newest first. */
  const everything = () => logOf(p.rows.filter((r) => localMs(r.at) <= canonicalNow).map(nodeOf))

  return {
    pack: p, anchor, scene, role: p.roles, everything, nodeOf,
    liveOf: (rows: any[]) => liveOf(rows, verbs),
  }
}

const active = worldOf(pack, WORLD_ANCHOR)

/** The scenes, as payload nodes on the present anchor. */
export const scene = active.scene
/** The roles, as entities: `role.customer`, `role.shop`, `role.product`, `role.staff`, `role.service`. */
export const role = active.role
/** The whole pack, for the long feeds later in the docs. */
export const everything = active.everything


/**
 * One row to sit around an example (`<FeedExample context>`): an ordinary
 * activity from the active pack, re-dated beside the row it surrounds, so the
 * padding swaps with the world like everything else.
 */
let pool: any[] | null = null
export function surrounding(index: number, at: string, id: string) {
  pool ??= everything().filter((node: any) => node.kind === 'activity')

  return { ...pool[index % pool.length], id, published_at: at }
}
