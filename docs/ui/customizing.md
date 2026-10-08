# Tokens and Host Seams

The kits take their colours from your CSS variables and use your own
components for links, bodies and pictures.

## Colour Tokens

```css memo="resources/css/app.css"
@theme inline {
    --color-background: var(--background);
    --color-foreground: var(--foreground);
    --color-card: var(--card);
    --color-muted: var(--muted);
    --color-muted-foreground: var(--muted-foreground);
    --color-primary: var(--primary);
    --color-primary-foreground: var(--primary-foreground);
    --color-border: var(--border);
    --color-ring: var(--ring);
}
```

Laravel's Vue and React starter kits define these variables and their dark
values. For another app, define them for `:root` and `.dark` in your palette.
Use Tailwind v4's `@custom-variant dark (&:where(.dark, .dark *));` when your
layout selects dark mode with a class.

| Token | Use |
|---|---|
| `background`, `foreground` | surface and text |
| `card` | card surface |
| `muted`, `muted-foreground` | secondary surface and text |
| `primary`, `primary-foreground` | primary colour and text on it |
| `border`, `ring` | boundaries and focus rings |

 Avatar snapshot colours
use `data.avatar_color`, then a stable identity palette. Deleted models render in the muted colour.
An icon’s intent is rendered as `data-sf-intent`; style it in your CSS,
for example `[data-sf-intent="danger"]`.

## Host Seams

```vue memo="resources/js/pages/History.vue"
<script setup lang="ts">
import { provide } from 'vue';
import { Link } from '@inertiajs/vue3';
import { FEED_LINK } from '@/components/storyfeed/keys';

provide(FEED_LINK, Link);
</script>
```

```tsx memo="resources/js/pages/History.tsx"

<FeedProvider FEED_LINK={Link} FEED_COMPONENTS={{ 'App/Message': Message }}>
    <FeedStream items={feed.items} />
</FeedProvider>
```

Vue imports injection keys from `keys.ts`. React takes the same names as
`FeedProvider` props. Nested React providers inherit surrounding options.

| Seam | Value | Behaviour |
|---|---|---|
| `FEED_LINK` | component accepting `href` | replaces anchors and forwards entity attributes |
| `FEED_COMPONENTS` | exact body-name → component map | renders Component bodies with their props; unknown names draw nothing |
| `FEED_FILE_LABELLER` | `({ name, mediaType }) => string \| null` | return a label, or `null` to use the built-in MIME labels |
| `FEED_MEDIA_OBJECT_PLACEMENT` | `'beside'` or `'below'` | `beside` shows a MediaObject’s picture beside its text; `below` stacks it. An explicit component prop wins |
| `FEED_NOW` | millisecond timestamp | pins the clock for deterministic rendering |
| `FEED_MEDIA` | media component | replaces pictures and tiles, for example with a lightbox |

Vue’s MediaObject prop is `image-placement`; React’s is `imagePlacement`.

Built-in bodies render from the object’s bodies and data, and the activity’s
data. Supply your own components for previews in other roles. Markdown and
rich HTML are sanitized. Plain text and verbatim source are escaped.
The kits also render supported older body versions.

Instrument, origin and result roles the headline does not name appear after
the time. Context appears when the headline names it.
The words before each role (“with”, “from”) are in `shared/messages.ts`.

## Child Rails and Spacing

```vue
<FeedStream :items="feed.items" rail="actor" child-rail="activity-only"
    style="--sf-gutter: 2.5rem" />
```

React uses `childRail`; Blade uses `child-rail`.
`actor` shows the avatar with a small icon; `activity` shows the icon with a
small avatar.
`actor-only` and `activity-only` omit the badge. Children can choose an
independent rail; members omit badges.

| CSS Property | Controls |
|---|---|
| `--sf-gutter` | rail width |
| `--sf-gap` | rail-to-content gap |
| `--sf-disc` | primary avatar or icon size |
| `--sf-badge`, `--sf-badge-face` | badge sizes |

Pass an `objectIcon` callback to `FeedStream` to show a linked object picture:

```vue memo="resources/js/pages/History.vue"
<script setup lang="ts">
import FeedStream from '@/components/storyfeed/FeedStream.vue';
import type { FeedNode } from '@/components/storyfeed/types';

const objectIcon = (node: FeedNode) => node.object?.media?.icon ?? null;
</script>

<template>
    <FeedStream :items="feed.items" :object-icon="objectIcon" />
</template>
```

The picture uses the object’s URL and safe scalar attributes. Deleted models
and objects without URLs remain unlinked. `FEED_MEDIA` receives the image,
href, link attributes and kit classes.

## Blade Host Seams

Blade supplies whole-feed callbacks through the `renderers` array to
customize time, bodies, annotations, media, file labels and object icons.

| Callback | Receives | Returns |
|---|---|---|
| `time`, `body`, `annotations` | `FeedItem` | app HTML |
| `removed`, `objectIcon` | `FeedItem` | removal text or image array |
| `glyph`, `avatar` | token/entity and size | app SVG or avatar HTML |
| `fileLabel` | `{name, mediaType}` array | label or null for built-in MIME labels |
| `form` (a body) | body array, owning entity or null | app HTML, or null for built-in rendering |
| `mediaTiles`, `mediaOverflow` | group `FeedItem` | sample tiles or overflow count |
| `media` | tile array and utility classes | picture or tile HTML |

Callbacks are trusted application code; their returned HTML is not sanitized.
 Standalone row components also accept
body, time and annotations slots. The standalone file component accepts
`labeller`; `<x-storyfeed::body>` accepts `file-labeller`.

The [package README](https://github.com/storyfeed/ui/blob/main/README.md),
[Vue README](https://github.com/storyfeed/ui/blob/main/resources/js/vue/README.md)
and [React README](https://github.com/storyfeed/ui/blob/main/resources/js/react/README.md)
contain the full rendering contracts.
