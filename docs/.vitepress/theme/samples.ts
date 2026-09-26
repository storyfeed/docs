/**
 * Payload-shaped sample data for the docs.
 *
 * Every page that renders a feed builds its nodes here rather than inline, for
 * one reason: a page that hand-rolls its own node objects will eventually omit a
 * key the payload really carries, and then the example is quietly a fiction. It
 * happened on the anatomy page — an example comment missing the key its preview
 * was drawn from, which is why the comment preview could not render.
 *
 * Who and what the rows are about is the world's business (world.ts and
 * worlds/); this file only knows the payload's shapes.
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
 * A group node with the singular roles pinned by its axis, plus samples and
 * distinct counts for all roles.
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

  // NodePresenter uses the axis's pinned roles, independently of its headline.
  const pins: Record<string, string[]> = {
    repeat: ['actor', 'target'], actors: ['target'], targets: ['actor'],
    object: ['actor', 'object'], composite: ['actor', 'target', 'context'],
    scene: ['context'], summary: ['actor'],
  }
  for (const role of roles) {
    const key = `${role}s`
    const pinned = (pins[over.axis] ?? []).includes(role)
    singulars[role] = pinned && sample[key].length === 1 && distinct[key] === 1 ? sample[key][0] : null
  }

  return {
    kind: 'group',
    id: over.id,
    axis: over.axis,
    // A summary row adds its period and its phrases, one per verb.
    ...(over.phrases ? { period: over.period ?? 'day' } : {}),
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
    ...(over.phrases ? { phrases: over.phrases } : {}),
    children: over.children ?? [],
    children_truncated: over.children_truncated ?? over.count > (over.children?.length ?? 0),
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
