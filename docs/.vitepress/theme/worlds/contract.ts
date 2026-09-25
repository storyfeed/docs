/**
 * ── The world contract ───────────────────────────────────────────────────────
 *
 * What a world pack supplies so the docs can tell their examples in it. A page
 * never names a pack's people or picks its rows by id; it asks for a ROLE (the
 * customer, the shop) or a SCENE (an order being placed, a busy place). A pack
 * says which of its rows and entities play each part, and the completeness test
 * (scripts/world.test.mjs) fails if one is missing or does not do its job.
 *
 * See README.md beside this file for how to write a pack.
 */

/** Wording and glyph for one verb, with its group headlines per axis. */
export type VerbWording = {
  glyph: string
  headline: string
  repeat?: string
  actors?: string
  targets?: string
}

/** One dated activity in a pack. */
export type Row = {
  id: string
  /** Local wall-clock time, `YYYY-MM-DD HH:MM`, written against the pack's `canonicalNow`. */
  at: string
  verb: string
  actor: any
  object?: any
  target?: any
  /** The row's own headline, when the verb's default does not fit. */
  headline?: string
  /** A key of the pack's `sources`. */
  src: string
  /** What is not settled about this row. */
  uncertain?: string
  /** A row starring Jasper, for his review. */
  cameo?: true
}

/** A row, written positionally. */
export const row = (id: string, at: string, verb: string, actor: any, object: any, target: any, src: string, more: Partial<Row> = {}): Row =>
  ({ id, at, verb, actor, object, target, src, ...more })

/** The apps `scene.otherApps` covers, with the verb each one's row must use. */
export const APP_KINDS = {
  task: 'complete',
  code: 'merge',
  billing: 'pay',
  signature: 'sign',
  support: 'assign',
  team: 'join',
} as const

export type AppKind = keyof typeof APP_KINDS

/**
 * The parts a page can name in prose: `{{ role.customer.label }}`.
 * Each is an entity (see samples.ts `entity`).
 */
export type Roles = {
  /** Someone who orders from the shop. Actor of `scene.order` and `scene.question`. */
  customer: any
  /** The place orders are placed with. Target of `scene.order`. */
  shop: any
  /** Something the shop sells. Target of `scene.question`. */
  product: any
  /** Someone who works at the shop. */
  staff: any
  /** A named service with no model in the app, such as a payment provider (a Party). */
  service: any
}

/**
 * The scenes, by the ids of the pack's rows. The engine turns them into
 * payload nodes on the present anchor.
 */
export type SceneIds = {
  /** Cookbook software examples; illustrative interactions, not new plot claims. */
  cookbook: {
    actorless: { anonymous: string; paid: string; expired: string }
    transitions: { confirmed: string; timeline: string[] }
    pricing: string[]
    deletion: string
    discussion: string
    grouped: { repeat: string[]; actors: string[] }
  }
  /** `role.customer` places an order (`place`) with `role.shop`: the standard example. */
  order: string
  /** `role.customer` asks about `role.product` (`ask`), with a note as the object. */
  question: string
  /** One row from each kind of app, with the verb APP_KINDS names. */
  otherApps: Record<AppKind, string>
  /** Three or more people doing one thing at one place on one day: Summary folds them, Live does not. */
  busyPlace: string[]
  /** One person doing one thing to one target twice or more on one day: Live folds it. */
  repeat: string[]
  /** One row from long before now (30 days or more). */
  distant: string
  /** Jasper's rows (flagged `cameo`). */
  cameo: string[]
  /**
   * Rows from other apps and places that fill out a short, wide feed. With the
   * scenes above they make `scene.glance`: 10 to 14 rows over a few days.
   */
  around: string[]
}

export type WorldPack = {
  /** The key the config selects it by. */
  name: string
  /** "Now" as the pack is written, ISO 8601. The default anchor. */
  canonicalNow: string
  /** Where each fact comes from, keyed as rows' `src` name them. */
  sources: Record<string, string>
  /** The pack's verbs, or its own wording for the engine's. */
  verbs: Record<string, VerbWording>
  rows: Row[]
  roles: Roles
  scenes: SceneIds
}
