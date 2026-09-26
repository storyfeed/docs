import { entity, user, note } from '../../samples'
import { row, type Row, type VerbWording, type WorldPack } from '../contract'
import { CAST, VENUES, FARE, HOLDINGS, TASKS, TICKETS, WORLD_NOTES, SERVICES, APP_CONTENT,
  TASK_NOTES, TICKET_REPORTS, PULL_TITLES, DOCUMENT_FILES, ENTITY_CONTENT, PICKUP_PROGRESS, RECORD_TITLES, RECORD_TEXT } from './manifest'

/**
 * ── Stranger Things: the pack ────────────────────────────────────────────────
 *
 * Hawkins, Indiana, as Stranger Things shows it: people, places and dated
 * activities, 1983 to the Fourth of July, 1985. The engine (../../world.ts)
 * shifts them onto the present anchor, and pages reach them only through the
 * roles and scenes at the bottom of this file.
 *
 * The cast use present-day software (a task tracker, a code host, billing
 * through Stripe, e-signature, a support desk). That is the joke, not an
 * anachronism. Everything else is on screen, dated as the show dates it.
 *
 * Rules every entry follows:
 *
 * - On screen only. Merchandise is not canon (the 2023 supermarket "Scoops Ahoy
 *   flavours" are merchandise), and neither is anything a later season added.
 * - True to its date. No 1986 in 1985: no Family Video, no Hellfire Club, no
 *   Surfer Boy Pizza.
 * - Every activity names its source (`src`, a key of SOURCES). `uncertain`
 *   says what is not settled. Days come from the wiki's timeline; clock times
 *   are this catalogue's own, chosen to fit the day's events in order.
 * - Timestamps are Hawkins wall-clock time written with a `Z`, as the rest of
 *   the docs write theirs.
 *
 * `visitor` is Jasper Tey, the one real person here. On the Fourth of July,
 * 1985 he is a toddler, 23 months old, so his rows are what a toddler does in
 * a feed. They are flagged `cameo` for his review. His birth date is never
 * printed anywhere.
 */

/** Where each fact comes from. */
const SOURCES: Record<string, string> = {
  S1E1: 'S1E1 "The Vanishing of Will Byers" (Nov 6–7, 1983)',
  S1E2: 'S1E2 "The Weirdo on Maple Street" (Nov 7, 1983)',
  S1E3: 'S1E3 "Holly, Jolly" (Nov 8–9, 1983)',
  S1E6: 'S1E6 "The Monster" (Nov 10, 1983)',
  S1E8: 'S1E8 "The Upside Down" (Nov 12, Dec 24, 1983)',
  S2E1: 'S2E1 "MADMAX" (Oct 28–29, 1984)',
  S2E2: 'S2E2 "Trick or Treat, Freak" (Oct 31, 1984)',
  S2E3: 'S2E3 "The Pollywog" (Nov 1, 1984)',
  S2E8: 'S2E8 "The Mind Flayer" (Nov 3, 1984)',
  S2E9: 'S2E9 "The Gate" (Dec 15, 1984)',
  S3E1: 'S3E1 "Suzie, Do You Copy?" (Jun 28–29, 1985)',
  S3E2: 'S3E2 "The Mall Rats" (Jun 30, 1985)',
  S3E3: 'S3E3 "The Case of the Missing Lifeguard" (Jul 1, 1985)',
  S3E4: 'S3E4 "The Sauna Test" (Jul 2, 1985)',
  S3E5: 'S3E5 "The Flayed" (Jul 3, 1985)',
  S3E6: 'S3E6 "E Pluribus Unum" (Jul 3–4, 1985)',
  S3E7: 'S3E7 "The Bite" (Jul 4, 1985)',
  S3E8: 'S3E8 "The Battle of Starcourt" (Jul 4, 1985)',
  timeline: 'https://strangerthings.fandom.com/wiki/Stranger_Things/Timeline (day-by-day, 1983–1985)',
  scoops: 'https://strangerthings.fandom.com/wiki/Scoops_Ahoy (Steve hired Jun 7, 1985; Erica\'s ice cream for life)',
  troop: 'https://strangerthings.fandom.com/wiki/Scoops_Troop (members: Dustin, Steve, Robin, Erica)',
  cerebro: 'https://strangerthings.fandom.com/wiki/Cerebro (built at camp; assembled on Weathertop)',
  fair: 'https://strangerthings.fandom.com/wiki/Fun_Fair (Jul 4, 1985; rides, stalls, balloons, attendees)',
  post: 'https://strangerthings.fandom.com/wiki/The_Hawkins_Post (Nancy and Jonathan, Tom, Bruce, the rats story)',
  starcourt: 'https://strangerthings.fandom.com/wiki/Starcourt_Mall (Hess farm sold Nov 30, 1984)',
  enzos: 'https://strangerthings.fandom.com/wiki/Enzo\'s (Hopper stood up, Jun 30, 1985)',
  eggo: 'https://strangerthings.fandom.com/wiki/Kellogg\'s_Eggo (1983 Bradley\'s, Dec 1983 box, 1984 Extravaganza)',
  arcade: 'https://strangerthings.fandom.com/wiki/Palace_Arcade (MADMAX tops Dustin\'s Dig Dug score)',
  bradleys: 'https://strangerthings.fandom.com/wiki/Bradley\'s_Big_Buy (1983 Eggos; Jul 4, 1985 break-in)',
  cinema: 'https://nerdist.com/article/stranger-things-3-what-played-movie-theater/ (Day of the Dead sneak preview)',
  s3: 'https://en.wikipedia.org/wiki/Stranger_Things_season_3 (episode summaries)',
  recap2: 'https://www.netflix.com/tudum/articles/stranger-things-season-2-recap (Bob resets the lab system; S2E8)',
  recap3: 'https://www.netflix.com/tudum/articles/stranger-things-season-3-recap (Cerebro intercepts the Russian broadcast; Alexei explains the gate; S3E1 and S3E6)',
  splice: 'Present-day software in the 1985 world: the premise, not canon',
}

// ── The cast, places and things ──────────────────────────────────────────────

// Ids start above the older samples' so the two can share a page.
const build = <K extends string>(source: Record<K, string>, make: (id: string, label: string, key: K) => any) =>
  Object.fromEntries(
    Object.entries(source).map(([key, label], index) => [key, make(String(index + 101), label as string, key as K)]),
  ) as Record<K, any>

const slug = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

// ── Bodies ───────────────────────────────────────────────────────────────────
// A body belongs to its entity, so it is set here, once, and every row that
// names the thing shows the same preview. Each names its subject, even where
// the headline already does. Its form follows what the thing is: a record is a
// card, a description is titled Prose, a signed document is a File, a passage
// from a paper is an Excerpt. Orders carry none: the order is the docs'
// standard example, and its pages teach the bare `toFeed()`. A page that
// teaches a body on an order builds it on its own example.
const detail = (key: string, value: string | number, verbatim = false) => ({ key, value, verbatim, missing: null })
const card = (title: string, items: ReturnType<typeof detail>[]) =>
  [{ $body: 'Storyfeed/Body/KeyValue', $v: 1, title, items }]
const prose = (title: string, content: string) =>
  [{ $body: 'Storyfeed/Body/Prose', $v: 1, content, mediaType: 'text/plain', verbatim: false, title }]


const cast = build(CAST, (id, label) => user(id, label))
const venues = build(VENUES, (id, label, key) => entity('venue', id, label, `/venues/${slug(key)}`))
const fare = build(FARE, (id, label, key) => entity('menu_item', id, label, `/menu/${slug(key)}`))
const tasks = build(TASKS, (id, label) => entity('task', id, label, `/tasks/${id}`))
const tickets = build(TICKETS, (id, label) => entity('ticket', id, `Ticket #${id}: ${label}`, `/tickets/${id}`))
const worldNotes = build(WORLD_NOTES, (id, label) => note(id, label))
const stripe = entity('storyfeed.party', '101', SERVICES.billing, null)
// The shop's till, acting when a scheduled command runs.
const register = entity('storyfeed.party', '102', 'Scoops Register', null)

