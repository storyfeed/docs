import { USERS, PLACES, DISHES, ORDERS, DEVICES, PHOTOS, PARTIES, NOTES, TICKET } from './manifest'

/**
 * Payload-shaped sample data for the docs.
 *
 * Every page that renders a feed builds its nodes here rather than inline, for
 * one reason: a page that hand-rolls its own node objects will eventually omit a
 * key the payload really carries, and then the example is quietly a fiction. It
 * happened on the anatomy page — an example comment with no `component`, which is
 * why the comment preview could not render.
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
    component: null,
    data: {},
    media: null,
    body: null,
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
 * `component` names the body component the renderer resolves for the preview.
 */
export const note = (id: string, body: string) =>
  entity('note', id, body, null, { component: 'Note', data: { excerpt: body } })

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
  'order.completed': 'success',
  'order.paid': 'success',
  '*.moderation.photo_approved': 'success',
  'order.cancelled': 'danger',
  '*.menu.dish_off': 'danger',
  'order.placed': 'pending',
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
    data: over.data ?? {},
    thread: over.thread ?? null,
  }
}

/**
 * A group node. Note what is absent: no singular role keys. A group carries
 * exemplars and distinct counts instead, which is contract, not styling.
 */
export function group(over: Record<string, any>) {
  return {
    kind: 'group',
    id: over.id,
    verb: over.verb,
    axis: over.axis,
    count: over.count,
    published_at: over.published_at,
    headline_template: over.headline_template,
    headline: null,
    glyph: over.glyph ?? null,
    glyph_intent:
      over.glyph_intent ?? resolveIntent(over.objects?.[0]?.type ?? null, over.verb),
    exemplars: {
      actors: over.actors ?? [],
      objects: over.objects ?? [],
      targets: over.targets ?? [],
      contexts: over.contexts ?? [],
    },
    distinct: over.distinct ?? {},
    children: over.children ?? [],
    children_truncated: over.children_truncated ?? false,
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
    id: 'scene-order', verb: 'placed', glyph: 'shopping-bag',
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
  { verb: 'discussion.asked', glyph: 'message-circle', headline_template: ':actor asked about :target',
    actor: () => who.customer3, object: () => notes.spice, target: () => dishes.chickenCurry },
  { verb: 'confirmed', glyph: 'circle-check', headline_template: ':actor confirmed :object',
    actor: () => who.cook, object: () => orders.fifth },
  { verb: 'paid', glyph: 'credit-card', headline_template: ':actor marked :object paid',
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
