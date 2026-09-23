# Live Rendering

A live feed polls for new activities, or loads older pages as the reader
scrolls. It needs three things the [Blade loop](/basics/rendering) does not:

- **Reconciliation.** An activity drawn alone can be absorbed into a group by
  the next poll, and merging by id draws it twice.
- **`sync_token` handling**, for rewrites below the pages you hold.
- **Following empty pages.** A page can be empty while its cursor is not null.

The example is Vue, without polling, avatars or styling.

::: headless it reconciles nothing on the client
The package provides stable node ids, `children`, `distinct` and a
`sync_token`. Merging pages on the client is yours.
:::

## The Payload Types

```ts
// resources/js/feed/types.ts: the payload keys a renderer reads
export type FeedRole = 'actor' | 'object' | 'target' | 'context' | 'origin' | 'result' | 'instrument'

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

interface BaseNode extends Record<FeedRole, FeedEntity | null> {
  id: string
  verb: string
  published_at: string
  headline_template: string | null
  headline: string | null
  glyph: string | null
}

export interface ActivityNode extends BaseNode {
  kind: 'activity'
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

Both node kinds carry all seven role keys. On a group, a singular role key is
filled only when that role has one entity; the
[payload contract](/reference/payload#group-node) has the rule.

## The `useFeed` Composable

```ts
// resources/js/feed/useFeed.ts
import { computed, ref, watch, type Ref } from 'vue'
import type { FeedNode, FeedPayload } from './types'

/** Follow at most this many consecutive empty pages before handing back control. */
const EMPTY_PAGE_HOPS = 5

export function useFeed(page: Ref<FeedPayload>, pageUrl: (cursor: string) => string) {
  const nodes = ref(new Map<string, FeedNode>())
  const nextCursor = ref<string | null>(page.value.next_cursor)
  const loadingMore = ref(false)

  /** Flips true when a rewrite invalidates the stream. Refetch page 1. */
  const needsResync = ref(false)

  /** `undefined` until the first payload sets it. */
  let syncToken: string | null | undefined

  /**
   * A changed `sync_token` means settled history was rewritten below the head
   * page. Drop everything and page again from the head.
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

    // Each activity appears in one node per mode, so a held node containing
    // an activity the fresh page lists as a child is stale.
    const claimed = new Set(
      fresh.items.flatMap((item) =>
        item.kind === 'group' ? item.children.map((child) => child.id) : [],
      ),
    )

    for (const [id, node] of nodes.value) {
      if (headIds.has(id)) {
        continue
      }

      // Rule 1, time window: a held node inside the fresh page's range that
      // the fresh page no longer lists has been regrouped.
      const insideWindow = !!windowStart && node.published_at >= windowStart

      // Rule 2, member identity: catches regrouping below the head page.
      // `children` is truncated on large groups, so keep both rules.
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
      // A page can be empty with a non-null cursor. The feed ends when the
      // cursor is null, so follow empty pages, up to EMPTY_PAGE_HOPS.
      for (let hop = 0; hop < EMPTY_PAGE_HOPS && nextCursor.value; hop++) {
        const response = await fetch(pageUrl(nextCursor.value), {
          headers: { Accept: 'application/json' },
        })
        const older: FeedPayload = await response.json()

        // A rewrite mid-scroll invalidates the held cursor. Stop, and refetch
        // from the head.
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

  // Re-sort on every change: pages do not only append.
  const items = computed(() =>
    [...nodes.value.values()].sort(
      (a, b) =>
        b.published_at.localeCompare(a.published_at) || b.id.localeCompare(a.id),
    ),
  )

  return { items, nextCursor, loadingMore, needsResync, loadMore }
}
```

When `needsResync` flips, refetch the first page: with Inertia, a partial
reload of the feed prop; with a plain API, the endpoint without a cursor. The
watcher on `page` then rebuilds the stream.

## The Node Component

```vue
<!-- resources/js/feed/FeedNode.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { FeedNode, FeedRole } from './types'

const props = defineProps<{ node: FeedNode }>()

/** Resolve an emitted singular token from its role key, then exemplars. */
function one(role: FeedRole) {
  if (props.node[role]) return props.node[role]
  if (props.node.kind !== 'group') return null

  // Only when `distinct` says there is exactly one: exemplars[0] would name
  // one entity over several.
  const shown = props.node.exemplars?.[`${role}s`] ?? []

  return shown.length === 1 && props.node.distinct?.[`${role}s`] === 1
    ? shown[0]
    : null
}

/** What the server counted, minus what it gave us names for. */
function overflow(role: FeedRole): number {
  if (props.node.kind !== 'group') return 0

  const shown = props.node.exemplars?.[`${role}s`]?.length ?? 0

  return Math.max((props.node.distinct?.[`${role}s`] ?? 0) - shown, 0)
}

/** "Ann, Sally and Bob" — or "Ann, Sally, Bob and 7 more" when it overflows. */
function list(role: FeedRole): string {
  if (props.node.kind !== 'group') return '—'

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
      case ':context':
      case ':origin':
      case ':result':
      case ':instrument': return one(token.slice(1) as FeedRole)?.label ?? 'Something'
      case ':actors':
      case ':objects':
      case ':targets':
      case ':contexts':
      case ':origins':
      case ':results':
      case ':instruments': return list(token.slice(1, -1) as FeedRole)
      case ':count': return props.node.kind === 'group' ? String(props.node.count) : '1'
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

    <!-- grammar written as a closure arrives pre-rendered -->
    <p v-else-if="node.headline">{{ node.headline }}</p>

    <!-- no sentence: draw the count and open the group, never prose built
         from its entities -->
    <template v-else-if="node.kind === 'group'">
      <p>{{ node.count }} activities</p>
      <FeedNode v-for="child in node.children" :key="child.id" :node="child" />
    </template>

    <time :datetime="node.published_at">{{ node.published_at }}</time>
  </article>
</template>
```

`FeedNode` renders group children with itself. A single-file component can
refer to itself by filename; outside the SFC compiler, add
`defineOptions({ name: 'FeedNode' })`.

"Someone" stands for an actor that is null. A system that acted is a named
party instead: see [Parties & Anonymous Actors](/deeper/parties).

## Verifying the Renderer

Run the [fallback-leak check](/basics/rendering#verifying-your-renderer) across
every mode and axis.