const holding: Record<keyof typeof HOLDINGS, [string, string]> = {
  repo: ['repository', '/repositories/cerebro'],
  troop: ['team', '/teams/scoops-troop'],
  board: ['project', '/projects/scoops-troop'],
  party: ['team', '/teams/party'],
  contract: ['document', '/documents/scoops-ahoy'],
  internship: ['document', '/documents/hawkins-post'],
  farmSale: ['document', '/documents/hess-farm'],
  ratStory: ['story', '/stories/rats'],
  digDug: ['game', '/games/dig-dug'],
  dragonsLair: ['game', '/games/dragons-lair'],
  film: ['film', '/films/day-of-the-dead'],
  woody: ['prize', '/prizes/woody'],
  balloon: ['prize', '/prizes/balloon'],
  ferrisWheel: ['ride', '/rides/ferris-wheel'],
  gravitron: ['ride', '/rides/gravitron'],
  lights: ['thing', '/things/lights'],
  snowBall: ['event', '/events/snow-ball'],
  map: ['drawing', '/drawings/wills-map'],
  fireworks: ['thing', '/things/fireworks'],
  dart: ['pet', '/pets/dart'],
  band: ['band', '/bands/hawkins-high'],
  carnivalGame: ['game', '/games/carnival'],
  teacups: ['ride', '/rides/teacups'],
  carousel: ['ride', '/rides/carousel'],
  ponyRide: ['ride', '/rides/pony'],
  pretzelBag: ['menu_item', '/menu/pretzel-bag'],
}
const things = build(HOLDINGS, (id, label, key) => entity(holding[key][0], id, label, holding[key][1]))

// The board's tasks carry what the task asks for: the S3 plot in the board's
// words (uncertain: `music` and `door` are this catalogue's reading of the plot).
for (const key of Object.keys(TASKS) as (keyof typeof TASKS)[]) tasks[key] = { ...tasks[key], body: prose(TASKS[key], TASK_NOTES[key]) }
// A ticket carries its report, titled by the ticket's number. The reports are ours.
for (const key of Object.keys(TICKETS) as (keyof typeof TICKETS)[])
  tickets[key] = { ...tickets[key], body: prose(`Ticket #${tickets[key].id}`, TICKET_REPORTS[key]) }
// A signed document is its file. Sizes are ours.
const signed: Record<keyof typeof DOCUMENT_FILES, number> = { contract: 48213, internship: 61870, farmSale: 132406 }
for (const key of Object.keys(DOCUMENT_FILES) as (keyof typeof DOCUMENT_FILES)[])
  things[key] = { ...things[key], body: [{ $body: 'Storyfeed/Body/File', $v: 1,
    name: DOCUMENT_FILES[key], size: signed[key], mediaType: 'application/pdf' }] }
// Nancy's story quotes the woman she interviewed (SOURCES.post: Driscoll's rats, S3E2).
// The words are Doris Driscoll's, so `from` names her. The wording is ours, not a canon line.
things.ratStory = { ...things.ratStory, body: [{ $body: 'Storyfeed/Body/Excerpt', $v: 1,
  text: ENTITY_CONTENT.ratStory, from: ENTITY_CONTENT.ratStoryFrom, truncated: true }] }
// The film is a real one (SOURCES.cinema): its facts, never its poster.
things.film = { ...things.film, body: card(HOLDINGS.film, [
  detail('Director', ENTITY_CONTENT.director), detail('Showing', ENTITY_CONTENT.showing)]) }
things.repo = { ...things.repo, body: card(HOLDINGS.repo, [
  detail('About', ENTITY_CONTENT.repoAbout), detail('Visibility', 'Public')]) }
// The shop's menu item is a record, so its card is its details. Every row that
// names it shows the same card. The price is ours.
fare.butterscotch = { ...fare.butterscotch, body: card(fare.butterscotch.label, [
  detail('Price', APP_CONTENT.price), detail('Section', APP_CONTENT.section), detail('Available', APP_CONTENT.available), detail('Orders', 12)]) }
// The things that have a photograph of their own (see PHOTO_CREDITS below).
const photographed: Record<string, string> = { carousel: 'carousel', ferrisWheel: 'ferris', fireworks: 'fireworks', pretzelBag: 'pretzels' }

/** Minted, not named: orders, pull requests, invoices and photos are numbered. */
const order = (n: number) => entity('order', String(n), `Order #${n}`, `/orders/${n}`)

// FeedLink lessons: the fair's food comes from FARE (SOURCES.fair). The order,
// quantities, notices and their wording are illustrative app content, not canon.
const fairOrderLabel = 'Order #1042'
const fairOrder = { ...order(1042), body: [{ $body: 'Storyfeed/Body/ItemList', $v: 1,
  title: `${fairOrderLabel} items`, ordered: false,
  items: [
    { label: FARE.hotDog, href: fare.hotDog.url },
    { label: FARE.cornDog, href: fare.cornDog.url },
    FARE.pretzel,
  ], totalItems: 5, more: { label: fairOrderLabel, href: '/orders/1042' } }] }
const hoursTitle = `${VENUES.scoops} opening hours`
const hoursNotice = entity('notice', '101', hoursTitle, '/notices/101', { body: [{ $body: 'Storyfeed/Body/MediaObject', $v: 1,
  subject: { label: hoursTitle, href: '/notices/101' },
  content: 'The counter opens at 10 am. Orders are available until 9 pm.',
  image: null, attachments: [], footnote: null }] })
const visitorNotice = entity('notice', '102', `${VENUES.scoops} visitor information`, '/notices/102', { body: [{ $body: 'Storyfeed/Body/MediaObject', $v: 1,
  subject: { label: `${VENUES.mall} visitor guide`, href: `${venues.mall.url}/guide` },
  content: 'The visitor guide includes entrances, parking and shop locations.',
  image: null, attachments: [], footnote: null }] })

// uncertain: the branches, file counts and titles are invented for the cameo merges.
const PULLS: Record<number, [string, number]> = {
  1: ['antenna-mount', 3], 2: ['transmitter', 5], 3: ['utah-range', 2], 4: ['tape-input', 4], 5: ['static-filter', 2],
}
const pull = (n: number) => entity('pull_request', String(n), `Pull request #${n}`, `/pulls/${n}`, {
  body: card(`Pull request #${n}`, [
    detail('Title', PULL_TITLES[n as keyof typeof PULL_TITLES]),
    detail('Branch', PULLS[n][0], true),
    detail('Files changed', String(PULLS[n][1])),
  ]) })

// uncertain: the amounts and who is billed are invented; Stripe is the splice.
const INVOICES: Record<number, string> = {
  1981: '$412.50', 1982: '$388.00', 1983: '$455.25', 1984: '$520.75', 1985: '$497.00', 1986: '$610.40', 1987: '$96.00', 1988: '$148.80',
}
const invoice = (n: number) => entity('invoice', String(n), `Scoops Ahoy invoice #${n}`, `/invoices/${n}`, {
  body: card(`Scoops Ahoy invoice #${n}`, [
    detail('Amount', INVOICES[n]),
    detail('Billed to', VENUES.mall),
    detail('Reference', `INV-${n}`, true),
  ]) })

