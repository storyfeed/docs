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
  instructions: 'A spoon with the order, please.',
  note: 'Can I collect this at the counter?',
  photo: 'counter-menu.svg',
  description: 'Available at the counter.',
}
