import { CAST, VENUES, FARE, HOLDINGS, TASKS, TICKETS, WORLD_NOTES, PARTIES } from './manifest'
import { entity, user, note, activity, group } from './samples'

/**
 * ── The world ────────────────────────────────────────────────────────────────
 *
 * Hawkins, Indiana, as Stranger Things shows it: one catalogue of people,
 * places and dated activities that every page's feeds draw from, so a reader
 * moving between pages meets one town rather than many sets of samples.
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
export const SOURCES = {
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
  splice: 'Present-day software in the 1985 world: the premise, not canon',
} as const

type Source = keyof typeof SOURCES

// ── The present anchor ───────────────────────────────────────────────────────

/** The instant the catalogue is written against: the Fourth of July, 1985, evening. */
export const WORLD_CANONICAL_NOW = Date.parse('1985-07-04T19:00:00Z')

/**
 * "Now", for every page. Set it to any instant (here, or with
 * `VITE_WORLD_ANCHOR=2026-09-30T19:00:00Z` at build time) and every activity
 * keeps its distance from now: "15m ago" stays "15m ago" and the dates move.
 * An anchor at 19:00 keeps every row on the same side of midnight; another
 * clock time moves the day boundaries with it, as a real feed's would.
 */
export const WORLD_ANCHOR = Date.parse(
  ((import.meta as any).env?.VITE_WORLD_ANCHOR as string | undefined) ?? '1985-07-04T19:00:00Z',
)

// ── The cast, places and things ──────────────────────────────────────────────

// Ids start above the older samples' so the two can share a page.
const build = <K extends string>(source: Record<K, string>, make: (id: string, label: string, key: K) => any) =>
  Object.fromEntries(
    Object.entries(source).map(([key, label], index) => [key, make(String(index + 101), label as string, key as K)]),
  ) as Record<K, any>

const slug = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

export const cast = build(CAST, (id, label) => user(id, label))
export const venues = build(VENUES, (id, label, key) => entity('venue', id, label, `/venues/${slug(key)}`))
export const fare = build(FARE, (id, label, key) => entity('menu_item', id, label, `/menu/${slug(key)}`))
export const tasks = build(TASKS, (id, label) => entity('task', id, label, `/tasks/${id}`))
export const tickets = build(TICKETS, (id, label) => entity('ticket', id, `Ticket #${id}: ${label}`, `/tickets/${id}`))
export const worldNotes = build(WORLD_NOTES, (id, label) => note(id, label))
export const stripe = entity('storyfeed.party', '1', PARTIES.service, null)

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
}
export const things = build(HOLDINGS, (id, label, key) => entity(holding[key][0], id, label, holding[key][1]))

/** Minted, not named: orders, pull requests, invoices and photos are numbered. */
export const order = (n: number) => entity('order', String(n), `Order #${n}`, `/orders/${n}`)
export const pull = (n: number) => entity('pull_request', String(n), `Pull request #${n}`, `/pulls/${n}`)
export const invoice = (n: number) => entity('invoice', String(n), `Scoops Ahoy invoice #${n}`, `/invoices/${n}`)
export const photo = (n: number) => entity('photo', String(n), `IMG_${n}.jpg`, `/photos/${n}`)

// ── The verbs ────────────────────────────────────────────────────────────────