// ── Photographs ──────────────────────────────────────────────────────────────
// Free photos from Unsplash (unsplash.com/license), self-hosted under
// public/media/worlds/stranger-things/, 960x720. Stock pictures of ordinary
// things, never of the show: no brands, logos or recognisable faces.
// Kept inside the pack so another world supplies its own media.
export const PHOTO_CREDITS: Record<string, { photographer: string, profile: string, photo: string }> = {
  sundae: { photographer: 'Molly Keesling', profile: 'https://unsplash.com/@mollysuek', photo: 'https://unsplash.com/photos/7YhrOw6Kngo' },
  fair: { photographer: 'Natasha Reddy', profile: 'https://unsplash.com/@natashareddy', photo: 'https://unsplash.com/photos/cM9GERALoC0' },
  carousel: { photographer: 'Sally K', profile: 'https://unsplash.com/@salivan_91', photo: 'https://unsplash.com/photos/Oc-gVHId6lo' },
  ferris: { photographer: 'Steve Shreve', profile: 'https://unsplash.com/@steveshreve', photo: 'https://unsplash.com/photos/MarV8zURg78' },
  fireworks: { photographer: 'DESIGNECOLOGIST', profile: 'https://unsplash.com/@designecologist', photo: 'https://unsplash.com/photos/5mj5jLhYWpY' },
  arcade: { photographer: 'Carl Raw', profile: 'https://unsplash.com/@carltraw', photo: 'https://unsplash.com/photos/m3hn2Kn5Bns' },
  parlour: { photographer: 'Donald Teel', profile: 'https://unsplash.com/@epartner', photo: 'https://unsplash.com/photos/Arxi6Y5_pTQ' },
  pretzel: { photographer: 'Sven Mieke', profile: 'https://unsplash.com/@sxoxm', photo: 'https://unsplash.com/photos/Bxo33Q-YUjM' },
  pretzels: { photographer: 'Khushal Shah Lakhnavi', profile: 'https://unsplash.com/@legitimages', photo: 'https://unsplash.com/photos/iqc0gENef7c' },
  hotdog: { photographer: 'Jessica Loaiza', profile: 'https://unsplash.com/@jessicaloaizar', photo: 'https://unsplash.com/photos/glqTtszXfM0' },
  darkroom: { photographer: 'Vladimir Fedotov', profile: 'https://unsplash.com/@fedotov_vs', photo: 'https://unsplash.com/photos/RSN0hnHOclQ' },
  newspapers: { photographer: 'Jonathan Gong', profile: 'https://unsplash.com/@jonathangongphotography', photo: 'https://unsplash.com/photos/izRQ870yJO8' },
  street: { photographer: 'Nils Huenerfuerst', profile: 'https://unsplash.com/@nhuenerfuerst', photo: 'https://unsplash.com/photos/pBmOfkly5eg' },
}
const ALT: Record<string, string> = {
  sundae: 'A sundae with whipped cream, sauce and a cherry',
  fair: 'A fairground at night',
  carousel: 'A carousel lit up at night',
  ferris: 'A Ferris wheel at dusk',
  fireworks: 'Fireworks over a crowd',
  arcade: 'Arcade machines in a dark room',
  street: 'A small-town street from above',
  parlour: 'An ice cream counter',
  pretzel: 'Soft pretzels on a stand',
  pretzels: 'Soft pretzels on a board',
  hotdog: 'A hot dog with mustard and ketchup',
  darkroom: 'A room lit red',
  newspapers: 'Rolled newspapers',
}
const picture = (file: string) => ({ src: `/media/worlds/stranger-things/${file}.jpg`,
  mediaType: 'image/jpeg', width: 960, height: 720, alt: ALT[file] })
const mediaOf = (file: string) => ({ icon: null, image: null, attachments: [],
  preview: picture(file), url: picture(file) })

const photo = (n: number, file?: string) => entity('photo', String(n), `IMG_${n}.jpg`, `/photos/${n}`,
  file ? { media: mediaOf(file) } : {})
for (const [key, file] of Object.entries(photographed)) things[key] = { ...things[key], media: mediaOf(file) }
venues.scoops = { ...venues.scoops, media: mediaOf('parlour') }
fare.pretzel = { ...fare.pretzel, media: mediaOf('pretzel') }
fare.hotDog = { ...fare.hotDog, media: mediaOf('hotdog') }
// The photo belongs to the photo activity; the menu item's own preview is its
// details card (set with the other bodies above).
const menuPhoto = entity('photo', '3201', APP_CONTENT.photo, picture('sundae').src, { media: mediaOf('sundae') })

// ── The verbs ────────────────────────────────────────────────────────────────

/** This pack's own verbs. The rest (place, ask, pay, merge…) are the engine's. */
const VERBS: Record<string, VerbWording> = {
  announce: { glyph: 'megaphone', headline: ':actor published :object', summary: 'published :object|published :count notices' },
  add: { glyph: 'ice-cream-cone', headline: ':actor added a menu item, :object', summary: 'added :object to the menu|added :count menu items' },
  reprice: { glyph: 'tag', headline: ':actor changed the price of :object', summary: 'changed the price of :object|changed :count prices' },
  remove: { glyph: 'circle-x', headline: ':actor removed :object from :target', summary: 'removed :object from :target|removed :count things from :targets' },
  expire: { glyph: 'circle-x', headline: ':object expired at :target' },
  reply: { glyph: 'message-circle', headline: ':actor replied about :object', summary: 'replied about :object|replied :count times' },
  // The billing app records both orders and invoices.
  pay:      { glyph: 'receipt', headline: ':actor marked :object paid', repeat: ':actor processed :count payments', object: ':actor marked :object paid :count times', summary: 'marked :object paid|processed :count payments' },
  note:     { glyph: 'message-circle', headline: ':actor sent a note about :object', summary: 'sent a note about :object|sent :count notes' },
  post:     { glyph: 'message-circle', headline: ':actor sent a note about :target', summary: 'sent a note about :target|sent :count notes about :targets' },
  ready:    { glyph: 'utensils', headline: ':actor marked :object ready', summary: 'marked :object ready|marked :count orders ready' },
  publish:  { glyph: 'ice-cream-cone', headline: ':actor put :object on the menu', repeat: ':actor put :count items on the menu', summary: 'put :object on the menu|put :count items on the menu' },
  serve:    { glyph: 'ice-cream-cone', headline: ':actor served :object', repeat: ':actor served :count orders', summary: 'served :object|served :count orders' },
  call:     { glyph: 'radio', headline: ':actor radioed :target', repeat: ':actor radioed :target :count times', summary: 'radioed :target|radioed :targets :count times' },
  file:     { glyph: 'newspaper', headline: ':actor filed :object with :target', summary: 'filed :object with :target|filed :count things with :targets' },
  reject:   { glyph: 'circle-x', headline: ':actor turned down :object', summary: 'turned down :object|turned down :count things' },
  dismiss:  { glyph: 'circle-x', headline: ':actor let :target go from :object', actors: ':actors let :target go from :objects', object: ':actor let :count people go from :object', summary: 'let :target go from :object|let :count people go' },
  check_in: { glyph: 'ferris-wheel', headline: ':actor checked in at :target', repeat: ':actor checked in at :target :count times',
              actors: ':actors checked in at :target', summary: 'checked in at :target|checked in :count times at :targets' },
  win:      { glyph: 'ferris-wheel', headline: ':actor won :object at :target', summary: 'won :object|won :count prizes' },
  get:      { glyph: 'ferris-wheel', headline: ':actor got :object at :target', summary: 'got :object|got :count things' },
  ride:     { glyph: 'ferris-wheel', headline: ':actor rode :object at :target', repeat: ':actor went on :count rides at :target',
              actors: ':actors rode :objects at :target', summary: 'rode :object|went on :count rides' },
  buy:      { glyph: 'shopping-bag', headline: ':actor bought :object at :target', repeat: ':actor bought :count things at :target', summary: 'bought :object at :target|bought :count things at :targets' },
  eat:      { glyph: 'utensils', headline: ':actor had :object at :target', repeat: ':actor had :count things at :target',
              actors: ':actors had :objects at :target', summary: 'had :object at :target|had :count things at :targets' },
  drink:    { glyph: 'utensils', headline: ':actor had :object at :target', summary: 'had :object at :target|had :count drinks at :targets' },
  watch:    { glyph: 'film', headline: ':actor watched :object at :target', actors: ':actors watched :objects at :target', summary: 'watched :object at :target|watched :count films at :targets' },
  score:    { glyph: 'gamepad-2', headline: ':actor set a new high score on :object at :target', summary: 'set a new high score on :object|set :count high scores' },
  play:     { glyph: 'gamepad-2', headline: ':actor played :object at :target', repeat: ':actor played :count games at :target',
              actors: ':actors played :objects at :target', object: ':actor played :object :count times', summary: 'played :object|played :count games' },
  book:     { glyph: 'utensils', headline: ':actor booked a table at :target', summary: 'booked a table at :target|booked :count tables at :targets' },
  hang:     { glyph: 'eye', headline: ':actor hung :object', summary: 'hung :object|hung :count things' },
  leave:    { glyph: 'utensils', headline: ':actor left :object for :target', summary: 'left :object for :target|left :count things for :targets' },
  attend:   { glyph: 'user-plus', headline: ':actor went to :object', actors: ':actors went to :objects', summary: 'went to :object|went to :count events' },
  wave:     { glyph: 'ferris-wheel', headline: ':actor waved at :target', summary: 'waved at :target|waved :count times' },
}


