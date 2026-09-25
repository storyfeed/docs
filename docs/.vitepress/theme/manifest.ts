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

/**
 * ── The world: Hawkins, Indiana, 1983–1985 ──────────────────────────────────
 *
 * Every display string the Stranger Things catalogue (`world.ts`) uses. The
 * sources for each, and the activities that use them, are in that file.
 *
 * Handles name a part in the show, never the person: `scooper`, not `steve`.
 * The one real person is Jasper Tey, spliced in as `visitor`.
 */

/** The cast, in their show roles (summer 1985 unless noted). */
export const CAST = {
  scooper:      'Steve Harrington',
  linguist:     'Robin Buckley',
  radio:        'Dustin Henderson',
  reporter:     'Nancy Wheeler',
  photographer: 'Jonathan Byers',
  clerk:        'Joyce Byers',
  chief:        'Jim Hopper',
  partyLeader:  'Mike Wheeler',
  seer:         'Will Byers',
  slinger:      'Lucas Sinclair',
  skater:       'Max Mayfield',
  telekinetic:  'Eleven',
  scout:        'Erica Sinclair',
  investigator: 'Murray Bauman',
  poolside:     'Karen Wheeler',
  lifeguard:    'Billy Hargrove',
  scientist:    'Alexei',
  mayor:        'Larry Kline',
  sweetheart:   'Suzie',
  editor:       'Tom Holloway',
  colleague:    'Bruce Lowe',
  caller:       'Doris Driscoll',
  teacher:      'Scott Clarke',
  mapReader:    'Bob Newby',
  diner:        'Benny Hammond',
  arcadeClerk:  'Keith',
  farmer:       'Bernard Hess',
  manager:      'Ned',
  visitor:      'Jasper Tey',
}

/** Places in Hawkins. */
export const VENUES = {
  scoops:     'Scoops Ahoy',
  mall:       'Starcourt Mall',
  post:       'the Hawkins Post',
  melvalds:   'Melvald\'s General Store',
  pool:       'the Hawkins Community Pool',
  fair:       'the Fun Fair',
  arcade:     'the Palace Arcade',
  weathertop: 'Weathertop',
  bradleys:   'Bradley\'s Big Buy',
  enzos:      'Enzo\'s',
  bennys:     'Benny\'s Burgers',
  townHall:   'Hawkins Town Hall',
  hospital:   'Hawkins Memorial Hospital',
  cabin:      'the Hopper cabin',
  gasStation: 'the 7-Eleven',
  middle:     'Hawkins Middle School',
  hessFarm:   'the Hess farm',
  lab:        'Hawkins Lab',
  warehouse:  'Murray\'s warehouse',
}

/** Food and drink seen on screen. */
export const FARE = {
  butterscotch:  'USS Butterscotch',
  eggos:         'Eggo waffles',
  extravaganza:  'the Triple-Decker Eggo Extravaganza',
  newCoke:       'New Coke',
  nougat:        'Three Musketeers',
  slurpee:       'a cherry Slurpee',
  hotDog:        'a hot dog',
  cornDog:       'a corn dog',
  pretzel:       'a pretzel',
  burger:        'a burger',
}

/** Things the cast's apps hold: a repository, teams, a board, documents. */
export const HOLDINGS = {
  repo:        'cerebro',
  troop:       'the Scoops Troop',
  board:       'the Scoops Troop board',
  party:       'the Party',
  contract:    'the Scoops Ahoy employment contract',
  internship:  'the Hawkins Post internship agreement',
  farmSale:    'the Hess farm sale',
  ratStory:    'the diseased rats story',
  digDug:      'Dig Dug',
  dragonsLair: 'Dragon\'s Lair',
  film:        'Day of the Dead',
  woody:       'a stuffed Woody Woodpecker',
  balloon:     'a red, white and blue balloon',
  ferrisWheel: 'the Ferris wheel',
  gravitron:   'the Gravitron',
  lights:      'the Christmas lights',
  snowBall:    'the Snow Ball',
  map:         'Will\'s drawings',
  fireworks:   'the fireworks',
  dart:        'Dart',
  band:        'the Hawkins High Marching Band',
}

/** Tasks on the Scoops Troop board, in the order the show resolves them. */
export const TASKS = {
  record:    'Record the broadcast',
  crack:     'Crack the code',
  music:     'Match the music to the mall',
  locations: 'Map the code to the mall',
  ducts:     'Get through the air ducts',
  door:      'Open the loading bay door',
  elevator:  'Find where the elevator goes',
  planck:    'Find Planck\'s constant',
}

/** Support tickets, by their subject line. */
export const TICKETS = {
  magnets: 'Magnets falling off the display',
  power:   'Power cut across Hawkins',
}

/** Notes written in the cast's apps. A note has no name; its label is its text. */
export const WORLD_NOTES = {
  forLife:  'Is that free for life, or only for today?',
}