/** Each verb's glyph, its headline, and its group headlines per axis. */
export const VERBS: Record<string, { glyph: string; headline: string; repeat?: string; actors?: string; targets?: string }> = {
  place:    { glyph: 'shopping-bag', headline: ':actor placed :object with :target',
              repeat: ':actor placed :count orders with :target', actors: ':actors ordered from :target' },
  confirm:  { glyph: 'circle-check', headline: ':actor confirmed :object', repeat: ':actor confirmed :count orders' },
  serve:    { glyph: 'ice-cream-cone', headline: ':actor served :object', repeat: ':actor served :count orders' },
  ask:      { glyph: 'message-circle', headline: ':actor asked about :target',
              repeat: ':actor asked about :target :count times', targets: ':actor asked about :targets' },
  pay:      { glyph: 'receipt', headline: ':actor marked :object paid', repeat: ':actor marked :count invoices paid' },
  sign:     { glyph: 'file-pen', headline: ':actor signed :object', actors: ':actors signed :object' },
  assign:   { glyph: 'ticket', headline: ':actor assigned :object to :target' },
  open:     { glyph: 'ticket', headline: ':actor opened :object', repeat: ':actor opened :count tickets' },
  resolve:  { glyph: 'circle-check', headline: ':actor resolved :object' },
  join:     { glyph: 'user-plus', headline: ':actor joined :target', actors: ':actors joined :target' },
  create:   { glyph: 'git-merge', headline: ':actor created :object' },
  merge:    { glyph: 'git-merge', headline: ':actor merged :object into :target',
              repeat: ':actor merged :count pull requests into :target' },
  approve:  { glyph: 'circle-check', headline: ':actor approved :object' },
  star:     { glyph: 'star', headline: ':actor starred :object', actors: ':actors starred :object' },
  complete: { glyph: 'square-check', headline: ':actor completed :object on :target',
              repeat: ':actor completed :count tasks on :target' },
  call:     { glyph: 'radio', headline: ':actor radioed :target', repeat: ':actor radioed :target :count times' },
  upload:   { glyph: 'image', headline: ':actor uploaded :object to :target', repeat: ':actor uploaded :count photos to :target' },
  file:     { glyph: 'newspaper', headline: ':actor filed :object with :target' },
  reject:   { glyph: 'circle-x', headline: ':actor turned down :object' },
  dismiss:  { glyph: 'circle-x', headline: ':actor let :target go from :object', actors: ':actors were let go from :object' },
  check_in: { glyph: 'ferris-wheel', headline: ':actor checked in at :target', repeat: ':actor checked in at :target :count times',
              actors: ':actors checked in at :target' },
  win:      { glyph: 'ferris-wheel', headline: ':actor won :object at :target' },
  get:      { glyph: 'ferris-wheel', headline: ':actor got :object at :target' },
  ride:     { glyph: 'ferris-wheel', headline: ':actor rode :object at :target', actors: ':actors rode :object at :target' },
  buy:      { glyph: 'shopping-bag', headline: ':actor bought :object at :target', repeat: ':actor bought :count things at :target' },
  eat:      { glyph: 'utensils', headline: ':actor had :object at :target', repeat: ':actor had :count things at :target',
              actors: ':actors had :object at :target' },
  drink:    { glyph: 'utensils', headline: ':actor had :object at :target' },
  watch:    { glyph: 'film', headline: ':actor watched :object at :target', actors: ':actors watched :object at :target' },
  score:    { glyph: 'gamepad-2', headline: ':actor set a new high score on :object at :target' },
  play:     { glyph: 'gamepad-2', headline: ':actor played :object at :target', actors: ':actors played :object at :target' },
  book:     { glyph: 'utensils', headline: ':actor booked a table at :target' },
  hang:     { glyph: 'eye', headline: ':actor hung :object' },
  leave:    { glyph: 'utensils', headline: ':actor left :object for :target' },
  attend:   { glyph: 'user-plus', headline: ':actor went to :object', actors: ':actors went to :object' },
  wave:     { glyph: 'ferris-wheel', headline: ':actor waved at :target' },
}

// ── The canon ────────────────────────────────────────────────────────────────

export type Canon = {
  id: string
  /** Hawkins wall-clock time, `YYYY-MM-DD HH:MM`. */
  at: string
  verb: keyof typeof VERBS
  actor: any
  object?: any
  target?: any
  headline?: string
  src: Source
  /** What is not settled about this row. */
  uncertain?: string
  /** A row starring Jasper, for his review. */
  cameo?: true
}

const c = (id: string, at: string, verb: string, actor: any, object: any, target: any, src: Source, more: Partial<Canon> = {}): Canon =>
  ({ id, at, verb, actor, object, target, src, ...more })

const { scooper, linguist, radio, reporter, photographer, clerk, chief, partyLeader, seer, slinger, skater,
  telekinetic, scout, investigator, poolside, lifeguard, scientist, mayor, sweetheart, editor, colleague,
  caller, teacher, mapReader, diner, farmer, visitor } = cast
const v = venues
const t = things