// ── The rows ─────────────────────────────────────────────────────────────────

const { scooper, linguist, radio, reporter, photographer, clerk, chief, partyLeader, seer, slinger, skater,
  telekinetic, scout, investigator, poolside, lifeguard, scientist, mayor, sweetheart, editor, colleague,
  caller, teacher, mapReader, diner, farmer, visitor } = cast
const v = venues
const t = things

const ROWS: Row[] = [
  // ── November 1983: Will vanishes ──
  row('w01', '1983-11-07 19:30', 'eat', telekinetic, fare.burger, v.bennys, 'S1E2',
    { uncertain: 'Benny feeds her in the diner kitchen; "a burger" is our label' }),
  row('w02', '1983-11-07 21:00', 'call', diner, null, null, 'S1E2', { headline: ':actor phoned social services', uncertain: 'no target entity' }),
  row('w03', '1983-11-09 20:00', 'hang', clerk, t.lights, null, 'S1E3'),
  row('w04', '1983-11-10 17:00', 'buy', telekinetic, fare.eggos, v.bradleys, 'eggo',
    { headline: ':actor took :object from :target', uncertain: 'she steals them; S1E6 by the wiki\'s day' }),
  row('w05', '1983-12-24 16:00', 'leave', chief, fare.eggos, telekinetic, 'eggo', { headline: ':actor left :object in the woods for :target' }),

  // Saturday, November 12, 1983: the tank, at the middle school.
  row('w06', '1983-11-12 19:00', 'check_in', partyLeader, null, v.middle, 'S1E8', { uncertain: 'the tank is on the wiki\'s Nov 12; S1E7–8' }),
  row('w07', '1983-11-12 19:01', 'check_in', radio, null, v.middle, 'S1E8', { uncertain: 'as w06' }),
  row('w08', '1983-11-12 19:02', 'check_in', slinger, null, v.middle, 'S1E8', { uncertain: 'as w06' }),
  row('w09', '1983-11-12 19:03', 'check_in', telekinetic, null, v.middle, 'S1E8', { uncertain: 'as w06' }),

  // ── October–December 1984 ──
  row('w10', '1984-10-28 16:00', 'score', skater, t.digDug, v.arcade, 'arcade',
    { uncertain: 'on-screen title says Oct 28; the arcade page says Oct 29' }),
  row('w11', '1984-10-28 16:05', 'play', radio, t.dragonsLair, v.arcade, 'arcade', { uncertain: 'as w10' }),
  row('w12', '1984-10-28 16:10', 'play', partyLeader, t.dragonsLair, v.arcade, 'arcade', { uncertain: 'as w10' }),
  row('w13', '1984-10-28 16:12', 'play', slinger, t.dragonsLair, v.arcade, 'arcade', { uncertain: 'as w10' }),
  row('w14', '1984-10-29 08:00', 'eat', telekinetic, fare.extravaganza, v.cabin, 'eggo',
    { uncertain: 'the wiki says "one morning" in 1984; the day is ours' }),
  row('w15', '1984-11-01 08:30', 'leave', radio, fare.nougat, t.dart, 'S2E3',
    { headline: ':actor fed :object to :target', uncertain: 'the nougat feeding\'s exact day' }),
  row('w16', '1984-11-03 20:00', 'complete', mapReader, t.map, null, 'S2E8',
    { headline: ':actor found the X on :object', uncertain: 'the day is the wiki\'s; the headline is ours' }),
  row('w17', '1984-11-30 11:00', 'sign', farmer, t.farmSale, null, 'starcourt'),
  row('w18', '1984-12-15 19:00', 'attend', partyLeader, t.snowBall, null, 'S2E9'),
  row('w19', '1984-12-15 19:05', 'attend', telekinetic, t.snowBall, null, 'S2E9'),
  row('w20', '1984-12-15 19:10', 'attend', radio, t.snowBall, null, 'S2E9'),
  row('w21', '1984-12-15 19:15', 'attend', slinger, t.snowBall, null, 'S2E9'),
  row('w22', '1984-12-15 19:20', 'attend', skater, t.snowBall, null, 'S2E9'),
  row('w23', '1984-12-15 19:25', 'attend', seer, t.snowBall, null, 'S2E9'),

  // ── June 1985: Starcourt summer ──
  row('j01', '1985-06-07 10:00', 'sign', scooper, t.contract, null, 'scoops'),
  row('j02', '1985-06-07 10:20', 'sign', linguist, t.contract, null, 'scoops', { uncertain: 'Robin was already working there; the day is Steve\'s' }),
  row('j03', '1985-06-10 09:00', 'sign', reporter, t.internship, null, 'post', { uncertain: '"around the summer"; the day is ours' }),
  row('j04', '1985-06-10 09:10', 'sign', photographer, t.internship, null, 'post', { uncertain: 'as j03' }),
  row('j05', '1985-06-12 14:00', 'pay', stripe, invoice(1981), null, 'splice'),
  row('j06', '1985-06-19 14:00', 'pay', stripe, invoice(1982), null, 'splice'),
  row('j07', '1985-06-26 14:00', 'pay', stripe, invoice(1983), null, 'splice'),

  // Friday, June 28: the sneak preview; the power cut.
  row('j10', '1985-06-28 10:00', 'create', radio, t.repo, null, 'cerebro', { uncertain: 'built at camp; the day is ours' }),
  row('j11', '1985-06-28 10:30', 'merge', visitor, pull(1), t.repo, 'splice', { cameo: true, uncertain: 'a dead end for 1985: no pull requests yet, so a cameo carries it' }),
  row('j12', '1985-06-28 11:00', 'merge', visitor, pull(2), t.repo, 'splice', { cameo: true, uncertain: 'a dead end for 1985: no pull requests yet, so a cameo carries it' }),
  row('j13', '1985-06-28 11:40', 'merge', visitor, pull(3), t.repo, 'splice', { cameo: true, uncertain: 'a dead end for 1985: no pull requests yet, so a cameo carries it' }),
  row('j14', '1985-06-28 18:30', 'watch', partyLeader, t.film, v.mall, 'S3E1'),
  row('j15', '1985-06-28 18:30', 'watch', seer, t.film, v.mall, 'S3E1'),
  row('j16', '1985-06-28 18:31', 'watch', slinger, t.film, v.mall, 'S3E1'),
  row('j17', '1985-06-28 18:32', 'watch', skater, t.film, v.mall, 'S3E1'),
  row('j18', '1985-06-28 20:15', 'open', clerk, tickets.power, null, 'S3E1',
    { uncertain: 'the outage is on screen; Joyce filing it is ours' }),
  row('j19', '1985-06-28 13:00', 'serve', scooper, order(1031), null, 'scoops', { uncertain: 'counter life; no single order is on screen' }),
  row('j20', '1985-06-28 13:05', 'serve', scooper, order(1032), null, 'scoops', { uncertain: 'as j19' }),
  row('j21', '1985-06-28 13:30', 'serve', linguist, order(1033), null, 'scoops', { uncertain: 'as j19' }),

  // Saturday, June 29: Dustin comes home; Cerebro on Weathertop.
  row('j30', '1985-06-29 09:30', 'join', radio, null, t.party, 'S3E1',
    { headline: ':actor came home to :target', uncertain: 'the Party surprise him; the headline is ours' }),
  row('j31', '1985-06-29 11:00', 'check_in', radio, null, v.weathertop, 'S3E1'),
  row('j32', '1985-06-29 11:05', 'check_in', partyLeader, null, v.weathertop, 'S3E1'),
  row('j33', '1985-06-29 11:06', 'check_in', seer, null, v.weathertop, 'S3E1'),
  row('j34', '1985-06-29 11:08', 'check_in', slinger, null, v.weathertop, 'S3E1'),
  row('j35', '1985-06-29 11:09', 'check_in', skater, null, v.weathertop, 'S3E1'),
  row('j36', '1985-06-29 12:00', 'call', radio, null, sweetheart, 'cerebro'),
  row('j37', '1985-06-29 13:30', 'call', radio, null, sweetheart, 'cerebro'),
  row('j38', '1985-06-29 15:00', 'call', radio, null, sweetheart, 'cerebro'),
  row('j39', '1985-06-29 15:55', 'complete', radio, tasks.record, t.board, 'S3E1', { uncertain: 'the board is ours; the broadcast is his' }),
  row('j40', '1985-06-29 16:10', 'check_in', lifeguard, null, v.pool, 'S3E1'),
  row('j41', '1985-06-29 16:30', 'check_in', poolside, null, v.pool, 'S3E1'),
  row('j42', '1985-06-29 21:30', 'call', caller, null, v.post, 'S3E1',
    { headline: ':actor phoned :target about the rats', uncertain: 'the call is on screen; the row is ours' }),
  row('j43', '1985-06-29 10:15', 'star', visitor, t.repo, null, 'splice',
    { cameo: true, uncertain: 'a present-day star from a 23-month-old; proposed' }),

  // Sunday, June 30: the mall rats; the code cracked; Hopper stood up.
  row('j50', '1985-06-30 09:15', 'open', clerk, tickets.magnets, null, 'S3E2', { uncertain: 'the magnets are on screen; the ticket is ours' }),
  row('j51', '1985-06-30 09:20', 'assign', clerk, tickets.magnets, teacher, 'S3E2'),
  row('j52', '1985-06-30 10:30', 'file', reporter, t.ratStory, v.post, 'post'),
  row('j53', '1985-06-30 10:45', 'reject', editor, t.ratStory, null, 'post', { uncertain: 'laughed at "the next day" by the post page' }),
  row('j54', '1985-06-30 11:00', 'upload', photographer, photo(3101, 'street'), v.post, 'S3E2', { uncertain: 'the Driscoll visit; the photos are ours' }),
  row('j55', '1985-06-30 11:02', 'upload', photographer, photo(3102, 'arcade'), v.post, 'S3E2', { uncertain: 'as j54' }),
  row('j56', '1985-06-30 11:05', 'upload', photographer, photo(3103, 'darkroom'), v.post, 'S3E2', { uncertain: 'as j54' }),
  row('j56a', '1985-06-30 11:07', 'upload', photographer, photo(3105, 'newspapers'), v.post, 'S3E2', { uncertain: 'as j54' }),
  row('j57', '1985-06-30 12:00', 'check_in', radio, null, v.scoops, 'S3E2'),
  row('j58', '1985-06-30 12:10', 'place', radio, order(1034), v.scoops, 'S3E2', { uncertain: 'he visits Steve; the order is ours' }),
  row('j59', '1985-06-30 12:12', 'serve', scooper, order(1034), null, 'S3E2', { uncertain: 'as j58' }),
  row('j60', '1985-06-30 13:00', 'check_in', telekinetic, null, v.mall, 'S3E2'),
  row('j61', '1985-06-30 13:02', 'check_in', skater, null, v.mall, 'S3E2'),
  row('j62', '1985-06-30 14:00', 'check_in', chief, null, v.townHall, 'S3E2'),
  row('j63', '1985-06-30 17:30', 'check_in', lifeguard, null, v.pool, 'S3E2'),
  row('j64', '1985-06-30 19:00', 'book', chief, null, v.enzos, 'enzos', { uncertain: 'the booking is ours; the date is on screen' }),
  row('j65', '1985-06-30 20:30', 'complete', linguist, tasks.crack, t.board, 'S3E2'),
  row('j66', '1985-06-30 21:00', 'complete', scooper, tasks.music, t.board, 'S3E2'),
  row('j67', '1985-06-30 14:00', 'pay', stripe, invoice(1984), null, 'splice'),
  row('j68', '1985-06-30 19:30', 'check_in', chief, null, v.enzos, 'enzos'),

  // Monday, July 1: the sleepover; the lab; the fertilizer.
  row('j70', '1985-07-01 10:00', 'check_in', telekinetic, null, v.pool, 'S3E3'),
  row('j71', '1985-07-01 10:01', 'check_in', skater, null, v.pool, 'S3E3'),
  row('j72', '1985-07-01 14:00', 'complete', linguist, tasks.locations, t.board, 'S3E3'),
  row('j73', '1985-07-01 15:00', 'merge', visitor, pull(4), t.repo, 'splice', { cameo: true, uncertain: 'a dead end for 1985: no pull requests yet, so a cameo carries it' }),
  row('j75', '1985-07-01 15:30', 'merge', visitor, pull(5), t.repo, 'splice', { cameo: true, uncertain: 'a dead end for 1985: no pull requests yet, so a cameo carries it' }),
  row('j76', '1985-07-01 18:00', 'upload', photographer, photo(3104, 'fair'), v.post, 'S3E3', { uncertain: 'the photo is ours' }),
  row('j77', '1985-07-01 11:00', 'resolve', teacher, tickets.magnets, null, 'S3E3', { uncertain: 'Mr. Clarke explains; "resolved" is ours' }),
  row('j78', '1985-07-01 22:00', 'check_in', clerk, null, v.lab, 'S3E3'),
  row('j79', '1985-07-01 22:01', 'check_in', chief, null, v.lab, 'S3E3'),

  // Tuesday, July 2: fired; the vent; the sauna test.
  row('j80', '1985-07-02 09:30', 'check_in', chief, null, v.townHall, 'S3E4'),
  row('j81', '1985-07-02 09:35', 'check_in', clerk, null, v.townHall, 'S3E4'),
  row('j82', '1985-07-02 10:00', 'dismiss', editor, t.internship, reporter, 'S3E4', { headline: ':actor let :target go from the Hawkins Post' }),
  row('j83', '1985-07-02 10:01', 'dismiss', editor, t.internship, photographer, 'S3E4', { headline: ':actor let :target go from the Hawkins Post' }),
  row('j84', '1985-07-02 12:00', 'place', scout, order(1035), v.scoops, 'troop', { uncertain: 'her price is ice cream for life; the order is ours' }),
  row('j85', '1985-07-02 12:05', 'ask', scout, worldNotes.forLife, fare.butterscotch, 'troop',
    { uncertain: 'the note is ours; the deal and the flavour name are on screen' }),
  row('j86', '1985-07-02 12:10', 'join', radio, null, t.troop, 'troop'),
  row('j87', '1985-07-02 12:11', 'join', scooper, null, t.troop, 'troop'),
  row('j88', '1985-07-02 12:12', 'join', linguist, null, t.troop, 'troop'),
  row('j89', '1985-07-02 12:15', 'join', scout, null, t.troop, 'troop'),
  row('j90', '1985-07-02 21:00', 'complete', scout, tasks.ducts, t.board, 'S3E4'),
  row('j91', '1985-07-02 21:10', 'complete', scout, tasks.door, t.board, 'S3E4'),
  row('j92', '1985-07-02 19:00', 'check_in', partyLeader, null, v.pool, 'S3E4', { uncertain: 'the sauna test is at the pool; times are ours' }),
  row('j93', '1985-07-02 19:01', 'check_in', telekinetic, null, v.pool, 'S3E4'),
  row('j94', '1985-07-02 19:02', 'check_in', slinger, null, v.pool, 'S3E4'),
  row('j95', '1985-07-02 19:03', 'check_in', skater, null, v.pool, 'S3E4'),
  row('j96', '1985-07-02 19:04', 'check_in', seer, null, v.pool, 'S3E4'),
  row('j97', '1985-07-02 20:00', 'check_in', reporter, null, v.hospital, 'S3E4'),
  row('j98', '1985-07-02 14:00', 'pay', stripe, invoice(1985), null, 'splice'),

  // Wednesday, July 3: Alexei; the 7-Eleven; the hospital.
  row('k01', '1985-07-03 09:00', 'check_in', chief, null, v.hessFarm, 'S3E5'),
  row('k02', '1985-07-03 09:01', 'check_in', clerk, null, v.hessFarm, 'S3E5'),
  row('k03', '1985-07-03 14:00', 'drink', scientist, fare.slurpee, v.gasStation, 'S3E5',
    { uncertain: 'the stop is Jul 3 by the wiki; which chapter he gets the Slurpee in is not settled' }),
  row('k04', '1985-07-03 16:00', 'check_in', investigator, null, v.warehouse, 'S3E5',
    { headline: ':actor let the chief in at :target' }),
  row('k05', '1985-07-03 17:00', 'check_in', reporter, null, v.hospital, 'S3E5'),
  row('k06', '1985-07-03 17:01', 'check_in', photographer, null, v.hospital, 'S3E5'),
  row('k07', '1985-07-03 18:30', 'check_in', colleague, null, v.hospital, 'S3E5'),
  row('k08', '1985-07-03 18:31', 'check_in', editor, null, v.hospital, 'S3E5'),
  row('k09', '1985-07-03 20:00', 'complete', linguist, tasks.elevator, t.board, 'S3E5',
    { uncertain: 'they reach the base; the task title is ours' }),
  row('k10', '1985-07-03 12:00', 'serve', cast.manager, order(1036), null, 'scoops',
    { uncertain: 'Ned, the manager, is named on the wiki; the order is ours' }),

  // Thursday, July 4: the Fun Fair; the Battle of Starcourt.
  row('k20', '1985-07-04 08:00', 'check_in', mayor, null, v.fair, 'fair', { uncertain: 'Grigori meets him there; "checked in" is ours' }),
  row('k21', '1985-07-04 08:10', 'ride', mayor, t.gravitron, v.fair, 'fair'),
  row('k22', '1985-07-04 10:00', 'pay', stripe, invoice(1986), null, 'splice'),
  row('k22a', '1985-07-04 10:01', 'pay', stripe, invoice(1987), null, 'splice'),
  row('k22b', '1985-07-04 10:02', 'pay', stripe, invoice(1988), null, 'splice'),
  row('k23', '1985-07-04 11:00', 'check_in', chief, null, v.cabin, 'S3E6', { uncertain: 'Hopper calls the FBI; the check-in is ours' }),
  row('k24', '1985-07-04 13:00', 'check_in', telekinetic, null, v.cabin, 'S3E6'),
  row('k25', '1985-07-04 13:01', 'check_in', partyLeader, null, v.cabin, 'S3E6'),
  row('k26', '1985-07-04 13:02', 'check_in', reporter, null, v.cabin, 'S3E6'),
  row('k27', '1985-07-04 13:03', 'check_in', photographer, null, v.cabin, 'S3E6'),
  row('k28', '1985-07-04 13:04', 'check_in', seer, null, v.cabin, 'S3E6'),
  row('k29', '1985-07-04 13:05', 'check_in', slinger, null, v.cabin, 'S3E6'),
  row('k30', '1985-07-04 13:06', 'check_in', skater, null, v.cabin, 'S3E6'),
  row('k31', '1985-07-04 16:30', 'drink', slinger, fare.newCoke, v.bradleys, 'S3E7'),
  row('k32', '1985-07-04 16:40', 'buy', slinger, t.fireworks, v.bradleys, 'bradleys',
    { headline: ':actor took :object from :target' }),
  row('k33', '1985-07-04 17:30', 'check_in', poolside, null, v.fair, 'fair'),
  row('k34', '1985-07-04 17:40', 'check_in', visitor, null, v.fair, 'fair', { cameo: true }),
  row('k35', '1985-07-04 17:45', 'get', visitor, t.balloon, v.fair, 'fair',
    { cameo: true, uncertain: 'the balloons are on screen; his is ours' }),
  row('k36', '1985-07-04 17:50', 'eat', visitor, fare.pretzel, v.fair, 'fair',
    { cameo: true, headline: ':actor had a bite of :object at :target', uncertain: 'the pretzel stand is on screen' }),
  // A toddler's evening: the small rides, one after another.
  row('k36a', '1985-07-04 17:55', 'ride', visitor, t.teacups, v.fair, 'fair', { cameo: true, uncertain: 'the rides at a 1985 fair; which ones are ours' }),
  row('k36b', '1985-07-04 18:05', 'ride', visitor, t.carousel, v.fair, 'fair', { cameo: true, uncertain: 'as k36a' }),
  row('k36c', '1985-07-04 18:15', 'ride', visitor, t.ponyRide, v.fair, 'fair', { cameo: true, uncertain: 'as k36a' }),
  // Invented: a bag of pretzels to share, bought before the Ferris wheel.
  row('k36d', '1985-07-04 18:10', 'buy', poolside, t.pretzelBag, v.fair, 'fair', { uncertain: 'the pretzel stand is on screen; her bag is ours' }),
  row('k37', '1985-07-04 18:00', 'check_in', mayor, null, v.fair, 'fair', { headline: ':actor opened :target', uncertain: 'he opens it "on the night"' }),
  row('k38', '1985-07-04 18:20', 'check_in', investigator, null, v.fair, 'fair'),
  row('k39', '1985-07-04 18:21', 'check_in', scientist, null, v.fair, 'fair'),
  row('k40', '1985-07-04 18:22', 'check_in', chief, null, v.fair, 'fair'),
  row('k41', '1985-07-04 18:23', 'check_in', clerk, null, v.fair, 'fair'),
  // S3E7: Alexei tries a stall game again and again, on Murray's money, before he wins.
  row('k41a', '1985-07-04 18:26', 'play', scientist, t.carnivalGame, v.fair, 'S3E7', { uncertain: 'the tries are on screen; the count is ours' }),
  row('k41b', '1985-07-04 18:29', 'play', scientist, t.carnivalGame, v.fair, 'S3E7', { uncertain: 'as k41a' }),
  row('k41c', '1985-07-04 18:32', 'play', scientist, t.carnivalGame, v.fair, 'S3E7', { uncertain: 'as k41a' }),
  row('k42', '1985-07-04 18:35', 'win', scientist, t.woody, v.fair, 'S3E7'),
  row('k43', '1985-07-04 18:36', 'eat', investigator, fare.hotDog, v.fair, 'fair', { uncertain: 'the hot dog stands are on screen; his is ours' }),
  row('k44', '1985-07-04 18:40', 'wave', visitor, null, t.band, 'fair',
    { cameo: true, uncertain: 'the band plays at the opening; the wave is ours' }),
  row('k45', '1985-07-04 18:45', 'ride', poolside, t.ferrisWheel, v.fair, 'fair', { uncertain: 'she watches the fireworks from it, later that night' }),
  row('k46', '1985-07-04 18:48', 'check_in', radio, null, v.mall, 'S3E7'),
  row('k47', '1985-07-04 18:49', 'check_in', scout, null, v.mall, 'S3E7'),
  row('k48', '1985-07-04 18:50', 'check_in', scooper, null, v.mall, 'S3E7'),
  row('k49', '1985-07-04 18:51', 'check_in', linguist, null, v.mall, 'S3E7'),
  // After now, on the default anchor: the battle. Kept for pages that set their own clock.
  row('k60', '1985-07-04 20:30', 'call', radio, null, sweetheart, 'S3E8'),
  row('k61', '1985-07-04 20:35', 'complete', radio, tasks.planck, t.board, 'S3E8'),
  row('k62', '1985-07-04 20:00', 'check_in', chief, null, v.mall, 'S3E8'),
  row('k63', '1985-07-04 20:01', 'check_in', clerk, null, v.mall, 'S3E8'),
  row('k64', '1985-07-04 20:02', 'check_in', investigator, null, v.mall, 'S3E8'),
]

