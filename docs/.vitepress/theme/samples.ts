import { USERS, PLACES, DISHES, ORDERS, DEVICES, PHOTOS, PARTIES, NOTES, TICKET } from './manifest'

/**
 * Payload-shaped sample data for the docs.
 *
 * Every page that renders a feed builds its nodes here rather than inline, for
 * one reason: a page that hand-rolls its own node objects will eventually omit a
 * key the payload really carries, and then the example is quietly a fiction. It
 * happened on the anatomy page — an example comment missing the key its preview
 * was drawn from, which is why the comment preview could not render.
 *
 * The names are consistent across pages on purpose. The quickstart's document is
 * annual-report-v3.fig in Password Crackdown, so the introduction's is too, and a
 * reader moving between pages sees one running example rather than four.
 */

/** The entity shape from the payload contract, in full — never a subset. */
export function entity(
  type: string,
  id: string,
  label: string,
  url: string | null,
  over: Record<string, any> = {},
) {
  return {
    type,
    id,
    label,
    url,
    attributes: {},
    modal: false,
    data: {},
    media: null,
    body: null,
    tombstone: null,
    ...over,
  }
}

export const user = (id: string, label: string) => entity('user', id, label, `/users/${id}`)
export const place = (id: string, label: string) => entity('kitchen', id, label, `/kitchens/${id}`)
export const dish = (id: string, label: string) => entity('menu_item', id, label, `/menu/${id}`)
export const order = (id: string, label: string) => entity('order', id, label, `/orders/${id}`)
export const device = (id: string, label: string) => entity('kitchen_device', id, label, null)
/**
 * A photo entity, carrying the media a resolver minted for it.
 *
 * `preview` is the derivative a feed paints and `url` is the resource itself,
 * which for a photograph IS an image — the payload's own distinction, and the
 * reason `entity.url` and `media.url` hold the same location.
 */
export const photo = (id: string, label: string) => {
    const file = label.replace(/\.jpg$/, '')

    return entity('photo', id, label, `/media/${file}.svg`, {
        media: {
            icon: null,
            image: null,
            preview: { src: `/media/${file}.svg`, mediaType: 'image/svg+xml', width: 400, height: 300, alt: null },
            url: { src: `/media/${file}.svg`, mediaType: 'image/svg+xml', width: 400, height: 300, alt: null },
        },
    })
}

/**
 * A note has no page of its own, so its url is null and its label is its text.
 * Its preview is a `Storyfeed/Body/Component` body: the app's own `Note`
 * component, by name, with its props.
 */
export const note = (id: string, body: string) =>
  entity('note', id, body, null, {
    body: [{ $body: 'Storyfeed/Body/Component', $v: 1, name: 'Note', props: { excerpt: body } }],
  })

/**
 * What a deleted entity leaves behind: `type` is `storyfeed.tombstone`, the
 * id is the tombstone's own, and `url` is null. The label is null unless the
 * model kept it (`keepLabel()`).
 */
export function tombstone(
  formerType: string,
  id: string,
  deleted: string | null,
  over: { label?: string | null; approximate?: boolean } = {},
) {
  return entity('storyfeed.tombstone', id, over.label ?? null as any, null, {
    tombstone: { formerType, deleted, approximate: over.approximate ?? false, removedBy: null },
  })
}

const ROLES = ['actor', 'object', 'target', 'context', 'origin', 'result', 'instrument']

const isTombstone = (entity: any) => entity?.type === 'storyfeed.tombstone'

/**
 * Core's default for which roles a verb is about: the object, unless the verb
 * is a removal (the removal verbs these samples use).
 * A page passes `missing` when its verb says otherwise.
 */
const REMOVALS = ['delete', 'discard', 'remove', 'restore', 'undo']
const aboutRoles = (verb: string) => (REMOVALS.includes(verb) ? [] : ['object'])

/**
 * The cast, built from the manifest. Ids come from position in the manifest, so a
 * page only ever names a handle:
 *
 *   who.cook · where.kitchen · dishes.chickenCurry · orders.first · devices.ipad ·
 *   photos.curry · notes.spice · party.service
 */
const build = (source: Record<string, string>, make: (id: string, label: string) => any) =>
  Object.fromEntries(
    Object.entries(source).map(([key, label], index) => [key, make(String(index + 1), label)]),
  )

export const who: Record<string, any> = build(USERS, user)
export const where: Record<string, any> = build(PLACES, place)
export const dishes: Record<string, any> = build(DISHES, dish)
export const orders: Record<string, any> = build(ORDERS, order)
export const devices: Record<string, any> = build(DEVICES, device)
export const photos: Record<string, any> = build(PHOTOS, photo)
export const notes: Record<string, any> = build(NOTES, note)
/** Plain strings, not entities: an order's own text, carried on its snapshot. */
export { INSTRUCTIONS } from './manifest'