export const CANON: Canon[] = [
  // ── November 1983: Will vanishes ──
  c('w01', '1983-11-07 19:30', 'eat', telekinetic, fare.burger, v.bennys, 'S1E2',
    { uncertain: 'Benny feeds her in the diner kitchen; "a burger" is our label' }),
  c('w02', '1983-11-07 21:00', 'call', diner, null, null, 'S1E2', { headline: ':actor phoned social services', uncertain: 'no target entity' }),
  c('w03', '1983-11-09 20:00', 'hang', clerk, t.lights, null, 'S1E3'),
  c('w04', '1983-11-10 17:00', 'buy', telekinetic, fare.eggos, v.bradleys, 'eggo',
    { headline: ':actor took :object from :target', uncertain: 'she steals them; S1E6 by the wiki\'s day' }),
  c('w05', '1983-12-24 16:00', 'leave', chief, fare.eggos, telekinetic, 'eggo', { headline: ':actor left :object in the woods for :target' }),

  // Saturday, November 12, 1983: the tank, at the middle school.
  c('w06', '1983-11-12 19:00', 'check_in', partyLeader, null, v.middle, 'S1E8', { uncertain: 'the tank is on the wiki\'s Nov 12; S1E7–8' }),
  c('w07', '1983-11-12 19:01', 'check_in', radio, null, v.middle, 'S1E8', { uncertain: 'as w06' }),
  c('w08', '1983-11-12 19:02', 'check_in', slinger, null, v.middle, 'S1E8', { uncertain: 'as w06' }),
  c('w09', '1983-11-12 19:03', 'check_in', telekinetic, null, v.middle, 'S1E8', { uncertain: 'as w06' }),

  // ── October–December 1984 ──
  c('w10', '1984-10-28 16:00', 'score', skater, t.digDug, v.arcade, 'arcade',
    { uncertain: 'on-screen title says Oct 28; the arcade page says Oct 29' }),
  c('w11', '1984-10-28 16:05', 'play', radio, t.dragonsLair, v.arcade, 'arcade', { uncertain: 'as w10' }),
  c('w12', '1984-10-28 16:10', 'play', partyLeader, t.dragonsLair, v.arcade, 'arcade', { uncertain: 'as w10' }),
  c('w13', '1984-10-28 16:12', 'play', slinger, t.dragonsLair, v.arcade, 'arcade', { uncertain: 'as w10' }),
  c('w14', '1984-10-29 08:00', 'eat', telekinetic, fare.extravaganza, v.cabin, 'eggo',
    { uncertain: 'the wiki says "one morning" in 1984; the day is ours' }),
  c('w15', '1984-11-01 08:30', 'leave', radio, fare.nougat, t.dart, 'S2E3',
    { headline: ':actor fed :object to :target', uncertain: 'the nougat feeding\'s exact day' }),
  c('w16', '1984-11-03 20:00', 'complete', mapReader, t.map, null, 'S2E8',
    { headline: ':actor found the X on :object', uncertain: 'the day is the wiki\'s; the headline is ours' }),
  c('w17', '1984-11-30 11:00', 'sign', farmer, t.farmSale, null, 'starcourt'),
  c('w18', '1984-12-15 19:00', 'attend', partyLeader, t.snowBall, null, 'S2E9'),
  c('w19', '1984-12-15 19:05', 'attend', telekinetic, t.snowBall, null, 'S2E9'),
  c('w20', '1984-12-15 19:10', 'attend', radio, t.snowBall, null, 'S2E9'),
  c('w21', '1984-12-15 19:15', 'attend', slinger, t.snowBall, null, 'S2E9'),
  c('w22', '1984-12-15 19:20', 'attend', skater, t.snowBall, null, 'S2E9'),
  c('w23', '1984-12-15 19:25', 'attend', seer, t.snowBall, null, 'S2E9'),

  // ── June 1985: Starcourt summer ──
  c('j01', '1985-06-07 10:00', 'sign', scooper, t.contract, null, 'scoops'),
  c('j02', '1985-06-07 10:20', 'sign', linguist, t.contract, null, 'scoops', { uncertain: 'Robin was already working there; the day is Steve\'s' }),
  c('j03', '1985-06-10 09:00', 'sign', reporter, t.internship, null, 'post', { uncertain: '"around the summer"; the day is ours' }),
  c('j04', '1985-06-10 09:10', 'sign', photographer, t.internship, null, 'post', { uncertain: 'as j03' }),
  c('j05', '1985-06-12 14:00', 'pay', stripe, invoice(1981), null, 'splice'),
  c('j06', '1985-06-19 14:00', 'pay', stripe, invoice(1982), null, 'splice'),
  c('j07', '1985-06-26 14:00', 'pay', stripe, invoice(1983), null, 'splice'),

  // Friday, June 28: the sneak preview; the power cut.
  c('j10', '1985-06-28 10:00', 'create', radio, t.repo, null, 'cerebro', { uncertain: 'built at camp; the day is ours' }),
  c('j11', '1985-06-28 10:30', 'merge', radio, pull(1), t.repo, 'splice'),
  c('j12', '1985-06-28 11:00', 'merge', radio, pull(2), t.repo, 'splice'),
  c('j13', '1985-06-28 11:40', 'merge', radio, pull(3), t.repo, 'splice'),
  c('j14', '1985-06-28 18:30', 'watch', partyLeader, t.film, v.mall, 'S3E1'),
  c('j15', '1985-06-28 18:30', 'watch', seer, t.film, v.mall, 'S3E1'),
  c('j16', '1985-06-28 18:31', 'watch', slinger, t.film, v.mall, 'S3E1'),
  c('j17', '1985-06-28 18:32', 'watch', skater, t.film, v.mall, 'S3E1'),
  c('j18', '1985-06-28 20:15', 'open', clerk, tickets.power, null, 'S3E1',
    { uncertain: 'the outage is on screen; Joyce filing it is ours' }),
  c('j19', '1985-06-28 13:00', 'serve', scooper, order(1031), null, 'scoops', { uncertain: 'counter life; no single order is on screen' }),
  c('j20', '1985-06-28 13:05', 'serve', scooper, order(1032), null, 'scoops', { uncertain: 'as j19' }),
  c('j21', '1985-06-28 13:30', 'serve', linguist, order(1033), null, 'scoops', { uncertain: 'as j19' }),

  // Saturday, June 29: Dustin comes home; Cerebro on Weathertop.
  c('j30', '1985-06-29 09:30', 'join', radio, null, t.party, 'S3E1',
    { headline: ':actor came home to :target', uncertain: 'the Party surprise him; the headline is ours' }),
  c('j31', '1985-06-29 11:00', 'check_in', radio, null, v.weathertop, 'S3E1'),
  c('j32', '1985-06-29 11:05', 'check_in', partyLeader, null, v.weathertop, 'S3E1'),
  c('j33', '1985-06-29 11:06', 'check_in', seer, null, v.weathertop, 'S3E1'),
  c('j34', '1985-06-29 11:08', 'check_in', slinger, null, v.weathertop, 'S3E1'),
  c('j35', '1985-06-29 11:09', 'check_in', skater, null, v.weathertop, 'S3E1'),
  c('j36', '1985-06-29 12:00', 'call', radio, null, sweetheart, 'cerebro'),
  c('j37', '1985-06-29 13:30', 'call', radio, null, sweetheart, 'cerebro'),
  c('j38', '1985-06-29 15:00', 'call', radio, null, sweetheart, 'cerebro'),
  c('j39', '1985-06-29 15:55', 'complete', radio, tasks.record, t.board, 'S3E1', { uncertain: 'the board is ours; the broadcast is his' }),
  c('j40', '1985-06-29 16:10', 'check_in', lifeguard, null, v.pool, 'S3E1'),
  c('j41', '1985-06-29 16:30', 'check_in', poolside, null, v.pool, 'S3E1'),
  c('j42', '1985-06-29 21:30', 'call', caller, null, v.post, 'S3E1',
    { headline: ':actor phoned :target about the rats', uncertain: 'the call is on screen; the row is ours' }),
  c('j43', '1985-06-29 10:15', 'star', visitor, t.repo, null, 'splice',
    { cameo: true, uncertain: 'a present-day star from a 23-month-old; proposed' }),

  // Sunday, June 30: the mall rats; the code cracked; Hopper stood up.
  c('j50', '1985-06-30 09:15', 'open', clerk, tickets.magnets, null, 'S3E2', { uncertain: 'the magnets are on screen; the ticket is ours' }),
  c('j51', '1985-06-30 09:20', 'assign', clerk, tickets.magnets, teacher, 'S3E2'),
  c('j52', '1985-06-30 10:30', 'file', reporter, t.ratStory, v.post, 'post'),
  c('j53', '1985-06-30 10:45', 'reject', editor, t.ratStory, null, 'post', { uncertain: 'laughed at "the next day" by the post page' }),
  c('j54', '1985-06-30 11:00', 'upload', photographer, photo(3101), v.post, 'S3E2', { uncertain: 'the Driscoll visit; the photos are ours' }),
  c('j55', '1985-06-30 11:02', 'upload', photographer, photo(3102), v.post, 'S3E2', { uncertain: 'as j54' }),
  c('j56', '1985-06-30 11:05', 'upload', photographer, photo(3103), v.post, 'S3E2', { uncertain: 'as j54' }),
  c('j57', '1985-06-30 12:00', 'check_in', radio, null, v.scoops, 'S3E2'),
  c('j58', '1985-06-30 12:10', 'place', radio, order(1034), v.scoops, 'S3E2', { uncertain: 'he visits Steve; the order is ours' }),
  c('j59', '1985-06-30 12:12', 'serve', scooper, order(1034), null, 'S3E2', { uncertain: 'as j58' }),
  c('j60', '1985-06-30 13:00', 'check_in', telekinetic, null, v.mall, 'S3E2'),
  c('j61', '1985-06-30 13:02', 'check_in', skater, null, v.mall, 'S3E2'),
  c('j62', '1985-06-30 14:00', 'check_in', chief, null, v.townHall, 'S3E2'),
  c('j63', '1985-06-30 17:30', 'check_in', lifeguard, null, v.pool, 'S3E2'),
  c('j64', '1985-06-30 19:00', 'book', chief, null, v.enzos, 'enzos', { uncertain: 'the booking is ours; the date is on screen' }),
  c('j65', '1985-06-30 20:30', 'complete', linguist, tasks.crack, t.board, 'S3E2'),
  c('j66', '1985-06-30 21:00', 'complete', scooper, tasks.music, t.board, 'S3E2'),
  c('j67', '1985-06-30 14:00', 'pay', stripe, invoice(1984), null, 'splice'),
  c('j68', '1985-06-30 19:30', 'check_in', chief, null, v.enzos, 'enzos'),

  // Monday, July 1: the sleepover; the lab; the fertilizer.
  c('j70', '1985-07-01 10:00', 'check_in', telekinetic, null, v.pool, 'S3E3'),
  c('j71', '1985-07-01 10:01', 'check_in', skater, null, v.pool, 'S3E3'),
  c('j72', '1985-07-01 14:00', 'complete', linguist, tasks.locations, t.board, 'S3E3'),
  c('j73', '1985-07-01 15:00', 'merge', radio, pull(4), t.repo, 'splice'),
  c('j74', '1985-07-01 15:10', 'approve', sweetheart, pull(5), null, 'splice', { uncertain: 'Suzie reviewing from Utah is ours' }),
  c('j75', '1985-07-01 15:30', 'merge', radio, pull(5), t.repo, 'splice'),
  c('j76', '1985-07-01 18:00', 'upload', photographer, photo(3104), v.post, 'S3E3', { uncertain: 'the photo is ours' }),
  c('j77', '1985-07-01 11:00', 'resolve', teacher, tickets.magnets, null, 'S3E3', { uncertain: 'Mr. Clarke explains; "resolved" is ours' }),
  c('j78', '1985-07-01 22:00', 'check_in', clerk, null, v.lab, 'S3E3'),
  c('j79', '1985-07-01 22:01', 'check_in', chief, null, v.lab, 'S3E3'),

  // Tuesday, July 2: fired; the vent; the sauna test.
  c('j80', '1985-07-02 09:30', 'check_in', chief, null, v.townHall, 'S3E4'),
  c('j81', '1985-07-02 09:35', 'check_in', clerk, null, v.townHall, 'S3E4'),
  c('j82', '1985-07-02 10:00', 'dismiss', editor, t.internship, reporter, 'S3E4', { headline: ':actor let :target go from the Hawkins Post' }),
  c('j83', '1985-07-02 10:01', 'dismiss', editor, t.internship, photographer, 'S3E4', { headline: ':actor let :target go from the Hawkins Post' }),
  c('j84', '1985-07-02 12:00', 'place', scout, order(1035), v.scoops, 'troop', { uncertain: 'her price is ice cream for life; the order is ours' }),
  c('j85', '1985-07-02 12:05', 'ask', scout, worldNotes.forLife, fare.butterscotch, 'troop',
    { uncertain: 'the note is ours; the deal and the flavour name are on screen' }),
  c('j86', '1985-07-02 12:10', 'join', radio, null, t.troop, 'troop'),
  c('j87', '1985-07-02 12:11', 'join', scooper, null, t.troop, 'troop'),
  c('j88', '1985-07-02 12:12', 'join', linguist, null, t.troop, 'troop'),
  c('j89', '1985-07-02 12:15', 'join', scout, null, t.troop, 'troop'),
  c('j90', '1985-07-02 21:00', 'complete', scout, tasks.ducts, t.board, 'S3E4'),
  c('j91', '1985-07-02 21:10', 'complete', scout, tasks.door, t.board, 'S3E4'),
  c('j92', '1985-07-02 19:00', 'check_in', partyLeader, null, v.pool, 'S3E4', { uncertain: 'the sauna test is at the pool; times are ours' }),
  c('j93', '1985-07-02 19:01', 'check_in', telekinetic, null, v.pool, 'S3E4'),
  c('j94', '1985-07-02 19:02', 'check_in', slinger, null, v.pool, 'S3E4'),
  c('j95', '1985-07-02 19:03', 'check_in', skater, null, v.pool, 'S3E4'),
  c('j96', '1985-07-02 19:04', 'check_in', seer, null, v.pool, 'S3E4'),
  c('j97', '1985-07-02 20:00', 'check_in', reporter, null, v.hospital, 'S3E4'),
  c('j98', '1985-07-02 14:00', 'pay', stripe, invoice(1985), null, 'splice'),

  // Wednesday, July 3: Alexei; the 7-Eleven; the hospital.
  c('k01', '1985-07-03 09:00', 'check_in', chief, null, v.hessFarm, 'S3E5'),
  c('k02', '1985-07-03 09:01', 'check_in', clerk, null, v.hessFarm, 'S3E5'),
  c('k03', '1985-07-03 14:00', 'drink', scientist, fare.slurpee, v.gasStation, 'S3E5',
    { uncertain: 'the stop is Jul 3 by the wiki; which chapter he gets the Slurpee in is not settled' }),
  c('k04', '1985-07-03 16:00', 'check_in', investigator, null, v.warehouse, 'S3E5',
    { headline: ':actor let the chief in at :target' }),
  c('k05', '1985-07-03 17:00', 'check_in', reporter, null, v.hospital, 'S3E5'),
  c('k06', '1985-07-03 17:01', 'check_in', photographer, null, v.hospital, 'S3E5'),
  c('k07', '1985-07-03 18:30', 'check_in', colleague, null, v.hospital, 'S3E5'),
  c('k08', '1985-07-03 18:31', 'check_in', editor, null, v.hospital, 'S3E5'),
  c('k09', '1985-07-03 20:00', 'complete', linguist, tasks.elevator, t.board, 'S3E5',
    { uncertain: 'they reach the base; the task title is ours' }),
  c('k10', '1985-07-03 12:00', 'serve', cast.manager, order(1036), null, 'scoops',
    { uncertain: 'Ned, the manager, is named on the wiki; the order is ours' }),

  // Thursday, July 4: the Fun Fair; the Battle of Starcourt.
  c('k20', '1985-07-04 08:00', 'check_in', mayor, null, v.fair, 'fair', { uncertain: 'Grigori meets him there; "checked in" is ours' }),
  c('k21', '1985-07-04 08:10', 'ride', mayor, t.gravitron, v.fair, 'fair'),
  c('k22', '1985-07-04 10:00', 'pay', stripe, invoice(1986), null, 'splice'),
  c('k23', '1985-07-04 11:00', 'check_in', chief, null, v.cabin, 'S3E6', { uncertain: 'Hopper calls the FBI; the check-in is ours' }),
  c('k24', '1985-07-04 13:00', 'check_in', telekinetic, null, v.cabin, 'S3E6'),
  c('k25', '1985-07-04 13:01', 'check_in', partyLeader, null, v.cabin, 'S3E6'),
  c('k26', '1985-07-04 13:02', 'check_in', reporter, null, v.cabin, 'S3E6'),
  c('k27', '1985-07-04 13:03', 'check_in', photographer, null, v.cabin, 'S3E6'),
  c('k28', '1985-07-04 13:04', 'check_in', seer, null, v.cabin, 'S3E6'),
  c('k29', '1985-07-04 13:05', 'check_in', slinger, null, v.cabin, 'S3E6'),
  c('k30', '1985-07-04 13:06', 'check_in', skater, null, v.cabin, 'S3E6'),
  c('k31', '1985-07-04 16:30', 'drink', slinger, fare.newCoke, v.bradleys, 'S3E7'),
  c('k32', '1985-07-04 16:40', 'buy', slinger, t.fireworks, v.bradleys, 'bradleys',
    { headline: ':actor took :object from :target' }),
  c('k33', '1985-07-04 17:30', 'check_in', poolside, null, v.fair, 'fair'),
  c('k34', '1985-07-04 17:40', 'check_in', visitor, null, v.fair, 'fair', { cameo: true }),
  c('k35', '1985-07-04 17:45', 'get', visitor, t.balloon, v.fair, 'fair',
    { cameo: true, uncertain: 'the balloons are on screen; his is ours' }),
  c('k36', '1985-07-04 17:50', 'eat', visitor, fare.pretzel, v.fair, 'fair',
    { cameo: true, headline: ':actor had a bite of :object at :target', uncertain: 'the pretzel stand is on screen' }),
  c('k37', '1985-07-04 18:00', 'check_in', mayor, null, v.fair, 'fair', { headline: ':actor opened :target', uncertain: 'he opens it "on the night"' }),
  c('k38', '1985-07-04 18:20', 'check_in', investigator, null, v.fair, 'fair'),
  c('k39', '1985-07-04 18:21', 'check_in', scientist, null, v.fair, 'fair'),
  c('k40', '1985-07-04 18:22', 'check_in', chief, null, v.fair, 'fair'),
  c('k41', '1985-07-04 18:23', 'check_in', clerk, null, v.fair, 'fair'),
  c('k42', '1985-07-04 18:35', 'win', scientist, t.woody, v.fair, 'S3E7'),
  c('k43', '1985-07-04 18:36', 'eat', investigator, fare.hotDog, v.fair, 'fair', { uncertain: 'the hot dog stands are on screen; his is ours' }),
  c('k44', '1985-07-04 18:40', 'wave', visitor, null, t.band, 'fair',
    { cameo: true, uncertain: 'the band plays at the opening; the wave is ours' }),
  c('k45', '1985-07-04 18:45', 'ride', poolside, t.ferrisWheel, v.fair, 'fair', { uncertain: 'she watches the fireworks from it, later that night' }),
  c('k46', '1985-07-04 18:48', 'check_in', radio, null, v.mall, 'S3E7'),
  c('k47', '1985-07-04 18:49', 'check_in', scout, null, v.mall, 'S3E7'),
  c('k48', '1985-07-04 18:50', 'check_in', scooper, null, v.mall, 'S3E7'),
  c('k49', '1985-07-04 18:51', 'check_in', linguist, null, v.mall, 'S3E7'),
  // After now, on the default anchor: the battle. Kept for pages that set their own clock.
  c('k60', '1985-07-04 20:30', 'call', radio, null, sweetheart, 'S3E8'),
  c('k61', '1985-07-04 20:35', 'complete', radio, tasks.planck, t.board, 'S3E8'),
  c('k62', '1985-07-04 20:00', 'check_in', chief, null, v.mall, 'S3E8'),
  c('k63', '1985-07-04 20:01', 'check_in', clerk, null, v.mall, 'S3E8'),
  c('k64', '1985-07-04 20:02', 'check_in', investigator, null, v.mall, 'S3E8'),
]

