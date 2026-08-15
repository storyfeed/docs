import { who, where, firm, doc, job, note, activity, group } from '../samples'

/**
 * The landing demo's script: a Laravel app's low-level pulse on the left, the
 * story it becomes on the right.
 *
 * Deterministic on purpose — no Date.now(), every timestamp and delay is
 * written here — so the prerender is byte-stable and the loop replays
 * identically. The cast comes from the manifest like every other example.
 *
 * Each step carries the pulse lines it prints and a mutation of the feed
 * state. The mutation returns a NEW array so Vue sees the change; nodes are
 * replaced, never edited in place.
 */

type FeedNode = Record<string, any>
export type PulseLine = { time: string; text: string; kind: 'request' | 'event' | 'job' }
export type Step = { delay: number; lines: PulseLine[]; apply?: (feed: FeedNode[]) => FeedNode[] }

/** The demo's fixed "now": just after the last scene, so labels stay sensible. */
export const DEMO_NOW = Date.parse('2026-08-14T14:34:00Z')

const at = (time: string) => `2026-08-14T${time}.000000Z`

// ── The burst that collapses: one node, re-told as it grows ──────────────────

const burstObjects = [doc.signagePlanRevB, doc.motionTestRevB, doc.heroDesktopRevB, doc.colourTokensV1]

function burstAt(count: number): FeedNode {
  if (count === 1) {
    return activity({
      id: 'demo-burst', verb: 'upload', icon: 'file-up',
      published_at: at('14:31:02'),
      headline_template: ':actor uploaded :object to :target',
      actor: who.ines, object: burstObjects[0], target: where.passwordCrackdown,
    })
  }

  return group({
    id: 'demo-burst', verb: 'upload', axis: 'repeat', count, icon: 'file-up',
    published_at: at('14:31:02'),
    headline_template: ':actor uploaded :count files to :target',
    actors: [who.ines], targets: [where.passwordCrackdown],
    objects: burstObjects.slice(0, Math.min(count, 3)),
    distinct: { actors: 1, objects: count, targets: 1 },
  })
}

function approvalsAt(count: number): FeedNode {
  const actors = [who.marcus, who.priya, who.bob].slice(0, count)

  if (count === 1) {
    return activity({
      id: 'demo-approve', verb: 'approve', icon: 'file-check',
      published_at: at('14:32:20'),
      headline_template: ':actor approved :object',
      actor: who.marcus, object: doc.proofSheetFinal2,
    })
  }

  return group({
    id: 'demo-approve', verb: 'approve', axis: 'actors', count, icon: 'file-check',
    published_at: at('14:32:20'),
    headline_template: ':actors approved :count documents',
    actors,
    distinct: { actors: count, objects: count },
  })
}

const comment = activity({
  id: 'demo-comment', verb: 'comment', icon: 'message-circle',
  published_at: at('14:31:48'),
  headline_template: ':actor commented on :target',
  actor: who.priya, object: note.overflow, target: doc.annualReportV3,
})

const synced = activity({
  id: 'demo-sync', verb: 'sync', icon: 'refresh-cw',
  published_at: at('14:33:05'),
  headline_template: ':actor synced :object to :target',
  actor: { type: 'storyfeed.party', id: '1', label: 'Concur Web Service', url: null, attributes: {}, modal: false, component: null, data: {} },
  object: doc.expenseReportQ3, target: where.passwordCrackdown,
})

const joined = activity({
  id: 'demo-join', verb: 'join', icon: 'user-plus',
  published_at: at('14:33:40'),
  headline_template: ':actor joined :target',
  actor: who.deja, target: where.portMigration,
})

// ── Preseed: what the prerender shows before a single tick ──────────────────

export const PRESEED_FEED: FeedNode[] = [
  activity({
    id: 'demo-seed-1', verb: 'create', icon: 'square-check',
    published_at: at('14:29:10'),
    headline_template: ':actor added the task :object in :context',
    actor: who.deja, object: job.kerningPassPricingTable, context: where.passwordCrackdown,
  }),
  activity({
    id: 'demo-seed-2', verb: 'create', icon: 'folder',
    published_at: at('14:28:30'),
    headline_template: ':actor created the project :object for :target',
    actor: who.ines, object: where.birdRemoval, target: firm.chirp,
  }),
]