// Cookbook examples use the existing on-screen roles and product (S3E2;
// SOURCES.scoops / SOURCES.troop). Each action below is a modern-software
// illustration, not an assertion that this transaction happened on screen.
// uncertain: these app transactions and clock times are invented for teaching.
const cookbookRow = (id: string, at: string, verb: string, actor: any, object: any, target: any = null) =>
  row(`cookbook-${id}`, at, verb, actor, object, target, 'splice',
    { uncertain: 'Illustrative software transaction, not an on-screen event.' })
ROWS.push(
  cookbookRow('anonymous', '1985-07-02 12:10', 'place', null, order(1035), v.scoops),
  cookbookRow('paid', '1985-07-02 12:15', 'pay', stripe, order(1035)),
  cookbookRow('expired', '1985-07-04 09:00', 'expire', null, order(1040), v.scoops),
  cookbookRow('confirmed', '1985-07-02 12:20', 'confirm', scooper, order(1035)),
  cookbookRow('replaced', '1985-07-02 12:30', 'place', scout, order(1035), v.scoops),
  cookbookRow('added', '1985-06-30 10:00', 'add', scooper, fare.butterscotch),
  cookbookRow('repriced', '1985-06-30 10:12', 'reprice', scooper, fare.butterscotch),
  cookbookRow('removed', '1985-07-03 10:00', 'remove', scooper, fare.butterscotch, v.scoops),
  cookbookRow('reply', '1985-07-02 12:10', 'reply', scout, { ...worldNotes.forLife, type: 'discussion', body: null }),
  cookbookRow('repeat1', '1985-07-01 11:00', 'place', scout, order(1101), v.scoops),
  cookbookRow('repeat2', '1985-07-01 11:01', 'place', scout, order(1102), v.scoops),
  cookbookRow('repeat3', '1985-07-01 11:02', 'place', scout, order(1103), v.scoops),
  cookbookRow('crowd1', '1985-07-01 12:00', 'place', scout, order(1104), v.scoops),
  cookbookRow('crowd2', '1985-07-01 12:01', 'place', radio, order(1104), v.scoops),
  cookbookRow('crowd3', '1985-07-01 12:02', 'place', linguist, order(1104), v.scoops),
)

