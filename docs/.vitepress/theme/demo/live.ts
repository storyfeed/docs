/**
 * The live source for the landing ticker: the Newsroom's docs-demo endpoint.
 *
 * The scripted timeline stays the prerender and the fallback; this module only
 * ever upgrades the experience. The probe is short and quiet — if the endpoint
 * is missing, slow, or mid-deploy, the scripted loop plays and nothing on the
 * page admits an attempt was made. Two consecutive poll failures hand control
 * back the same way.
 *
 * Why live at all: the Newsroom simulates through the real package, so the
 * demo cannot drift from the implementation — when the spec changes, this pane
 * changes because the package did.
 */

export type LivePulseLine = {
  at: string
  kind: 'request' | 'event' | 'job'
  text: string
  status?: number
}

export type FeedModes = {
  live: Record<string, any>[]
  summary: Record<string, any>[]
  log: Record<string, any>[]
}

export type LiveSnapshot = {
  server_now: string
  pulse: LivePulseLine[]
  /**
   * Either shape is accepted: `items` (the original contract) or `modes` with
   * all three read modes, which lights the Log · Live · Summary toggles. The
   * docs tolerate both so the Newsroom can ship the richer one whenever.
   */
  feed: { items?: Record<string, any>[]; modes?: FeedModes }
}

/** Normalize either feed shape; null modes means "no toggles". */
export function feedModes(snapshot: LiveSnapshot): FeedModes | null {
  const modes = snapshot.feed.modes

  if (modes && Array.isArray(modes.live) && Array.isArray(modes.summary) && Array.isArray(modes.log)) {
    return modes
  }

  return null
}

/** Confirmed with the Newsroom before this lights up — one place to edit. */
export const LIVE_ENDPOINT = 'https://newsroom.storyfeed.dev/api/docs-demo/ticker'

const POLL_MS = 10_000

const PROBE_TIMEOUT_MS = 2_500

async function fetchSnapshot(timeout: number): Promise<LiveSnapshot | null> {
  try {
    const response = await fetch(LIVE_ENDPOINT, {
      signal: AbortSignal.timeout(timeout),
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      return null
    }

    const body = await response.json()

    const feedOk = Array.isArray(body?.feed?.items) || Array.isArray(body?.feed?.modes?.live)

    if (!Array.isArray(body?.pulse) || !feedOk) {
      return null
    }

    return body as LiveSnapshot
  } catch {
    return null
  }
}

/** One quiet attempt; null means "stay scripted". */
export function probeLive(): Promise<LiveSnapshot | null> {
  return fetchSnapshot(PROBE_TIMEOUT_MS)
}

/**
 * Poll until stopped or dead. Returns a stop function; calls `onDead` after
 * two consecutive failures so the caller can fall back to the script.
 */
export function startLive(
  onSnapshot: (snapshot: LiveSnapshot) => void,
  onDead: () => void,
): () => void {
  let failures = 0
  let stopped = false

  const timer = setInterval(async () => {
    const snapshot = await fetchSnapshot(POLL_MS - 1_000)

    if (stopped) {
      return
    }

    if (snapshot === null) {
      failures += 1

      if (failures >= 2) {
        stop()
        onDead()
      }

      return
    }

    failures = 0
    onSnapshot(snapshot)
  }, POLL_MS)

  function stop(): void {
    stopped = true
    clearInterval(timer)
  }

  return stop
}
