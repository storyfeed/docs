# Pages, Rails and Styles

<script setup>
import { scene, liveOf } from '../../.vitepress/theme/world'
const order = [scene.order]
const anonymous = [scene.cookbook.actorless.anonymous]
const crowd = liveOf(scene.cookbook.grouped.actors).slice(0, 1)
const orders = liveOf(scene.deeper.aggregation.orders)
const terminal = [scene.basics.activityContent.terminal]
const labelled = { [scene.order.id]: 'Orders' }
</script>

The values all three kits share: the page shapes they read, the rails, the
group states and the CSS variables. The attribute and prop names are on
[Blade Components](/ui/reference/blade).

## Page Shapes

`page` takes whatever a read returns: the collection from `get()`, or the
paginator from `cursorPaginate()`, `simplePaginate()` or `members()`. Blade
takes the PHP value; Vue and React take its JSON, with the nodes in `data`:

```json
{
    "data": [{ "id": "01K…", "type": "activity", "headline": "…" }],
    "next_cursor": "eyJpZCI6…",
    "sync_token": null,
    "payload_version": 1
}
```

The next page's cursor is `next_cursor`. `get()` and `simplePaginate()`
have none. Pages from core 0.18 and earlier, a `FeedPage` whose JSON keeps the
nodes in `items`, still work.

Pass `items` and `next-cursor` instead of `page` to draw nodes you hold
yourself, such as pages appended after "Older activity". An explicit
`items` or `next-cursor` wins over the one read from `page`. The node shape is
[The Payload Contract](/reference/payload).

## Rails

The rail is the column on the left of each row: a disc and, on it, a badge.

| Rail | Disc | Badge |
|---|---|---|
| `actor` | the actor's avatar | the activity's icon |
| `activity` | the activity's icon | the actor's avatar |
| `actor-only` | the actor's avatar | none |
| `activity-only` | the activity's icon | none |

<FeedExample hide-payload :items="order" rail="actor">

`rail="actor"`{attrs}

</FeedExample>

<FeedExample hide-payload :items="order" rail="activity">

`rail="activity"`{attrs}

</FeedExample>

<FeedExample hide-payload :items="order" rail="actor-only">

`rail="actor-only"`{attrs}

</FeedExample>

<FeedExample hide-payload :items="order" rail="activity-only">

`rail="activity-only"`{attrs}

</FeedExample>

Rows default to `actor-only` and expanded group members to `activity-only`.
Members follow `child-rail` when it is set, else their group's rail, and draw
no badge. A row without the disc's subject draws the other one, then a blank
disc. A row with several actors draws two faces in the disc and never a face
badge.

<FeedExample hide-payload :items="orders" :collapsed="false">

`rail`{attrs} unset

</FeedExample>

<FeedExample hide-payload :items="orders" rail="actor" :collapsed="false">

`rail="actor"`{attrs}

</FeedExample>

<FeedExample hide-payload :items="orders" rail="actor" child-rail="activity-only" :collapsed="false">

`rail="actor" child-rail="activity-only"`{attrs}

</FeedExample>

<FeedExample hide-payload :items="anonymous" rail="actor">

`rail="actor"`{attrs}, no actor

</FeedExample>

<FeedExample hide-payload :items="crowd" rail="actor" collapsed>

`rail="actor"`{attrs}, several actors

</FeedExample>

Vue and React also take a rail as `{ primary, secondary }`, each slot one of
`actor`, `activity` or `none`, the two never the same.

## Dividers

| Divider style | Draws |
|---|---|
| `branch` | the default: a curve off the rail into the label, darkening from the rail's colour (`border`) to the label's (`muted-foreground`); the rail line stops a small gap above it |
| `dot` | a dot on the rail, the label beside it |

The style applies to day headings and to the labels in `dividers`. `dividers`
is keyed by item id: `{ "01K…": "Timeline" }`.

<FeedExample hide-payload :items="order" :dividers="labelled" divider-style="branch">

`divider-style="branch"`{attrs}

</FeedExample>

<FeedExample hide-payload :items="order" :dividers="labelled" divider-style="dot">

`divider-style="dot"`{attrs}

</FeedExample>

## Group State

| `interactive` | `collapsed` | Groups |
|---|---|---|
| `true` | `null` | open when the group has no headline of its own; otherwise closed |
| `true` | `true` | closed |
| `true` | `false` | open |
| `false` | `null` | open, with no disclosure control |
| `false` | `true` | closed, with no disclosure control; members stay in the HTML for printing |

