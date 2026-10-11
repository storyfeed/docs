<a id="tokens-and-host-seams"></a>

# Customizing the Kits

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

An avatar draws the entity's `media.icon`, else its `media.initials` on a
`media.color` disc, else `data.initials` on `data.avatar_color`, else a colour
from a stable identity palette. Deleted models render in the muted colour.
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
import { Link } from '@inertiajs/react';
import { FeedProvider, FeedStream } from '@/components/storyfeed';
import type { FeedPagePayload } from '@/components/storyfeed';
import Message from '@/components/feed/Message';

export default function History({ feed }: { feed: FeedPagePayload }) {
    return (
        <FeedProvider
            FEED_LINK={Link}
            FEED_COMPONENTS={{ 'App/Message': Message }}
        >
            <FeedStream page={feed} />
        </FeedProvider>
    );
}
```

Vue imports injection keys from `keys.ts`. React takes the same names as
`FeedProvider` props. Nested React providers inherit surrounding options.

| Seam | Value | Behaviour |
|---|---|---|
| `FEED_LINK` | component accepting `href` | replaces anchors and forwards entity attributes |
| `FEED_COMPONENTS` | exact body-name → component map | renders Component bodies with their props; unknown names draw nothing |
| `FEED_BODIES` | exact body-type → component map | draws a body type, such as `Acme/Shipment`; one registered for a built-in type replaces the kit's |
| `FEED_FILE_LABELLER` | `({ name, mediaType }) => string \| null` | return a label, or `null` to use the built-in MIME labels |
| `FEED_MEDIA_OBJECT_PLACEMENT` | `'beside'` or `'below'` | `beside` shows a MediaObject’s picture beside its text; `below` stacks it. An explicit component prop wins |
| `FEED_NOW` | millisecond timestamp | pins the clock for deterministic rendering |
| `FEED_MEDIA` | media component | replaces pictures and tiles, for example with a lightbox; receives the image, href, link attributes and kit classes |

Vue’s MediaObject prop is `image-placement`; React’s is `imagePlacement`.

Built-in bodies render from the object’s bodies and data, and the activity’s
data. Supply your own components for previews in other roles. Markdown and
rich HTML are sanitized. Plain text and verbatim source are escaped.

## Rendering Custom Body Types

In Vue, install renderers with the `feedBodies()` plugin. Each install merges
into the renderers already installed:

```ts memo="resources/js/app.ts"
import { feedBodies } from '@/components/storyfeed/body';
import Shipment from '@/components/feed/Shipment.vue';

createApp(App).use(feedBodies({ 'Acme/Shipment': Shipment }));
```

The renderer receives `payload`, `entityLabel`, `entityUrl` and `entityMedia`
props. To register renderers for one part of the page, `provide()` a map with
the `FEED_BODIES` key.

In React, pass `FEED_BODIES` to `FeedProvider`. A renderer receives `BodyProps`;
nested providers merge their maps:

```tsx memo="resources/js/components/feed/Shipment.tsx"
import type { BodyProps } from '@/components/storyfeed';

export default function Shipment({ payload }: BodyProps) {
    return <p>{payload.carrier} · {payload.tracking}</p>;
}
```

```tsx memo="resources/js/pages/History.tsx" at="History()"
<FeedProvider FEED_BODIES={{ 'Acme/Shipment': Shipment }}>
    <FeedStream page={feed} />
</FeedProvider>
```

A body type with no renderer draws its `$fallback` line as muted text, or
nothing without one. Blade draws a body type from a
[published view](/ui/blade#publishing-views).

## Roles After the Time

Roles the headline does not name appear after the time, each after a word:

| Role | Word |
|---|---|
| `instrument` | via |
| `origin` | from |
| `result` | to |
| `location` | at |
| `generator` | from |

Context appears only when the headline names it. Vue and React keep the words
in `shared/messages.ts`. Blade reads them from the `storyfeed-ui::meta`
translation namespace; override them in
`lang/vendor/storyfeed-ui/{locale}/meta.php`.

<a id="child-rails-and-spacing"></a>

## Rails and Groups

```vue memo="resources/js/pages/History.vue" at="template"
<FeedStream :page="feed" rail="actor" child-rail="activity-only"
    style="--sf-gutter: 2.5rem" />