export const PRESEED_PULSE: PulseLine[] = [
  { time: '14:28:30', text: 'POST /clients/1/projects', kind: 'request' },
  { time: '14:28:30', text: 'ProjectCreated', kind: 'event' },
  { time: '14:29:10', text: 'POST /projects/4/tasks', kind: 'request' },
  { time: '14:29:10', text: 'TaskCreated', kind: 'event' },
]

// ── The loop ─────────────────────────────────────────────────────────────────

const replace = (feed: FeedNode[], node: FeedNode) => {
  const next = feed.filter((n) => n.id !== node.id)

  return [node, ...next].slice(0, 6)
}

const upload = (time: string): PulseLine[] => [
  { time, text: 'POST /projects/4/documents', kind: 'request' },
  { time, text: 'DocumentUploaded', kind: 'event' },
]

export const STEPS: Step[] = [
  // Scene A — the burst. One activity, then the SAME node re-told as a group
  // whose count ticks up: aggregation, demonstrated without a word.
  { delay: 1600, lines: upload('14:31:02'), apply: (f) => replace(f, burstAt(1)) },
  { delay: 2600, lines: upload('14:31:19'), apply: (f) => replace(f, burstAt(2)) },
  { delay: 2200, lines: upload('14:31:31'), apply: (f) => replace(f, burstAt(3)) },
  { delay: 2000, lines: upload('14:31:40'), apply: (f) => replace(f, burstAt(4)) },

  // Scene B — a comment, arriving with its preview.
  {
    delay: 3200,
    lines: [
      { time: '14:31:48', text: 'POST /documents/88/comments', kind: 'request' },
      { time: '14:31:48', text: 'CommentPosted', kind: 'event' },
    ],
    apply: (f) => replace(f, comment),
  },

  // Scene C — different people, one act: the actors axis takes over.
  { delay: 3000, lines: [
      { time: '14:32:20', text: 'POST /documents/93/approve', kind: 'request' },
      { time: '14:32:20', text: 'DocumentApproved', kind: 'event' },
    ], apply: (f) => replace(f, approvalsAt(1)) },
  { delay: 2100, lines: [
      { time: '14:32:34', text: 'POST /documents/94/approve', kind: 'request' },
      { time: '14:32:34', text: 'DocumentApproved', kind: 'event' },
    ], apply: (f) => replace(f, approvalsAt(2)) },
  { delay: 2100, lines: [
      { time: '14:32:47', text: 'POST /documents/95/approve', kind: 'request' },
      { time: '14:32:47', text: 'DocumentApproved', kind: 'event' },
    ], apply: (f) => replace(f, approvalsAt(3)) },

  // Scene D — no request at all: a queued job, and an actor with no model.
  {
    delay: 3400,
    lines: [
      { time: '14:33:04', text: 'Queued  SyncConcurExpenses', kind: 'job' },
      { time: '14:33:05', text: 'Done    SyncConcurExpenses  412ms', kind: 'job' },
      { time: '14:33:05', text: 'ExpenseSynced', kind: 'event' },
    ],
    apply: (f) => replace(f, synced),
  },

  // Scene E — quiet close.
  {
    delay: 3200,
    lines: [
      { time: '14:33:40', text: 'POST /projects/3/members', kind: 'request' },
      { time: '14:33:40', text: 'MemberJoined', kind: 'event' },
    ],
    apply: (f) => replace(f, joined),
  },

  // Hold the finished story, then the orchestrator resets and replays.
  { delay: 6000, lines: [] },
]

/** The state the loop ends on — also what reduced-motion visitors see. */
export function finalFeed(): FeedNode[] {
  let feed = [...PRESEED_FEED]

  for (const step of STEPS) {
    if (step.apply) {
      feed = step.apply(feed)
    }
  }

  return feed
}

export function finalPulse(): PulseLine[] {
  return [...PRESEED_PULSE, ...STEPS.flatMap((s) => s.lines)]
}
