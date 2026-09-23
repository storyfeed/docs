# Polling and Pagination

A feed that polls for new activities, or loads older pages as the reader
scrolls, holds nodes from several responses at once. Three rules keep what it
holds correct.

::: headless
:::

<script setup>
import { who, where, orders, activity, group } from '../.vitepress/theme/samples'

const first = activity({
  id: 'pp1', verb: 'place', glyph: 'shopping-bag',
  published_at: '2026-08-14T18:44:02.000000Z',
  headline_template: ':actor placed :object with :target',
  actor: who.regular, object: orders.first, target: where.kitchen,
})

const second = activity({
  id: 'pp2', verb: 'place', glyph: 'shopping-bag',
  published_at: '2026-08-14T18:46:10.000000Z',
  headline_template: ':actor placed :object with :target',
  actor: who.regular, object: orders.second, target: where.kitchen,
})

const grouped = group({
  id: 'pp3', verb: 'place', axis: 'repeat', count: 2, glyph: 'shopping-bag',
  published_at: '2026-08-14T18:46:10.000000Z',
  headline_template: ':actor placed :count orders with :target',
  actors: [who.regular], targets: [where.kitchen],
  objects: [orders.second, orders.first],
  distinct: { actors: 1, objects: 2, targets: 1 },
  children: [second, first],
})
</script>

## Merging a Poll

On screen:

<FeedExample :items="[first]" />

The same customer places a second order, and the next poll returns:

<FeedExample :items="[grouped]" expanded />

The group is a new node, with a new id, and the row already on screen is one of
its `children`. Adding the group beside the row shows the first order twice.

When a fresh page arrives, drop every held node that it replaces:

- a held node listed as a child of a fresh group, and
- a held node inside the time range the fresh page covers that the fresh page
  no longer lists.

Keep both checks. `children` is capped by `grouping.children_limit`, so a large
group may not list every row it absorbed.

## Loading Older Pages

Pass `next_cursor` back to get the next page. A page can be empty while its
`next_cursor` is not `null`; the feed ends only when `next_cursor` is `null`.
Keep following the cursor, up to a few hops.

## Detecting Rewritten History

The envelope carries a `sync_token`. When it differs from the last one you
saw, history below the pages you hold was rewritten, for example by
`storyfeed:curate --rehash` or a [healer](/deeper/healing). Drop everything
you hold and fetch the first page again. Compare for equality only; `null` to
a value counts as a change.

## Merging in Code

```ts
// resources/js/feed/merge.ts
type Node = { id: string, kind: 'activity' | 'group', published_at: string, children?: Node[] }
type Page = { items: Node[], next_cursor: string | null, sync_token: string | null }

let held = new Map<string, Node>()
let syncToken: string | null | undefined

/**
 * `head` is true for the first page (a poll), false for an older page.
 * Returns false when history was rewritten: fetch the first page again.
 */
export function merge(page: Page, head: boolean): boolean {
  if (syncToken !== undefined && page.sync_token !== syncToken) {
    syncToken = page.sync_token
    held = new Map()

    return false
  }

  syncToken = page.sync_token

  const listed = new Set(page.items.map((node) => node.id))
  const claimed = new Set(page.items.flatMap((node) => (node.children ?? []).map((child) => child.id)))
  const oldest = head ? page.items.at(-1)?.published_at : undefined

  for (const [id, node] of held) {
    const replaced = !!oldest && node.published_at >= oldest && !listed.has(id)

    const absorbed = claimed.has(id) || (node.children ?? []).some((child) => claimed.has(child.id))

    if (replaced || absorbed) {
      held.delete(id)
    }
  }

  for (const node of page.items) {
    held.set(node.id, node)
  }

  return true
}

/** Newest first. Re-sort after every merge: pages do not only append. */
export function nodes(): Node[] {
  return [...held.values()].sort(
    (a, b) => b.published_at.localeCompare(a.published_at) || b.id.localeCompare(a.id),
  )
}
```

An older page that comes back empty with a `next_cursor` gets the same call
again with that cursor.

The full rules are in the [payload contract](/reference/payload#cursor-semantics).