// ── Payload nodes, on the anchor ─────────────────────────────────────────────

const micro = (ms: number) => new Date(ms).toISOString().replace(/\.(\d{3})Z$/, '.$1000Z')
const canonicalMs = (at: string) => Date.parse(`${at.replace(' ', 'T')}:00Z`)

/** One canon row as a payload node, shifted so that `anchor` is now. */
export function nodeOf(row: Canon, anchor = WORLD_ANCHOR) {
  const verb = VERBS[row.verb]
  return activity({
    id: row.id,
    verb: row.verb,
    glyph: verb.glyph,
    published_at: micro(canonicalMs(row.at) + (anchor - WORLD_CANONICAL_NOW)),
    headline_template: row.headline ?? verb.headline,
    actor: row.actor,
    object: row.object ?? null,
    target: row.target ?? null,
  })
}

const byId = new Map(CANON.map((row) => [row.id, row]))

/** Payload nodes for canon ids, in the order given. */
export const pick = (ids: string[], anchor = WORLD_ANCHOR) =>
  ids.map((id) => {
    const row = byId.get(id)
    if (!row) throw new Error(`No canon row "${id}"`)
    return nodeOf(row, anchor)
  })

/** Every row published by `anchor` (the future is left out), as nodes. */
export const everything = (anchor = WORLD_ANCHOR) =>
  CANON.filter((row) => canonicalMs(row.at) <= WORLD_CANONICAL_NOW).map((row) => nodeOf(row, anchor))

