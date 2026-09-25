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
  confirm:  { glyph: 'circle-check', headline: ':actor confirmed :object', repeat: ':actor confirmed :count orders' },
  ask:      { glyph: 'message-circle', headline: ':actor asked about :target',
              repeat: ':actor asked about :target :count times', targets: ':actor asked about :targets' },
  pay:      { glyph: 'receipt', headline: ':actor marked :object paid', repeat: ':actor marked :count invoices paid' },
  sign:     { glyph: 'file-pen', headline: ':actor signed :object', actors: ':actors signed :object' },
  assign:   { glyph: 'ticket', headline: ':actor assigned :object to :target' },
  open:     { glyph: 'ticket', headline: ':actor opened :object', repeat: ':actor opened :count tickets' },
  resolve:  { glyph: 'circle-check', headline: ':actor resolved :object' },
  join:     { glyph: 'user-plus', headline: ':actor joined :target', actors: ':actors joined :target' },
  create:   { glyph: 'git-merge', headline: ':actor created :object' },
  merge:    { glyph: 'git-merge', headline: ':actor merged :object into :target',
              repeat: ':actor merged :count pull requests into :target' },
  approve:  { glyph: 'circle-check', headline: ':actor approved :object' },
  star:     { glyph: 'star', headline: ':actor starred :object', actors: ':actors starred :object' },
  complete: { glyph: 'square-check', headline: ':actor completed :object on :target',
              repeat: ':actor completed :count tasks on :target' },
  upload:   { glyph: 'image', headline: ':actor uploaded :object to :target', repeat: ':actor uploaded :count photos to :target' },
}

const verbsOf = (p: WorldPack) => ({ ...BASE_VERBS, ...p.verbs })
export const VERBS = verbsOf(pack)

// ── The three modes ──────────────────────────────────────────────────────────

const newestFirst = (rows: any[]) => [...rows].sort((a, b) => b.published_at.localeCompare(a.published_at))
const uniq = (list: any[]) =>
  list.filter((e, i) => e && list.findIndex((x) => x && x.id === e.id && x.type === e.type) === i)
const idOf = (e: any) => (e ? `${e.type}:${e.id}` : '-')
// Groups never span days, as in core: the day is part of every key.
const dayOf = (r: any) => r.published_at.slice(0, 10)
const bucket = (rows: any[], key: (r: any) => string) =>
  rows.reduce((map, r) => map.set(key(r), [...(map.get(key(r)) ?? []), r]), new Map<string, any[]>())

const fold = (verbs: Record<string, VerbWording>, axis: 'repeat' | 'actors' | 'targets', members: any[]) => {
  const first = members[0]
  return group({
    id: `${axis}-${first.id}`, verb: first.verb, axis, count: members.length, glyph: first.glyph,
    published_at: first.published_at, headline_template: verbs[first.verb][axis],
    // A read names a sample and counts the rest, as the payload does.
    actors: uniq(members.map((m) => m.actor)).slice(0, 3),
    objects: uniq(members.map((m) => m.object)).slice(0, 3),
    targets: uniq(members.map((m) => m.target)).slice(0, 3),
    // A group carries its members, as a real read does, so it expands.
    children: members, children_truncated: false,
    distinct: {
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

const repeats = (rows: any[], verbs: Record<string, VerbWording>) =>
  [...bucket(rows, (r) => `${dayOf(r)}|${idOf(r.actor)}|${r.verb}|${idOf(r.target)}`).values()]
    .flatMap((members) => (members.length > 1 && verbs[members[0].verb]?.repeat ? [fold(verbs, 'repeat', newestFirst(members))] : members))

/** Live: repeats fold (one person, one verb, one target, one day); nothing else does. */
export function liveOf(rows: any[], verbs = VERBS) {
  return newestFirst(repeats(rows, verbs))
}

/**
 * Summary: also many people into one target (3 or more), and one person
 * across targets (2 or more), before repeats.
 */
export function summaryOf(rows: any[], verbs = VERBS) {
  let rest = rows
  const out: any[] = []
  for (const members of bucket(rest, (r) => `${dayOf(r)}|${r.verb}|${idOf(r.target)}|${idOf(r.object)}`).values()) {
    if (verbs[members[0].verb]?.actors && uniq(members.map((m) => m.actor)).length >= 3) {
      out.push(fold(verbs, 'actors', newestFirst(members)))
      rest = rest.filter((r) => !members.includes(r))
    }
  }
  for (const members of bucket(rest, (r) => `${dayOf(r)}|${idOf(r.actor)}|${r.verb}`).values()) {
    if (verbs[members[0].verb]?.targets && uniq(members.map((m) => m.target)).length >= 2) {
      out.push(fold(verbs, 'targets', newestFirst(members)))
      rest = rest.filter((r) => !members.includes(r))
    }
  }
  return newestFirst([...out, ...repeats(rest, verbs)])
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
      actorless: { anonymous: one(s.cookbook.actorless.anonymous), paid: one(s.cookbook.actorless.paid), expired: one(s.cookbook.actorless.expired) },
      transitions: { confirmed: one(s.cookbook.transitions.confirmed), timeline: many(s.cookbook.transitions.timeline) },
      pricing: many(s.cookbook.pricing),
      deletion: one(s.cookbook.deletion),
      discussion: one(s.cookbook.discussion),
      grouped: { repeat: many(s.cookbook.grouped.repeat), actors: many(s.cookbook.grouped.actors) },
    },
    deeper: {
      aggregation: { orders: many(deeper.aggregation.orders), customers: many(deeper.aggregation.customers) },
      latestPerObject: { timeline: many(deeper.latestPerObject.timeline), board: many(deeper.latestPerObject.board),
        confirmations: many(deeper.latestPerObject.confirmations) },
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
    /** Three or more people at one place: Summary folds them. */
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
    summaryOf: (rows: any[]) => summaryOf(rows, verbs),
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
