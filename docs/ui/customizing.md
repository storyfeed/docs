# Tokens and Host Seams

The kits use your app's colours and accept app-owned links, bodies and media.
Set tokens in CSS and supply host components through Vue injection or React's
`FeedProvider`.

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

No package stylesheet or Typography plugin is needed. Avatar snapshot colours
use `data.avatar_color`, then a stable identity palette. Tombstones stay muted.
Glyph intents are app-owned `data-sf-intent` values; edit `FeedIcon.vue`,
`FeedIcon.tsx` or the published Blade glyph view to assign colours.

## Host Seams

```vue memo="resources/js/pages/History.vue"
<script setup lang="ts">
import { provide } from 'vue';
import { Link } from '@inertiajs/vue3';
import { FEED_LINK } from '@/components/storyfeed/keys';

provide(FEED_LINK, Link);
</script>
```

```tsx
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
| `FEED_FILE_LABELLER` | `({ name, mediaType }) => string \| null` | a host label wins; null uses the MIME map, then the MIME string |
| `FEED_MEDIA_OBJECT_PLACEMENT` | `'beside'` or `'below'` | puts a MediaObject picture beside prose at 64px or below it; an explicit component prop wins |
| `FEED_NOW` | millisecond timestamp | pins the clock for deterministic rendering |
| `FEED_MEDIA` | media component | replaces pictures and tiles, for example with a lightbox |

File names always remain visible. Sizes use decimal units. The kits do not
guess file kinds from extensions. Vue's MediaObject prop is `image-placement`;
React's is `imagePlacement`.

Generic body rendering reads activity data and the object's body/data.
Other roles' previews are app-owned. Markdown and rich HTML are sanitized;
plain and verbatim source are escaped. Historical body versions still render.

Metadata follows the headline: time, then unused instrument, origin, result,
location and generator. Context appears when the headline names it.
Vue and React lead-in words live in `shared/messages.ts`.

## Child Rails and Spacing

```vue
<FeedStream :items="feed.items" rail="actor" child-rail="activity-only"
    style="--sf-gutter: 2.5rem" />
```

React uses `childRail`; Blade uses `child-rail`.
`actor` shows a face with a glyph badge, `activity` a glyph with a face badge.
`actor-only` and `activity-only` omit the badge. Children can choose an
independent rail; dense children suppress badges.

| CSS Property | Controls |
|---|---|
| `--sf-gutter` | rail width |
| `--sf-gap` | rail-to-content gap |
| `--sf-disc` | primary avatar or icon size |
| `--sf-badge`, `--sf-badge-face` | badge sizes |

Pass `objectIcon(node)` to opt into a linked object icon frame. It uses the
object's URL and safe scalar attributes; tombstones and missing URLs remain
unlinked. `FEED_MEDIA` receives the image, href, link attributes and kit classes.

## Blade Host Seams

Blade supplies whole-feed callbacks through the `renderers` array.

| Callback | Receives | Returns |
|---|---|---|
| `time`, `body`, `annotations` | `FeedItem` | app HTML |
| `removed`, `objectIcon` | `FeedItem` | removal text or image array |
| `glyph`, `avatar` | token/entity and size | app SVG or avatar HTML |
| `fileLabel` | `{name, mediaType}` array | label or null for built-in MIME labels |
| `form` | body array, owning entity or null | app HTML, or null for built-in rendering |
| `mediaTiles`, `mediaOverflow` | group `FeedItem` | sample tiles or overflow count |
| `media` | tile array and utility classes | picture or tile HTML |

Callbacks are trusted application code; their returned HTML is not sanitized.
Stored payloads do not supply callbacks. Standalone row components also accept
body, time and annotations slots. The standalone file component accepts
`labeller`; `<x-storyfeed::body>` accepts `file-labeller`.

The [package README](https://github.com/storyfeed/ui/blob/main/README.md),
[Vue README](https://github.com/storyfeed/ui/blob/main/resources/js/vue/README.md)
and [React README](https://github.com/storyfeed/ui/blob/main/resources/js/react/README.md)
contain the full rendering contracts.