// ── The three modes ──────────────────────────────────────────────────────────

const newestFirst = (rows: any[]) => [...rows].sort((a, b) => b.published_at.localeCompare(a.published_at))
const uniq = (list: any[]) =>
  list.filter((e, i) => e && list.findIndex((x) => x && x.id === e.id && x.type === e.type) === i)
const idOf = (e: any) => (e ? `${e.type}:${e.id}` : '-')
// Groups never span days, as in core: the day is part of every key.
const dayOf = (r: any) => r.published_at.slice(0, 10)
const bucket = (rows: any[], key: (r: any) => string) =>
  rows.reduce((map, r) => map.set(key(r), [...(map.get(key(r)) ?? []), r]), new Map<string, any[]>())

const fold = (axis: 'repeat' | 'actors' | 'targets', members: any[]) => {
  const first = members[0]
  return group({
    id: `${axis}-${first.id}`, verb: first.verb, axis, count: members.length, glyph: first.glyph,
    published_at: first.published_at, headline_template: VERBS[first.verb][axis],
    // A read names a sample and counts the rest, as the payload does.
    actors: uniq(members.map((m) => m.actor)).slice(0, 3),
    objects: uniq(members.map((m) => m.object)).slice(0, 3),
    targets: uniq(members.map((m) => m.target)).slice(0, 3),
    // A group carries its members, as a real read does, so it expands.
    children: members, children_truncated: false,
    distinct: {
      actors: uniq(members.map((m) => m.actor)).length,
      objects: uniq(members.map((m) => m.object)).length,
      targets: uniq(members.map((m) => m.target)).length,
    },
  })
}

