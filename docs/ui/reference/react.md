---
kit: react
---

# React Components

Every component the React kit exports, with its props and render props, and
the options `FeedProvider` takes. Import them from the kit's directory,
`@/components/storyfeed` by default.

```tsx
<FeedProvider FEED_LINK={Link}>
    <FeedStream page={feed} rail="actor" onLoadMore={loadOlder} />
</FeedProvider>
```

## The Feed

### `FeedStream`

A page of the feed, with day headings, each node, and a "Load older
activity" button while there is a next cursor.

| Prop | Default | Accepts |
|---|---|---|
| `page` | | any [page shape](/ui/reference/options#page-shapes) as JSON |
| `items` | | the nodes to draw, in place of `page` |
| `nextCursor` | | the next page's cursor when you pass `items`; `null` at the end of the feed |
| `onLoadMore` | | `() => void`, called when the reader asks for older activity |
| `loadingMore` | `false` | `true` disables the button and shows "Loading…" |
| `grouped` | `true` | `false` hides the day headings |
| `rail` | | a [rail](/ui/reference/options#rails) name or `{ primary, secondary }`; unset draws `actor-only` |
| `childRail` | | the rail for expanded group members; unset inherits the group's |
| `interactive` | | `false` draws groups without a disclosure control |
| `collapsed` | | the initial group state; see [Group State](/ui/reference/options#group-state) |
| `dividers` | `{}` | labels keyed by item id, drawn on the rail before those items |
| `dividerStyle` | `'branch'` | how a divider meets the rail: `branch` or `dot` |
| `empty` | `'No activity yet.'` | a React node for an empty page |
| `className` | `''` | classes for the root element |
| `style` | | styles for the root element, including CSS variables such as `--sf-font-size` |

| Render Prop | Receives | Returns |
|---|---|---|
| `body` | `{ node }` | content added under each row's meta line, before its bodies |
| `annotations` | `{ node }` | content added at the end of each row |
| `time` | `{ node, label }` | each row's timestamp; `null` omits it |

The render props reach activities, groups and expanded group members.

```tsx
<FeedStream
    items={items}
    nextCursor={nextCursor}
    loadingMore={loading}
    onLoadMore={loadOlder}
    time={({ node, label }) => <Link href={`/activity/${node.id}`}>{label}</Link>}
/>
```

### `FeedNodeView`

One node. It draws `FeedItem` or `FeedGroup`, whichever the node is.

| Prop | Default | Accepts |
|---|---|---|
| `item` | | an activity or group node |
| `isLast` | | `true` ends the rail at this row |
| `rail` | | a [rail](/ui/reference/options#rails) |
| `childRail` | | the rail for a group's expanded members |
| `interactive` | | `false` draws a group without a disclosure control |
| `collapsed` | | a group's initial state |

| Render Prop | Receives | Returns |
|---|---|---|
| `body` | `{ node }` | content added before the bodies |
| `annotations` | `{ node }` | content added at the end of the row |
| `time` | `{ node, label }` | the timestamp; `null` omits it |

## Rows

### `FeedItem`

An activity row.

| Prop | Default | Accepts |
|---|---|---|
| `item` | | an activity node |
| `dense` | `false` | `true` draws the compact row used for group members |
| `isLast` | `false` | `true` ends the rail at this row |
| `rail` | | a [rail](/ui/reference/options#rails) |

| Render Prop | Receives | Returns |
|---|---|---|
| `body` | `{ node }` | content added before the bodies |
| `annotations` | `{ node }` | content added at the end of the row |
| `time` | `{ node, label }` | the timestamp; `null` omits it |

### `FeedGroup`

A group row, with its strip of member pictures and its members behind a
native `<details>`.

| Prop | Default | Accepts |
|---|---|---|
| `item` | | a group node |
| `isLast` | `false` | `true` ends the rail at this row |
| `rail` | | a [rail](/ui/reference/options#rails) |
| `childRail` | | the rail for expanded members |
| `interactive` | `true` | `false` draws no disclosure control |
| `collapsed` | `null` | the initial state |

| Render Prop | Receives | Returns |
|---|---|---|
| `body` | `{ node }` | content for the group and each member |
| `annotations` | `{ node }` | content at the end of the group and each member |
| `time` | `{ node, label }` | the group's and each member's timestamp |

### `FeedHeadline`

A headline, each entity in it linked.

| Prop | Default | Accepts |
|---|---|---|
| `template` | | the node's `headline_template`, or `null` |
| `headline` | | the node's `headline`, drawn when there is no template |
| `entities` | | the node's singular role slots |
| `sample` | `{}` | a group's `sample` |
| `distinct` | `{}` | a group's `distinct` counts |
| `count` | `0` | a group's member count |
| `verb` | | the node's verb, drawn when there is neither |
| `aggregate` | | `true` for a group |

### `FeedMeta`

The line under a headline: the time, a time range and the roles the headline
does not name.

| Prop | Default | Accepts |
|---|---|---|
| `node` | | an activity or group node |
| `templates` | | the headline templates the row draws, to tell which roles they name |
| `children` | | the timestamp |

## The Rail

### `FeedIcon`

The activity's icon, in a disc or as a badge. Edit `FeedIcon.tsx` to draw
your glyph tokens.

| Prop | Default | Accepts |
|---|---|---|
| `icon` | | the node's glyph token |
| `intent` | | the node's `glyph_intent`, written to `data-sf-intent` |
| `variant` | `'disc'` | `disc` or `badge` |

### `EntityAvatar`

An entity's face: its `media.icon`, else its initials on its colour.

| Prop | Default | Accepts |
|---|---|---|
| `entity` | | an entity, or `null` for a blank disc |
| `size` | `'md'` | `md`, `sm`, `badge`, `tile` or `pair` |
| `className` | `''` | classes for the avatar |

### `EntityLink`

An entity's label, linked through `FEED_LINK` when it has a link.

| Prop | Default | Accepts |
|---|---|---|
| `entity` | | an entity, or `null` |
| `fallback` | | the text drawn when the entity is `null` |

## Pictures

### `FeedMedia`

One picture, its box reserved from its declared width and height. With
`FEED_MEDIA` provided, that component draws it instead.

| Prop | Default | Accepts |
|---|---|---|
| `image` | | `{ src, alt, width, height }` |
| `href` | | a link around the picture |
| `linkAttributes` | | attributes for that link; `href` and event handlers are dropped |
| `className` | `''` | classes for the picture |

### `FeedMediaStrip`

A group's strip: one square tile per member, then a "+N" tile.

| Prop | Default | Accepts |
|---|---|---|
| `tiles` | | tiles from `strip()` in `shared/strip.ts`, or your own `{ image, href }` objects |
| `overflow` | `0` | the "+N" count |
| `toggle` | | `{ expanded, controls, label, onToggle }`: the "+N" tile becomes a button that calls `onToggle` |

## Bodies

The kit draws a body with the renderer registered for its type in
`FEED_BODIES`, else its own. A type with neither draws its `$fallback` line,
or nothing. The built-in renderers live in `body/index.tsx`, one function per
type: `CallToAction`, `ComponentBody`, `Excerpt`, `FileAttachment` (also
`Storyfeed/Body/File`), `Image`, `ItemList`, `KeyValue`, `MediaObject`,
`Prose` and `Table`.

Every renderer receives `BodyProps`:

```tsx
import type { BodyProps } from '@/components/storyfeed';

export default function Shipment({ payload }: BodyProps) {
    return <p>{payload.carrier} · {payload.tracking}</p>;
}
```

### `MediaObject`

| Prop | Default | Accepts |
|---|---|---|
| `payload` | | the body as it appears in the payload |
| `entityLabel` | | the label of the entity that carries the body |
| `entityUrl` | | that entity's link URL |
| `entityLink` | | that entity's link: `{ href, modal, attributes }` |
| `entityMedia` | | that entity's `media` |
| `imagePlacement` | | `beside` or `below` the text; unset reads `FEED_MEDIA_OBJECT_PLACEMENT`, then `beside` |

`BodyProps` is these six props. A renderer reads the ones it needs.

## `FeedProvider`

`FeedProvider` supplies the kit's options to everything inside it. A nested
provider inherits the outer one's options; its own win, and `FEED_BODIES`
maps merge.

```tsx
<FeedProvider FEED_LINK={Link} FEED_BODIES={{ 'Acme/Shipment': Shipment }}>
    <FeedStream page={feed} />
</FeedProvider>
```

| Seam | Value | Default |
|---|---|---|
| `FEED_LINK` | a component that takes `href` and children, such as Inertia's `Link`; receives the entity's attributes and, for a modal link, `modal` | `'a'` |
| `FEED_BODIES` | `{ [type]: ComponentType<BodyProps> }`, body type to renderer; one registered for a built-in type replaces the kit's | `{}` |
| `FEED_COMPONENTS` | `{ [name]: ComponentType }`, Component body name to component; receives the body's `props` | `{}` |
| `FEED_MEDIA` | a component that receives `image`, `href`, `linkAttributes` and `className`, and draws every picture | none |
| `FEED_FILE_LABELLER` | `({ name, mediaType }) => string \| null`; `null` uses the built-in MIME labels | none |
| `FEED_MEDIA_OBJECT_PLACEMENT` | `'beside'` or `'below'` | `'beside'` |
| `FEED_NOW` | a timestamp in milliseconds that pins the clock | the browser's clock |

## Server Rendering

The server render and the first client render draw ISO timestamps and group
days in UTC, so they match. After mounting, labels use the browser's locale
and time zone and refresh with age. `FEED_NOW` pins the clock.

## Other Exports

| Export | Is |
|---|---|
| `readPage(page)` | a page's `{ items, nextCursor }`, whichever shape it has |
| `rail(name)` | a rail name as `{ primary, secondary }` |
| `RAIL_NAMES` | the four rail names |
| `useFeedOptions()` | the nearest `FeedProvider`'s options |
| `useRelativeTime(iso)`, `useFeedDays(items)` | the hooks behind the timestamps and day headings |
| `FeedStreamProps`, `NodeProps`, `FeedRenderProps`, `BodyProps`, `FeedPageLike` | prop and page types |
| `FeedNode`, `ActivityNode`, `GroupNode`, `FeedEntity`, `FeedPayload`, `FeedPagePayload` | payload types |

## Words

`shared/messages.ts` holds the role words after the time, "Yesterday", and
"from" and "until" for time ranges. The other words, such as "Show all" and
"Load older activity", are in the components.
