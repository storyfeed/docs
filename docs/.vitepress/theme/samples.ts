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
    ...over,
  }
}

export const user = (id: string, label: string) => entity('user', id, label, `/users/${id}`)
export const project = (id: string, label: string) => entity('project', id, label, `/projects/${id}`)
export const client = (id: string, label: string) => entity('client', id, label, `/clients/${id}`)
export const document = (id: string, label: string) => entity('document', id, label, `/documents/${id}`)
export const task = (id: string, label: string) => entity('task', id, label, `/tasks/${id}`)

/**
 * A comment has no page of its own, so its url is null and its label is its body
 * — the demo app's `Comment::toFeed()` limits the label to 80 characters and the
 * excerpt to 160. `component` names the body component the renderer resolves.
 */
export const comment = (id: string, body: string) =>
  entity('comment', id, body.length > 80 ? `${body.slice(0, 80)}…` : body, null, {
    component: 'Note',
    data: { excerpt: body.length > 160 ? `${body.slice(0, 160)}…` : body },
  })

/**
 * ── The cast ─────────────────────────────────────────────────────────────────
 *
 * Every person and recurring place the docs use, in one place. Change a name here
 * and every page follows.
 *
 * Keys name the part, not the person, so swapping "Ines Duarte" for someone else
 * does not leave a dozen pages importing a key that no longer matches the name it
 * returns. Ids stay stable too: they appear in entity urls, and a reader who
 * clicks one on two different pages should land somewhere consistent.
 *
 * The one thing this cannot reach is prose. Where a page names a cast member in a
 * sentence rather than in data, that sentence needs editing by hand — the anatomy
 * page does this a few times when it walks through a specific person's uploads.
 */
const PEOPLE: Record<string, [string, string]> = {
  owner: ['1', 'Jasper Tey'],
  qa: ['3', 'Bob Callahan'],
  intern: ['4', 'Sally Nguyen'],
  dev: ['5', 'Marcus Webb'],
  designer: ['6', 'Ines Duarte'],
  pm: ['7', 'Deja Williams'],
  reviewer: ['8', 'Priya Raman'],
  writer: ['9', 'Aiko Tanaka'],
  ops: ['10', 'Tomás Rivera'],
}

const PLACES: Record<string, [string, string]> = {
  migration: ['3', 'Port Migration'],
  crackdown: ['4', 'Password Crackdown'],
  pivot: ['7', 'Metaverse Pivot'],
  removal: ['9', 'Bird Removal'],
  tiers: ['12', 'Verification Tiers'],
}

const FIRMS: Record<string, [string, string]> = {
  bird: ['2', 'Chirp'],
}

const build = (source: Record<string, [string, string]>, make: (id: string, label: string) => any) =>
  Object.fromEntries(
    Object.entries(source).map(([key, [id, label]]) => [key, make(id, label)]),
  )

/** `who.designer`, `who.reviewer`, … */
export const who: Record<string, any> = build(PEOPLE, user)

/** `where.migration`, `where.crackdown`, … */
export const where: Record<string, any> = build(PLACES, project)

/** `firm.bird`, … */
export const firm: Record<string, any> = build(FIRMS, client)

/** An activity node. */
export function activity(over: Record<string, any>) {
  return {
    kind: 'activity',
    id: over.id,
    verb: over.verb,
    published_at: over.published_at,
    headline_template: over.headline_template,
    headline: null,
    icon: over.icon ?? null,
    actor: over.actor ?? null,
    object: over.object ?? null,
    target: over.target ?? null,
    context: over.context ?? null,
    data: over.data ?? {},
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
    icon: over.icon ?? null,
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