/** The log: every activity, one row each, newest first. */
export const logOf = (rows: any[]) => newestFirst(rows)

const repeats = (rows: any[]) =>
  [...bucket(rows, (r) => `${dayOf(r)}|${idOf(r.actor)}|${r.verb}|${idOf(r.target)}`).values()]
    .flatMap((members) => (members.length > 1 && VERBS[members[0].verb]?.repeat ? [fold('repeat', newestFirst(members))] : members))

/** Live: repeats fold (one person, one verb, one target, one day); nothing else does. */
export const liveOf = (rows: any[]) => newestFirst(repeats(rows))

/**
 * Summary: also many people into one target (3 or more), and one person
 * across targets (2 or more), before repeats.
 */
export const summaryOf = (rows: any[]) => {
  let rest = rows
  const out: any[] = []
  for (const members of bucket(rest, (r) => `${dayOf(r)}|${r.verb}|${idOf(r.target)}|${idOf(r.object)}`).values()) {
    if (VERBS[members[0].verb]?.actors && uniq(members.map((m) => m.actor)).length >= 3) {
      out.push(fold('actors', newestFirst(members)))
      rest = rest.filter((r) => !members.includes(r))
    }
  }
  for (const members of bucket(rest, (r) => `${dayOf(r)}|${idOf(r.actor)}|${r.verb}`).values()) {
    if (VERBS[members[0].verb]?.targets && uniq(members.map((m) => m.target)).length >= 2) {
      out.push(fold('targets', newestFirst(members)))
      rest = rest.filter((r) => !members.includes(r))
    }
  }
  return newestFirst([...out, ...repeats(rest)])
}
