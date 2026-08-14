# A live renderer

The [Blade loop](/guide/quickstart#_5-render-it) renders a page. A live feed —
one that polls, or accumulates pages as the reader scrolls — needs three more
things, and none of them can be demonstrated by a static template:

- **Reconciliation**, because nodes regroup underneath you. An activity you
  rendered alone can be absorbed into a group by the next poll, and merging by
  id renders it twice.
- **`sync_token` handling**, for rewrites that happen where no reconciliation
  can see them.
- **The bounded empty-page loop**, because an empty page with a live cursor is
  legal.

The example is Vue. Polling wiring, avatars and styling are omitted.

## Types

```ts
// The payload contract, as much of it as a renderer needs.
export type FeedRole = 'actor' | 'object' | 'target' | 'context'

export interface FeedEntity {
  type: string
  id: string
  label: string | null       // null ⇒ degraded; render a placeholder
  url: string | null         // null ⇒ not linkable
  attributes: Record<string, string>
  modal: boolean
  component: string | null
  data: Record<string, unknown>
}

interface BaseNode {
  id: string
  verb: string
  published_at: string
  headline_template: string | null
  headline: string | null
  icon: string | null
}

export interface ActivityNode extends BaseNode {
  kind: 'activity'
  actor: FeedEntity | null
  object: FeedEntity | null
  target: FeedEntity | null
  context: FeedEntity | null
  data: Record<string, unknown>
}

export interface GroupNode extends BaseNode {
  kind: 'group'
  axis: string
  count: number
  exemplars: Partial<Record<`${FeedRole}s`, FeedEntity[]>>
  distinct: Partial<Record<`${FeedRole}s`, number>>
  children: ActivityNode[]
  children_truncated: boolean
}

export type FeedNode = ActivityNode | GroupNode

export interface FeedPayload {
  payload_version: number
  items: FeedNode[]
  next_cursor: string | null
  sync_token: string | null
}
```

Note what a `GroupNode` does **not** have: `actor`, `object`, `target`,
`context`. That absence is why `one()` below exists.

## The stream

```ts
import { computed, ref, watch, type Ref } from 'vue'

/** Follow at most this many consecutive empty pages before handing back control. */
const EMPTY_PAGE_HOPS = 5

export function useFeed(page: Ref<FeedPayload>, pageUrl: (cursor: string) => string) {
  const nodes = ref(new Map<string, FeedNode>())
  const nextCursor = ref<string | null>(page.value.next_cursor)
  const loadingMore = ref(false)

  /** Flips true when a rewrite invalidates the stream. Refetch page 1. */
  const needsResync = ref(false)

  /** `undefined` = no epoch yet; the first payload sets the baseline. */
  let syncToken: string | null | undefined

  /**
   * `sync_token` is the server saying "settled history was rewritten" — a
   * backfill, or a re-curation. It is a RESYNC TRIGGER, not a repair rule:
   * the rewrite happened below the head page where no reconciliation can
   * see it, so the only safe response is to drop everything and re-page.
   */
  function epochChanged(fresh: FeedPayload): boolean {
    const token = fresh.sync_token ?? null

    if (syncToken === undefined) {
      syncToken = token

      return false
    }

    if (token === syncToken) {
      return false
    }

    syncToken = token
    nodes.value.clear()

    return true
  }

  function mergeHead(fresh: FeedPayload): void {
    if (epochChanged(fresh)) {
      nextCursor.value = fresh.next_cursor
      needsResync.value = false
    }

    const headIds = new Set(fresh.items.map((item) => item.id))
    const windowStart = fresh.items.at(-1)?.published_at

    // Every activity id the fresh page has claimed under some node. Curation
    // gives each activity exactly one node per mode, so if a fresh node lists
    // it as a child, whatever we are still holding that contains it is stale —
    // regardless of where it falls in time.
    const claimed = new Set(
      fresh.items.flatMap((item) =>
        item.kind === 'group' ? item.children.map((child) => child.id) : [],
      ),
    )

    for (const [id, node] of nodes.value) {
      if (headIds.has(id)) {
        continue
      }

      // Rule 1 — time window. Catches the common case cheaply: a node inside
      // the fresh page's range that the fresh page no longer mentions has
      // been regrouped.
      const insideWindow = !!windowStart && node.published_at >= windowStart

      // Rule 2 — member identity. Catches regrouping that lands BELOW the
      // head page, which rule 1 cannot see. Caveat: `children` is truncated
      // on large groups, so this is a strong signal, not a total one.
      // Neither rule replaces the other.
      const reclaimed =
        node.kind === 'group'
          ? node.children.some((child) => claimed.has(child.id))
          : claimed.has(node.id)

      if (insideWindow || reclaimed) {
        nodes.value.delete(id)
      }
    }

    for (const item of fresh.items) {
      nodes.value.set(item.id, item)
    }
  }

  mergeHead(page.value)
  watch(page, (fresh) => mergeHead(fresh))

  async function loadMore(): Promise<void> {
    if (!nextCursor.value || loadingMore.value) {
      return
    }

    loadingMore.value = true

    try {
      // An empty page carrying a usable cursor is legal: a page can lose every
      // node to a rewrite between the server selecting candidates and
      // hydrating them. End of feed is the CURSOR being null, never the page
      // being empty — so keep following, or the reader gets a "load more"
      // button that visibly does nothing. Bounded, so a server returning empty
      // pages forever cannot spin the client.
      for (let hop = 0; hop < EMPTY_PAGE_HOPS && nextCursor.value; hop++) {
        const response = await fetch(pageUrl(nextCursor.value), {
          headers: { Accept: 'application/json' },
        })
        const older: FeedPayload = await response.json()

        // A rewrite mid-scroll invalidates the cursor we are holding: it was
        // minted in the previous epoch. epochChanged() has already dropped the
        // accumulated nodes, so stop paging deeper — continuing would rebuild
        // the stream from the middle, with a hole where the head used to be.
        if (epochChanged(older)) {
          needsResync.value = true

          break
        }

        for (const item of older.items) {
          nodes.value.set(item.id, item)
        }

        nextCursor.value = older.next_cursor

        if (older.items.length > 0) {
          break
        }
      }
    } finally {
      loadingMore.value = false
    }
  }

  // Render by id and re-sort — never assume append-only.
  const items = computed(() =>
    [...nodes.value.values()].sort(
      (a, b) =>
        b.published_at.localeCompare(a.published_at) || b.id.localeCompare(a.id),
    ),
  )

  return { items, nextCursor, loadingMore, needsResync, loadMore }
}
```

When `needsResync` flips, refetch the first page — with Inertia that is a partial
reload of the feed prop, with a plain API it is a fetch of the uncursored
endpoint. The watcher on `page` then rebuilds the stream.

## The node

```vue
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ node: FeedNode }>()

/**
 * A singular token resolves from the exemplar list on a group, and from the
 * role key on an activity. A role the axis PINS is a list of exactly one, by
 * construction — which is what makes the singular token safe there.
 *
 * Group nodes carry no `actor`/`object`/`target`/`context` keys at all, so
 * reading them directly yields the fallback on every group.
 */
function one(role: FeedRole) {
  return props.node.exemplars?.[`${role}s`]?.[0] ?? props.node[role] ?? null
}

/** What the server counted, minus what it gave us names for. */
function overflow(role: FeedRole): number {
  const shown = props.node.exemplars?.[`${role}s`]?.length ?? 0

  return Math.max((props.node.distinct?.[`${role}s`] ?? 0) - shown, 0)
}

/** "Ann, Sally and Bob" — or "Ann, Sally, Bob and 7 more" when it overflows. */
function list(role: FeedRole): string {
  const shown = (props.node.exemplars?.[`${role}s`] ?? []).map((e) => e.label ?? '—')
  const more = overflow(role)

  if (shown.length === 0) return '—'
  if (more > 0) return `${shown.join(', ')} and ${more} more`
  if (shown.length === 1) return shown[0]

  return `${shown.slice(0, -1).join(', ')} and ${shown.at(-1)}`
}

const sentence = computed(() => {
  const template = props.node.headline_template

  if (!template) return null

  return template.replace(/:[a-z]+/g, (token) => {
    switch (token) {
      case ':actor': return one('actor')?.label ?? 'Someone'
      case ':object':
      case ':target':
      case ':context': return one(token.slice(1) as FeedRole)?.label ?? 'Something'
      case ':actors':
      case ':objects':
      case ':targets':
      case ':contexts': return list(token.slice(1, -1) as FeedRole)
      case ':count': return String(props.node.count ?? 1)
      // Prefer the self-overflowing plural above; :others is kept for
      // templates that name one actor and count the rest.
      case ':others': return `${overflow('actor')} others`
      default: return token
    }
  })
})
</script>

<template>
  <article>
    <p v-if="sentence">{{ sentence }}</p>

    <!-- Closure grammar pre-renders a string instead of a template. -->
    <p v-else-if="node.headline">{{ node.headline }}</p>

    <!--
      Both null means the server REFUSED to name this group: the axis does not
      pin the roles its singular template would need, so any sentence composed
      here would misattribute many actors' work to one. Degrade to the count,
      never to entity-composed prose — and open it, because a group nobody can
      name is the one whose members should be visible.
    -->
    <template v-else-if="node.kind === 'group'">
      <p>{{ node.count }} activities</p>
      <FeedNode v-for="child in node.children" :key="child.id" :node="child" />
    </template>

    <time :datetime="node.published_at">{{ node.published_at }}</time>
  </article>
</template>
```

`FeedNode` recurses into itself for group children. A single-file component can
refer to itself by filename; outside the SFC compiler, add
`defineOptions({ name: 'FeedNode' })`.

## Verifying a renderer

Run the [fallback-leak check](/basics/rendering#verifying-your-renderer) across
every mode and axis. Real output from the showcase feed:

```
activity   Priya Raman commented on Rewrite the colour tokens
actors     Priya Raman, Marcus Webb and Sally Nguyen commented on proof-sheet-rev-a.fig
scene      Priya Raman, Marcus Webb, Aiko Tanaka and 5 more added 12 items in Chronological Feed Restore
composite  Tomás Rivera approved wordmark-v3.png and hero-mobile-rev-a.fig in Port Migration
targets    Aiko Tanaka commented in hero-desktop-wip.png, Export the motion tests, colour-tokens-final-2.docx and 6 more
repeat     Deja Williams completed Kerning pass on the motion tests, Simplify the icon library, …
```

An un-snapshotted entity has `label: null` and should render your placeholder,
so assert on fallbacks for tokens whose entities exist.