// Basics/guide examples use the modern app premise. These are software
// transactions, not additional on-screen events or quoted dialogue. The existing
// j84 order is itself an illustrative transaction (troop/S3E4).
const demo = { uncertain: 'Illustrative shop-app transaction, not an on-screen event' }
ROWS.push(
  // splice: one customer's three separate order requests, near the existing j84.
  row('a-order-2', '1985-07-02 12:01', 'place', scout, order(1040), v.scoops, 'splice', demo),
  row('a-order-3', '1985-07-02 12:02', 'place', scout, order(1041), v.scoops, 'splice', demo),
  // splice: the staff member handles the same order, through the shop app.
  row('a-confirm', '1985-07-02 12:03', 'confirm', scooper, order(1035), v.scoops, 'splice', demo),
  row('a-note', '1985-07-02 12:04', 'post', scout, note('201', APP_CONTENT.note), order(1035), 'splice', demo),
  row('a-ready', '1985-07-02 12:06', 'ready', scooper, order(1035), v.scoops, 'splice', demo),
  row('a-paid', '1985-07-02 12:07', 'pay', stripe, order(1035), null, 'splice', demo),
  row('a-complete', '1985-07-02 12:08', 'complete', scooper, order(1035), v.scoops, 'splice',
    { ...demo, headline: ':actor completed :object' }),
  row('a-created', '1985-07-02 11:59', 'create', scooper, order(1035), v.scoops, 'splice', demo),
  // splice: the order and notices have bodies on their own entities.
  row('a-item-list', '1985-07-04 18:00', 'place', poolside, fairOrder, v.fair, 'splice', demo),
  row('a-notice', '1985-07-02 09:00', 'announce', scooper, hoursNotice, v.scoops, 'splice', demo),
  row('a-visitor-notice', '1985-07-02 09:05', 'announce', scooper, visitorNotice, v.scoops, 'splice', demo),
  // splice: the catalogue item is already sourced in the pack; prices and media are illustrative.
  row('a-price', '1985-07-02 11:00', 'reprice', scooper, fare.butterscotch, v.scoops, 'splice', demo),
  row('a-product', '1985-07-02 10:00', 'publish', scooper, fare.butterscotch, v.scoops, 'splice', demo),
  row('a-photo', '1985-07-02 10:05', 'publish', scooper, menuPhoto, fare.butterscotch, 'splice',
    { ...demo, headline: ':actor added a photo of :target' }),
)