<FeedExample hide-payload :items="orders" :collapsed="true">

`:collapsed="true"`{attrs}

</FeedExample>

<FeedExample hide-payload :items="orders" :collapsed="false">

`:collapsed="false"`{attrs}

</FeedExample>

<FeedExample hide-payload :items="orders" :interactive="false">

`:interactive="false"`{attrs}

</FeedExample>

<FeedExample hide-payload :items="orders" :interactive="false" :collapsed="true">

`:interactive="false" :collapsed="true"`{attrs}

</FeedExample>

A group whose node has `expanded: true` opens in every case. Expanding shows
the members the node carries; it fetches nothing.

## CSS Variables

Set them on the feed or on any element around it.

```blade
<x-storyfeed::feed :page="$page" class="[--sf-font-size:0.875rem]" />
```

### `--sf-font-size`

The feed's body text. The other sizes follow it, and so do Tailwind's
`--spacing`, `--text-xs`, `--text-sm` and `--text-base` inside the feed, so
your own slot content on those utilities scales with the feed. Defaults to
`1rem`.

<FeedExample :items="order" rail="actor" style="--sf-font-size: 1.25rem">

`.sf-feed { --sf-font-size: 1.25rem; }`{css}

</FeedExample>

### `--sf-gutter`

The rail's width. Defaults to 2 × the font size.

<FeedExample :items="order" rail="actor" style="--sf-gutter: 5rem">

`.sf-feed { --sf-gutter: 5rem; }`{css}

</FeedExample>

### `--sf-gap`

The space between the rail and the row. Defaults to 0.75 × the font size.

<FeedExample :items="order" rail="actor" style="--sf-gap: 2.5rem">

`.sf-feed { --sf-gap: 2.5rem; }`{css}

</FeedExample>

### `--sf-disc`

The disc's size. Defaults to 2 × the font size.

<FeedExample :items="order" rail="actor" style="--sf-disc: 2.5rem">

`.sf-feed { --sf-disc: 2.5rem; }`{css}

</FeedExample>

### `--sf-badge`

An icon badge's size, on the `actor` rail. Defaults to 0.875 × the font size.

<FeedExample :items="order" rail="actor" style="--sf-badge: 1rem">

`.sf-feed { --sf-badge: 1rem; }`{css}

</FeedExample>

### `--sf-badge-face`

An avatar badge's size, on the `activity` rail. Defaults to 1.125 × the font size.

<FeedExample :items="order" rail="activity" style="--sf-badge-face: 1.25rem">

`.sf-feed { --sf-badge-face: 1.25rem; }`{css}

</FeedExample>

### `--sf-prose-max-h`

The height at which code and verbatim `Prose` scroll. Defaults to 24 × the font size.

<FeedExample :items="terminal" style="--sf-prose-max-h: 6rem">

`.sf-feed { --sf-prose-max-h: 6rem; }`{css}

</FeedExample>

### `--sf-code-bg`

Verbatim `Prose`'s background. Defaults to `#18181b`.

<FeedExample :items="terminal" style="--sf-code-bg: #1e3a5f">

`.sf-feed { --sf-code-bg: #1e3a5f; }`{css}

</FeedExample>

### `--sf-code-fg`

Verbatim `Prose`'s text. Defaults to `#f4f4f5`.

<FeedExample :items="terminal" style="--sf-code-fg: #fde68a">

`.sf-feed { --sf-code-fg: #fde68a; }`{css}

</FeedExample>

## Colour Tokens

The kits draw with the Laravel starter kits' colour tokens:

| Token | Use |
|---|---|
| `background`, `foreground` | surface and text |
| `card` | card surface |
| `muted`, `muted-foreground` | secondary surface and text |
| `primary`, `primary-foreground` | buttons and text on them |
| `border`, `ring` | boundaries and focus rings |

[Colour Tokens](/ui/customizing#colour-tokens) shows the theme block for an
app without them.

## Data Attributes

| Attribute | On | Holds |
|---|---|---|
| `data-sf-intent` | the icon disc and badge | the glyph's intent, such as `danger` |
| `data-storyfeed-body` | each body's wrapper, in Blade | nothing; a hook for your CSS |
