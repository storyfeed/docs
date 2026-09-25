/**
 * ── The manifest ─────────────────────────────────────────────────────────────
 *
 * Every name and every piece of text the documentation's examples use. This is
 * the only file to edit to recast them: change a value here and every page that
 * shows it follows.
 *
 * Plain strings, nothing computed. Ids are assigned from position, so a key is
 * all a page ever refers to.
 *
 * Two things worth knowing:
 *
 * - Keys are HANDLES, never names: `designer`, `reviewer`, `report`, `main`. A
 *   page imports a part in the story, so renaming a person or a file is one
 *   value here and no page changes. The cast was once keyed by first name, and
 *   a recast meant a search across the site; that is why the keys are what
 *   they are.
 * - These are not a copy of the demo app's payloads. The person type here is
 *   `user` where the app emits its own model's alias, and comment labels are not
 *   truncated the way the app truncates them. Regenerating any of this from real
 *   app JSON means translating it, not pasting it.
 * - Prose is out of reach. Where a page names someone in a sentence rather than
 *   in data — the anatomy walkthrough does, following one person's uploads — that
 *   sentence needs editing by hand.
 */

/** People. Rendered as `user` entities linking to /users/{id}. */
export const USERS = {
  cook:      'Nancy Wheeler',
  owner:     'Jasper Tey',
  runner:    'Jonathan Byers',
  regular:   'Steve Harrington',
  customer2: 'Robin Buckley',
  customer3: 'Dustin Henderson',
  customer4: 'Max Mayfield',
  customer5: 'Lucas Sinclair',
  newcomer:  'Joyce Byers',
}

/** Places: the containers an activity happens in. */
export const PLACES = {
  kitchen: "Nancy's Kitchen",
  table:   'the Saturday table',
  menu:    'the dinner menu',
}

/** Dishes. The label is the app's own form: code, then name. */
export const DISHES = {
  chickenCurry: 'N101 Chicken Curry',
  dhal:         'N102 Dhal Curry',
  friedRice:    'N201 Vegetable Fried Rice',
  kottu:        'N203 Chicken Kottu',
  cutlets:      'N301 Fish Cutlets',
  roti:         'N302 Coconut Roti',
  lassi:        'N401 Mango Lassi',
}

/** Orders. The label is what the app prints on a ticket. */
export const ORDERS = {
  first:  'Order #1042',
  second: 'Order #1043',
  third:  'Order #1044',
  fourth: 'Order #1045',
  fifth:  'Order #1046',
}

/** Kitchen devices. */
export const DEVICES = {
  ipad:    "Nancy's iPad",
  display: 'Kitchen display',
}

/**
 * Photos. The label is the file name, which is what a snapshot stores; the
 * picture itself is minted at read time and lives in `docs/public/media`.
 * These stand-ins are generated rather than a pilot app's real photographs,
 * which are not this repository's to publish.
 */
export const PHOTOS = {
  curry:    'chicken-curry.jpg',
  kottu:    'chicken-kottu.jpg',
  cutlets:  'fish-cutlets.jpg',
  roti:     'coconut-roti.jpg',
  lassi:    'mango-lassi.jpg',
  dhal:     'dhal-curry.jpg',
}

/** Parties: named participants with no model in the app. */
export const PARTIES = {
  service: 'Stripe',
}

/** Notes: what a customer or the cook wrote on an order or a dish. A note has
 * no name, so its label is its text. */
export const NOTES = {
  spice:  'Less chili in the chicken curry next time? It was perfect otherwise.',
  pickup: 'Can I pick this up at six instead of seven?',
}

/** The ticket: what was ordered, by dish key, with the unit price the order was
 * placed at. Settled when the order was placed and never moved since, which is
 * why it belongs on the snapshot rather than the resolver. */
export const TICKET: Record<string, { dish: string; qty: number; unit: number }[]> = {
  first: [
    { dish: 'chickenCurry', qty: 1, unit: 14.5 },
    { dish: 'kottu', qty: 1, unit: 15.5 },
    { dish: 'roti', qty: 2, unit: 3 },
  ],
}

/** Instructions: what a customer typed into the order itself at checkout. Not
 * a note — it belongs to the order, and travels wherever the order appears. */
export const INSTRUCTIONS = {
  first: 'Ring the bell twice, the gate sticks.',
}