// The plot supplies the subjects. The records and their wording are fresh
// illustrations, not transcribed dialogue, screen output or executable lab code.
const records = build(RECORD_TITLES, (id, label, key) => entity('field_record', id, label, null, {
  // Suzie's answer, as Dustin took it down: her words, so an Excerpt from her.
  body: key === 'planck'
    ? [{ $body: 'Storyfeed/Body/Excerpt', $v: 1, text: RECORD_TEXT.planck, from: RECORD_TEXT.planckFrom, truncated: false }]
    : key === 'alphabet'
    ? [{ $body: 'Storyfeed/Body/ItemList', $v: 1, title: label, ordered: false,
        items: [RECORD_TEXT.alphabetTop, RECORD_TEXT.alphabetMiddle, RECORD_TEXT.alphabetBottom] }]
    : [{ $body: 'Storyfeed/Body/Prose', $v: 1, title: label, content: RECORD_TEXT[key],
        mediaType: key === 'caseMemo' ? 'text/markdown' : key === 'labReport' ? 'text/html' : 'text/plain',
        verbatim: ['program', 'terminal', 'radioLog'].includes(key) }],
}))
const illustrativeRecord = { uncertain: 'Original illustrative record around a sourced plot event; text, format and clock time are invented, not a screen transcript' }
ROWS.push(
  row('prose-program', '1984-11-03 18:00', 'write', cast.mapReader, records.program, v.lab, 'recap2', illustrativeRecord),
  row('prose-terminal', '1984-11-03 18:02', 'publish', null, records.terminal, v.lab, 'recap2',
    { ...illustrativeRecord, headline: ':object was printed at :target' }),
  row('prose-radio', '1985-06-29 18:00', 'write', radio, records.radioLog, v.weathertop, 'recap3', illustrativeRecord),
  row('prose-memo', '1985-07-04 10:00', 'write', investigator, records.caseMemo, v.warehouse, 'recap3', illustrativeRecord),
  row('prose-report', '1984-11-03 18:03', 'publish', null, records.labReport, v.lab, 'recap2',
    { ...illustrativeRecord, headline: ':object was printed at :target' }),
  row('prose-planck', '1985-07-04 18:55', 'write', radio, records.planck, null, 'S3E8', illustrativeRecord),
  row('prose-alphabet', '1983-11-09 17:00', 'write', clerk, records.alphabet, null, 'S1E3', illustrativeRecord),
)