/**
 * An order's lines as `Storyfeed/Body/KeyValue` rows, priced and totalled.
 *
 * Built from the manifest rather than written into a page, so renaming a dish
 * moves every ticket on the site with it.
 */
/**
 * The same lines as authored text, one per line.
 *
 * A reader sees a ticket; a renderer sees one string. That gap is the whole
 * argument for a structured form, so the text version is written as well as
 * text can be written rather than deliberately badly.
 */
export function ticketText(key: string) {
  const money = (amount: number) => `$${amount.toFixed(2)}`
  const lines = TICKET[key] ?? []

  return [
    ...lines.map(
      (line) => `${line.qty} × ${DISHES[line.dish as keyof typeof DISHES]} — ${money(line.qty * line.unit)}`,
    ),
    `Total — ${money(lines.reduce((sum, line) => sum + line.qty * line.unit, 0))}`,
  ].join('\n')
}

export function ticketRows(key: string) {
  const money = (amount: number) => `$${amount.toFixed(2)}`
  const lines = TICKET[key] ?? []

  return [
    ...lines.map((line) => ({
      key: `${line.qty} × ${DISHES[line.dish as keyof typeof DISHES]}`,
      value: money(line.qty * line.unit),
      verbatim: false,
      missing: null,
    })),
    {
      key: 'Total',
      value: money(lines.reduce((sum, line) => sum + line.qty * line.unit, 0)),
      verbatim: false,
      missing: null,
    },
  ]
}
/** A party has no page of its own. */
export const party: Record<string, any> = build(PARTIES, (id, label) => entity('storyfeed.party', id, label, null))

/**
 * ── The demo app's glyph intents ─────────────────────────────────────────────
 *
 * `glyph_intent` is a free-form string OWNED BY THE RECORDING APP. Storyfeed
 * ships no vocabulary of intents — `success` is not a term the package knows,
 * ranks or validates — so these three words are this documentation's own,
 * exactly as an app registering them would be its own. A renderer maps them
 * onto a palette it owns; `feed.css` maps these onto three.
 *
 * In a real app this is one registration:
 *
 *   Storyfeed::glyphIntents([
 *       '*.approve' => 'success',
 *       ...
 *   ]);
 *
 * Keys are `type.verb` with wildcards, resolved most-specific first —
 * `type.verb`, `type.*`, `*.verb`, `*.*` — which is `resolveIntent` below and
 * is the same ladder core resolves the icon on, in a registry of its own so a
 * wildcard intent is stated once rather than repeated at every rung.
 *
 * Most verbs are deliberately ABSENT. An upload is not a success or a failure,
 * it is an upload, and inventing a word for it would make the colour mean
 * nothing. Null is the honest answer and the common one.
 */
export const INTENTS: Record<string, string> = {
  'order.complete': 'success',
  'order.pay': 'success',
  'order.cancel': 'danger',
  'order.place': 'pending',
}

/** Core's resolution ladder, ported: `type.verb`, `type.*`, `*.verb`, `*.*`. */
export function resolveIntent(type: string | null, verb: string): string | null {
  const keys =
    type === null ? [`*.${verb}`, '*.*'] : [`${type}.${verb}`, `${type}.*`, `*.${verb}`, '*.*']

  for (const key of keys) {
    if (key in INTENTS) return INTENTS[key]
  }

  return null
}

/** An activity node. */
export function activity(over: Record<string, any>) {
  return {
    kind: 'activity',
    id: over.id,
    verb: over.verb,
    published_at: over.published_at,
    headline_template: over.headline_template,
    headline: null,
    glyph: over.glyph ?? null,
    // Resolved from the registry rather than written per node, for the same
    // reason the whole file exists: a page that spells its own intent out will
    // eventually spell a different one for the same verb.
    glyph_intent:
      over.glyph_intent ?? resolveIntent(over.object?.type ?? null, over.verb),
    actor: over.actor ?? null,
    object: over.object ?? null,
    target: over.target ?? null,
    context: over.context ?? null,
    origin: over.origin ?? null,
    result: over.result ?? null,
    instrument: over.instrument ?? null,
    data: over.data ?? {},
    thread: over.thread ?? null,
    change: over.change ?? null,
    ...tombstoneFacts(over),
  }
}

/**
 * `tombstoned`, `redundant`, and the verb's own reading once redundant.
 *
 * A page names the roles its verb is about with `missing` when they are not
 * the default, as `->missing()` does. A node spread into another
 * (`{ ...scenes.order, object: tombstone(…) }`) brings its own facts along, and
 * they describe the roles it had, so they are always worked out again.
 *
 * A page passes `missing_headline_template` when its verb declares
 * `->missingHeadline()`; core fills it only while `redundant` is true, so the
 * sample does too, and a page cannot show one on a live row by accident.
 */