```

```tsx memo="resources/js/pages/History.tsx" at="History()"
<FeedStream page={feed} rail="actor" childRail="activity-only" />
```

```blade memo="resources/views/history.blade.php"
<x-storyfeed::feed :page="$page" rail="actor" child-rail="activity-only" />
```

<script setup>
import { scene, liveOf } from '../.vitepress/theme/world'
const groupedOrders = liveOf(scene.deeper.aggregation.orders)
</script>

The rail is the column of avatars and icons beside each row; `child-rail`
sets it for expanded group members. Day headings, `dividers` and group state
take attributes the same way.

<FeedExample :items="groupedOrders" rail="actor" child-rail="activity-only" :collapsed="false" />

[Pages, Rails and Styles](/ui/reference/pages-rails-and-styles) shows every
rail, divider style and group state. The component reference pages name each
option in each kit.

<span id="rail-spacing"></span>

The rail's width, its gap to the content and the disc and badge sizes are
[CSS variables](/ui/reference/pages-rails-and-styles#css-variables).

### Group Disclosure

Native `details` provides the disclosure and works without JavaScript.
By default, groups without a headline open; with `:interactive="false"`, every
group opens. Static collapsed members remain in the HTML for printing.

The disclosure says “Show less” when open and “Show all 3” for a collapsed
three-member group. A group shows its full member count even when the page
holds fewer members. Expanding displays the supplied children; it does not
fetch more: to page through every member, read them with
[`members()`](/retrieving/retrieving-feeds#paginating-a-group-s-members). A
collapsed group shows a strip of up to four member tiles, or three and a “+N”
tile: a member's picture when its row draws one, else its featured entity's
name. Expanding the group hides the strip.

## Feed Size and Code Blocks

```blade memo="resources/views/history.blade.php"
<x-storyfeed::feed :page="$page" class="[--sf-font-size:0.875rem]" />
```

`--sf-font-size` scales text, spacing, avatars, badges and the rail together.
Set it on the feed or on any element around it, in `rem` or `px`.

| CSS Property | Controls | Default |
|---|---|---|
| `--sf-font-size` | the feed's body text size; every other size follows it | `1rem` |
| `--sf-prose-max-h` | the height at which code and verbatim `Prose` scroll | `24rem` |
| `--sf-code-bg`, `--sf-code-fg` | the background and text of verbatim `Prose` | a dark surface with light text |

## Blade Host Seams

Blade supplies whole-feed callbacks through the `renderers` array to
customize time, bodies, annotations, media and file labels.

| Callback | Receives | Returns |
|---|---|---|
| `time`, `body`, `annotations` | `FeedItem` | app HTML |
| `removed` | `FeedItem` | removal text |
| `glyph`, `avatar` | token/entity and size | app SVG or avatar HTML |
| `fileLabel` | `{name, mediaType}` array | label or null for built-in MIME labels |
| `form` (a body) | body array, owning entity or null | app HTML, or null for built-in rendering |
| `mediaTiles`, `mediaOverflow` | group `FeedItem` | sample tiles or overflow count |
| `media` | tile array and utility classes | picture or tile HTML |

```blade memo="resources/views/history.blade.php"
<x-storyfeed::feed :page="$page" :renderers="[
    'fileLabel' => fn (array $file) => match ($file['mediaType']) {
        'application/vnd.apple.keynote' => 'Keynote',
        default => null,
    },
]" />
```

Callbacks are trusted application code; their returned HTML is not sanitized.
Standalone row components also accept
body, time and annotations slots. The standalone file component accepts
`labeller`; `<x-storyfeed::body>` accepts `file-labeller`.

[Blade Components](/ui/reference/blade-components), [Vue Components](/ui/reference/vue-components),
[React Components](/ui/reference/react-components) and
[Pages, Rails and Styles](/ui/reference/pages-rails-and-styles) list every component and
option.