// ── Roles and scenes ─────────────────────────────────────────────────────────


// Deeper-page software examples: the cast and shop are sourced above (S3E2,
// scoops); these app actions are illustrative, not additional show canon.
const deeperRow = (id: string, at: string, verb: string, actor: any, object: any, target: any = null) =>
  row(`deeper-${id}`, at, verb, actor, object, target, 'splice',
    { uncertain: 'Illustrative software action; not an on-screen event' })
const pickupOrder = order(2081)
pickupOrder.body = [{ $body: 'Storyfeed/Body/Component', $v: 1, name: 'Orders/Progress', props: {
  title: pickupOrder.label,
  steps: ['Placed', 'Confirmed', 'Ready'],
  current: 'Confirmed',
  pickup: PICKUP_PROGRESS.time,
} }]
const deeperOrders = [order(2031), order(2032), order(2033)]
const deeperRows: Row[] = [
  deeperRow('pickup-progress', '1985-07-02 12:05', 'confirm', scooper, pickupOrder, v.scoops),
  ...deeperOrders.map((object, i) => deeperRow(`order-${i}`, `1985-07-02 12:${10 + i * 5}`, 'place', scout, object, v.scoops)),
  ...[scout, radio, partyLeader, slinger, skater].map((actor, i) =>
    deeperRow(`customer-${i}`, `1985-07-02 13:0${i}`, 'place', actor, order(2041 + i), v.scoops)),
  deeperRow('confirm-0', '1985-07-02 12:26', 'confirm', scooper, deeperOrders[0], v.scoops),
  deeperRow('confirm-1', '1985-07-02 12:27', 'confirm', scooper, deeperOrders[1], v.scoops),
  deeperRow('confirm-2', '1985-07-02 12:28', 'confirm', scooper, deeperOrders[2], v.scoops),
  deeperRow('ready', '1985-07-02 12:30', 'ready', scooper, deeperOrders[0], v.scoops),
  deeperRow('paid', '1985-07-02 12:34', 'pay', stripe, deeperOrders[0], v.scoops),
  deeperRow('save-early', '1985-07-02 11:00', 'save', scout, deeperOrders[0]),
  deeperRow('save-latest', '1985-07-02 11:32', 'save', scout, deeperOrders[0]),
  deeperRow('save-other', '1985-07-02 11:33', 'save', scooper, deeperOrders[0]),
  ...['1985-07-01', '1985-07-02', '1985-07-03'].map((day, i) =>
    deeperRow(`weekly-${i}`, `${day} 14:30`, 'place', scout, order(2051 + i), v.scoops)),
  // Hourly retention crosses 18:00 while all five rows remain in one daily group.
  ...['17:40', '17:45', '17:50', '18:10', '18:15'].map((time, i) =>
    deeperRow(`view-${i}`, `1985-07-04 ${time}`, 'view', scooper, order(2061 + i))),  // At closing time a scheduled command cancels an order nobody paid for.
  deeperRow('system-cancel', '1985-07-03 21:00', 'cancel', register, order(2071), v.scoops),
]
ROWS.push(...deeperRows)
VERBS.write = { glyph: 'pencil', headline: ':actor wrote :object', summary: 'wrote :object|wrote :count records' }
VERBS.ready = { glyph: 'circle-check', headline: ':actor marked :object ready', repeat: ':actor marked :count orders ready', summary: 'marked :object ready|marked :count orders ready' }
VERBS.save = { glyph: 'save', headline: ':actor saved :object', object: ':actor saved :object :count times', summary: 'saved :object|saved :objects :count times' }
VERBS.cancel = { glyph: 'circle-x', headline: ':actor cancelled :object', summary: 'cancelled :object|cancelled :count orders' }
VERBS.view = { glyph: 'eye', headline: ':actor viewed :object', repeat: ':actor viewed :count orders', summary: 'viewed :object|viewed :count orders' }

export default {
  name: 'stranger-things',
  canonicalNow: '1985-07-04T19:00:00Z',
  sources: SOURCES,
  verbs: VERBS,
  rows: ROWS,
  roles: {
    customer: scout,
    shop: v.scoops,
    mall: v.mall,
    product: fare.butterscotch,
    staff: scooper,
    service: stripe,
  },
  scenes: {
    cookbook: {
      actorless: { anonymous: 'cookbook-anonymous', paid: 'cookbook-paid', expired: 'cookbook-expired' },
      transitions: { confirmed: 'cookbook-confirmed', timeline: ['j84', 'cookbook-confirmed', 'cookbook-replaced'] },
      pricing: ['cookbook-added', 'cookbook-repriced'],
      computed: 'cookbook-added',
      deletion: 'cookbook-removed',
      discussion: 'cookbook-reply',
      grouped: { repeat: ['cookbook-repeat1', 'cookbook-repeat2', 'cookbook-repeat3'], actors: ['cookbook-crowd1', 'cookbook-crowd2', 'cookbook-crowd3'] },
    },
    deeper: {
      body: { progress: 'deeper-pickup-progress' },
      aggregation: { orders: ['deeper-order-0', 'deeper-order-1', 'deeper-order-2'],
        customers: Array.from({ length: 5 }, (_, i) => `deeper-customer-${i}`) },
      latestPerObject: { timeline: ['deeper-order-0', 'deeper-confirm-0', 'deeper-ready', 'deeper-paid'],
        board: ['deeper-paid', 'deeper-confirm-1', 'deeper-order-2'],
        confirmations: ['deeper-confirm-0', 'deeper-confirm-1', 'deeper-confirm-2'] },
      parties: { system: 'deeper-system-cancel' },
      keepingLatest: { saves: ['deeper-save-early', 'deeper-save-latest', 'deeper-save-other'] },
      groupingPeriods: { orders: ['deeper-weekly-0', 'deeper-weekly-1', 'deeper-weekly-2'] },
      retention: { views: Array.from({ length: 5 }, (_, i) => `deeper-view-${i}`) },
      composites: { tasks: ['j65', 'j72'] },
    },
    order: 'j84',
    question: 'j85',
    otherApps: { task: 'j65', code: 'j75', billing: 'k22', signature: 'j01', support: 'j51', team: 'j89' },
    busyPlace: ['k33', 'k34', 'k38'],
    repeats: [['j36', 'j37'], ['k41a', 'k41b', 'k41c'], ['k36a', 'k36b', 'k36c'], ['k22', 'k22a', 'k22b']],
    distant: 'w10',
    cameo: ['k35'],
    around: ['k42', 'k31', 'k09', 'j42', 'j31'],
    guide: {
      usageExamples: { repeatOrders: ['j84', 'a-order-2', 'a-order-3'], photos: ['j54', 'j55', 'j56'] },
    },
    basics: {
      activityContent: { note: 'a-note', ready: 'a-ready', confirmed: 'a-confirm', photo: 'a-photo', product: 'a-product',
        program: 'prose-program', terminal: 'prose-terminal', radioLog: 'prose-radio',
        caseMemo: 'prose-memo', labReport: 'prose-report', alphabet: 'prose-alphabet', planck: 'prose-planck',
        itemList: 'a-item-list', notice: 'a-notice', linkedNotice: 'a-visitor-notice' },
      recording: { paid: 'a-paid', priced: 'a-price', photos: ['j54', 'j55', 'j56'] },
      feedFile: { completed: 'a-complete', created: 'a-created' },
      namedFeeds: { shop: ['j84', 'a-confirm', 'a-ready', 'a-price', 'a-product'] },
    },
  },
} satisfies WorldPack
