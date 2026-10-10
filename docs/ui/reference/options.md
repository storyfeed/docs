# Pages, Rails and Styles

The values all three kits share: the page shapes they read, the rails, the
group states and the CSS variables. The attribute and prop names are on
[Blade Components](/ui/reference/blade), [Vue Components](/ui/reference/vue)
and [React Components](/ui/reference/react).

## Page Shapes

`page` takes whatever a read returns. Blade takes the PHP value; Vue and
React take its JSON.

| Read | Blade receives | Vue and React receive | Next cursor |
|---|---|---|---|
| `get()` | a collection of `FeedItem`s | a list of nodes | none |
| `cursorPaginate()` | a `FeedPaginator` | `{ data, next_cursor, … }` | `next_cursor` |
| `simplePaginate()` | a `FeedSimplePaginator` | `{ data, … }` | none |
| `members()` | a `FeedPaginator` | `{ data, next_cursor, … }` | `next_cursor` |
| core 0.18 and earlier | a `FeedPage` | `{ items, next_cursor, sync_token, payload_version }` | `next_cursor` |

```json
{
    "data": [{ "id": "01K…", "type": "activity", "headline": "…" }],
    "next_cursor": "eyJpZCI6…",
    "sync_token": null,
    "payload_version": 1
}
```

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

Rows default to `actor-only` and expanded group members to `activity-only`.
Members follow `child-rail` when it is set, else their group's rail, and draw
no badge. A row without the disc's subject draws the other one, then a blank
disc. A row with several actors draws two faces in the disc and never a face
badge.

Vue and React also take a rail as `{ primary, secondary }`, each slot one of
`actor`, `activity` or `none`, the two never the same.

## Dividers

| Divider style | Draws |
|---|---|
| `branch` | the default: a curve off the rail into the label, darkening from the rail's colour (`border`) to the label's (`muted-foreground`); the rail line stops a small gap above it |
| `dot` | a dot on the rail, the label beside it |

The style applies to day headings and to the labels in `dividers`. `dividers`
is keyed by item id: `{ "01K…": "Timeline" }`.

## Group State

| `interactive` | `collapsed` | Groups |
|---|---|---|
| `true` | `null` | open when the group has no headline of its own; otherwise closed |
| `true` | `true` | closed |
| `true` | `false` | open |
| `false` | `null` | open, with no disclosure control |
| `false` | `true` | closed, with no disclosure control; members stay in the HTML for printing |

A group whose node has `expanded: true` opens in every case. Expanding shows
the members the node carries; it fetches nothing.

## CSS Variables

Set them on the feed or on any element around it.

```blade
<x-storyfeed::feed :page="$page" class="[--sf-font-size:0.875rem]" />
```

| CSS Variable | Controls | Default |
|---|---|---|
| `--sf-font-size` | the feed's body text; every size below follows it | `1rem` |
| `--sf-gutter` | the rail's width | 2 × the font size |
| `--sf-gap` | the space between the rail and the row | 0.75 × the font size |
| `--sf-disc` | the disc's size | 2 × the font size |
| `--sf-badge` | an icon badge's size | 0.875 × the font size |
| `--sf-badge-face` | an avatar badge's size | 1.125 × the font size |
| `--sf-prose-max-h` | the height at which code and verbatim `Prose` scroll | 24 × the font size |
| `--sf-code-bg` | verbatim `Prose`'s background | `#18181b` |
| `--sf-code-fg` | verbatim `Prose`'s text | `#f4f4f5` |

Inside the feed, Tailwind's `--spacing`, `--text-xs`, `--text-sm` and
`--text-base` follow `--sf-font-size`, so your own slot content on those
utilities scales with the feed.

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
