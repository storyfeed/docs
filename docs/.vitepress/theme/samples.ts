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
