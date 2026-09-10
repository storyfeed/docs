import { USERS, PROJECTS, CLIENTS, DOCUMENTS, TASKS, COMMENTS } from './manifest'

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
    ...over,
  }
}

export const user = (id: string, label: string) => entity('user', id, label, `/users/${id}`)
export const project = (id: string, label: string) => entity('project', id, label, `/projects/${id}`)
export const client = (id: string, label: string) => entity('client', id, label, `/clients/${id}`)
export const document = (id: string, label: string) => entity('document', id, label, `/documents/${id}`)
export const task = (id: string, label: string) => entity('task', id, label, `/tasks/${id}`)

/**
 * A comment has no page of its own, so its url is null and its label is its body.
 * Shown whole, not clipped: the demo app truncates at 80 characters, but these are
 * docs and a reader should see the text the example is talking about.
 *
 * `component` names the body component the renderer resolves for the preview.
 */
export const comment = (id: string, body: string) =>
  entity('comment', id, body, null, {
    component: 'Note',
    data: { excerpt: body },
  })

/**
 * The cast, built from the manifest. Ids come from position in the manifest, so a
 * page only ever names a key.
 *
 *   who.ines · where.portMigration · firm.chirp · doc.annualReportV3 ·
 *   job.simplifyWordmark · note.breakpoint
 */
const build = (source: Record<string, string>, make: (id: string, label: string) => any) =>
  Object.fromEntries(
    Object.entries(source).map(([key, label], index) => [key, make(String(index + 1), label)]),
  )

export const who: Record<string, any> = build(USERS, user)
export const where: Record<string, any> = build(PROJECTS, project)
export const firm: Record<string, any> = build(CLIENTS, client)
export const doc: Record<string, any> = build(DOCUMENTS, document)
export const job: Record<string, any> = build(TASKS, task)
export const note: Record<string, any> = build(COMMENTS, comment)

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
  '*.approve': 'success',
  '*.complete': 'success',
  '*.sign': 'success',
  '*.expire': 'danger',
  '*.document.remove': 'danger',
  '*.submit': 'pending',
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
