/**
 * ── Stranger Things: the pack's strings ─────────────────────────────────────
 *
 * Every display string this pack uses, in the manifest's form (plain strings,
 * one per line) so the cast test keeps them out of prose. The sources for each,
 * and the rows that use them, are in index.ts beside this file.
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
  carnivalGame: 'a carnival game',
  teacups:     'the teacups',
  carousel:    'the carousel',
  ponyRide:    'the ponies',
  pretzelBag:  'a bag of soft pretzels',
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

/** Named services with no model in the app. */
export const SERVICES = {
  billing: 'Stripe',
}

/** Illustrative shop-app content; not dialogue, prices or products newly claimed as canon. */
export const APP_CONTENT = {
  note: 'Can I collect this at the counter?',
  photo: 'uss-butterscotch.jpg',
  price: '$2.95',
  section: 'Sundaes',
  available: 'At the counter',
}

/**
 * What the cast's apps hold about their things: the bodies under a row. Each
 * belongs to its entity, so every row that names the thing shows the same one.
 * Illustrative app content, not dialogue; sources and hedges are in index.ts.
 */
export const TASK_NOTES = {
  record:    'Tape the Russian message Cerebro picked up on Weathertop.',
  crack:     'Work out what the Russian message on the tape is saying.',
  music:     'Pick out the mall in the sounds behind the message on the tape.',
  locations: 'Match each line of the message to a place in the mall.',
  ducts:     'Crawl through the ducts into the locked storeroom.',
  door:      'Unlock the storeroom door from the inside so the others can get in.',
  elevator:  'Find out where the elevator in the storeroom goes down to.',
  planck:    'Get Planck\'s constant to open the safe. Suzie knows it.',
}

/** Support tickets, as their reporter wrote them. */
export const TICKET_REPORTS = {
  magnets: 'Every magnet on the store display fell off at once, then did it again an hour later.',
  power:   'The power went out across town this evening. It came back on its own a minute later.',
}

/** Pull requests merged into cerebro, by number. */
export const PULL_TITLES = {
  1: 'Add the antenna mount',
  2: 'Wire up the transmitter',
  3: 'Boost the range to reach Utah',
  4: 'Add a tape recorder input',
  5: 'Filter out the static',
}

/** Documents the cast sign, as files. */
export const DOCUMENT_FILES = {
  contract:   'scoops-ahoy-employment-contract.pdf',
  internship: 'hawkins-post-internship-agreement.pdf',
  farmSale:   'hess-farm-sale-agreement.pdf',
}

/** The rest of the bodies. */
export const ENTITY_CONTENT = {
  ratStory:     'They came back every night for my fertilizer, bag after bag',
  ratStoryFrom: 'Doris Driscoll',
  director:     'George A. Romero',
  showing:      'Sneak preview',
  repoAbout:    'The radio built at camp, to reach Utah from Weathertop',
}

/** Pickup time for the illustrative custom-component order. */
export const PICKUP_PROGRESS = {
  time: '12:15 PM',
}