function tombstoneFacts(over: Record<string, any>) {
  const tombstoned = ROLES.filter((role) => isTombstone(over[role]))
  const about: string[] = over.missing ?? aboutRoles(over.verb)
  const derived = tombstoned.some((role) => about.includes(role))
  const redundant = over.kind === 'activity' ? derived : over.redundant ?? derived

  return {
    tombstoned,
    redundant,
    missing_headline_template: redundant ? over.missing_headline_template ?? null : null,
    missing_headline: redundant ? over.missing_headline ?? null : null,
  }
}

/**
 * A group node. Note what is absent: no singular role keys. A group carries
 * the sample and distinct counts instead, which is contract, not styling.
 */
export function group(over: Record<string, any>) {
  // Core's NodePresenter::groupNode(), key for key and in its order: seven
  // singular role keys, then a sample list and a distinct total for all seven.
  const roles = ['actor', 'object', 'target', 'context', 'origin', 'result', 'instrument']
  const sample: Record<string, any[]> = {}
  const distinct: Record<string, number> = {}
  const singulars: Record<string, any> = {}

  for (const role of roles) {
    const key = `${role}s`
    sample[key] = over[key] ?? []
    distinct[key] = Math.max(over.distinct?.[key] ?? 0, sample[key].length)
  }

  // Core fills a singular key when the axis pins its token and exactly one
  // entity holds the role. The samples have no axis registry, so the template
  // stands in for the pinned tokens: `:actor` pins, `:actors` does not.
  for (const role of roles) {
    const key = `${role}s`
    const pinned = new RegExp(`:${role}(?![a-z_])`).test(over.headline_template ?? '')
    singulars[role] = pinned && sample[key].length === 1 && distinct[key] === 1 ? sample[key][0] : null
  }

  return {
    kind: 'group',
    id: over.id,
    axis: over.axis,
    count: over.count,
    verb: over.verb,
    published_at: over.published_at,
    headline_template: over.headline_template,
    headline: null,
    glyph: over.glyph ?? null,
    glyph_intent:
      over.glyph_intent ?? resolveIntent(over.objects?.[0]?.type ?? null, over.verb),
    ...singulars,
    sample,
    distinct,
    children: over.children ?? [],
    children_truncated: over.children_truncated ?? false,
    ...groupTombstoneFacts(over, sample, distinct),
  }
}

function groupTombstoneFacts(over: Record<string, any>, sample: Record<string, any[]>, distinct: Record<string, number>) {
  const counts: Record<string, number> = {}

  for (const role of ROLES) {
    const key = `${role}s`
    counts[key] = over.distinct_tombstoned?.[key] ?? sample[key].filter(isTombstone).length
  }

  const tombstoned = ROLES.filter((role) => counts[`${role}s`] > 0)
  const children: any[] = over.children ?? []

  return {
    tombstoned,
    redundant: over.redundant ?? (children.length > 0 && children.every((child) => child.redundant)),
    distinct_tombstoned: counts,
  }
}

/**
 * ── The standard example ─────────────────────────────────────────────────────
 *
 * The one activity the elementary snippet (`docs/snippets/publish.php`) records,
 * as the feed shows it. A page that embeds the snippet renders this beneath it,
 * so the standard example is chosen in two files and nowhere else.
 */
export const scenes = {
  order: activity({
    id: 'scene-order', verb: 'place', glyph: 'shopping-bag',
    published_at: '2026-08-14T14:30:00.000000Z',
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.first, target: where.kitchen,
  }),
}

/**
 * ── Rows to sit around an example ────────────────────────────────────────────
 *
 * `<FeedExample context>` puts an example inside a running feed, so the rail
 * reads as a line through the day rather than a mark beside one row. These are
 * ordinary activities from the same kitchen, not chrome: they are dimmed by
 * the card, but a reader who looks at them finds real rows.
 *
 * Their timestamps are assigned at render time, around whatever they surround.
 */
export const SURROUNDING = [
  { verb: 'ready', glyph: 'utensils', headline_template: ':actor marked :object ready',
    actor: () => who.cook, object: () => orders.fourth },
  { verb: 'ask', glyph: 'message-circle', headline_template: ':actor asked about :target',
    actor: () => who.customer3, object: () => notes.spice, target: () => dishes.chickenCurry },
  { verb: 'confirm', glyph: 'circle-check', headline_template: ':actor confirmed :object',
    actor: () => who.cook, object: () => orders.fifth },
  { verb: 'pay', glyph: 'credit-card', headline_template: ':actor marked :object paid',
    actor: () => party.service, object: () => orders.second },
]

/** One surrounding row, minted at an offset from the activity it sits beside. */
export function surrounding(index: number, at: string, id: string) {
  const spec = SURROUNDING[index % SURROUNDING.length]

  return activity({
    id,
    verb: spec.verb,
    glyph: spec.glyph,
    published_at: at,
    headline_template: spec.headline_template,
    actor: spec.actor(),
    object: spec.object?.(),
    target: spec.target?.(),
  })
}
