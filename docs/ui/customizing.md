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
        <FeedProvider FEED_LINK={Link} FEED_COMPONENTS={{ 'App/Message': Message }}>
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
const divider = { [groupedOrders[0].id]: 'Orders' }
</script>

`rail="actor"` puts the actor’s avatar on the rail with a small verb icon;
`rail="activity"` puts the icon first. The `-only` variants drop the badge.
The default is `actor-only`, with `activity-only` for group members.
Members inherit the group’s rail unless `child-rail` says otherwise, and omit
badges. Groups with several actors show sampled avatars. Vue and React also
accept a structured `Rail`.

<FeedExample :items="[scene.order]" rail="actor">Avatar with a verb icon</FeedExample>
<FeedExample :items="[scene.order]" rail="activity">Verb icon with an avatar</FeedExample>
<FeedExample :items="[scene.order]" rail="actor-only">Avatar only</FeedExample>
<FeedExample :items="[scene.order]" rail="activity-only">Verb icon only</FeedExample>
<FeedExample :items="groupedOrders" rail="actor" child-rail="activity-only" :collapsed="false">Expanded members with their own rail</FeedExample>

| Option | Behaviour |
|---|---|
| `rail`, `child-rail` | the rail for rows, and for expanded group members |
| `:grouped="false"` | hides day headings |
| `dividers` | maps item IDs to labels drawn before those items |
| `divider-style="dot"` or `"branch"` | how the divider meets the rail: a dot on it or a branch off it |
| `:interactive="false"` | renders groups without a disclosure control |
| `collapsed` | chooses the initial group state; `null` opens groups without a headline |
| `timezone` | Blade only: the display zone for days and timestamps |

React spells the options in camelCase: `childRail`, `grouped={false}`,
`dividerStyle`, `interactive={false}`.

<FeedExample :items="groupedOrders" days>Day headings</FeedExample>
<FeedExample :items="groupedOrders" :grouped="false">Without day headings</FeedExample>
<FeedExample :items="groupedOrders" :dividers="divider" divider-style="dot">Divider on the rail</FeedExample>
<FeedExample :items="groupedOrders" :dividers="divider" divider-style="branch">Divider branching off the rail</FeedExample>
<FeedExample :items="groupedOrders" collapsed>Collapsed disclosure</FeedExample>
<FeedExample :items="groupedOrders" :interactive="false">Static expanded group</FeedExample>
<FeedExample :items="groupedOrders" :interactive="false" collapsed>Static collapsed group</FeedExample>

### Group Disclosure

Native `details` provides the disclosure and works without JavaScript.
By default, groups without a headline open; with `:interactive="false"`, every
group opens. Static collapsed members remain in the HTML for printing.

The disclosure says “Show less” when open and “Show all 3” for a collapsed
three-member group. A group shows its full member count even when the page
holds fewer members. Expanding displays the supplied children; it does not
fetch more. A collapsed group shows up to three member pictures; an expanded
group hides that strip.

### Rail Spacing

| CSS Property | Controls |
|---|---|
| `--sf-gutter` | rail width |
| `--sf-gap` | rail-to-content gap |
| `--sf-disc` | primary avatar or icon size |
| `--sf-badge`, `--sf-badge-face` | badge sizes |

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
    'fileLabel' => fn (array $file) => $file['mediaType'] === 'application/vnd.apple.keynote' ? 'Keynote' : null,
]" />
```

Callbacks are trusted application code; their returned HTML is not sanitized.
Standalone row components also accept
body, time and annotations slots. The standalone file component accepts
`labeller`; `<x-storyfeed::body>` accepts `file-labeller`.

[Blade Components](/ui/reference/blade), [Vue Components](/ui/reference/vue),
[React Components](/ui/reference/react) and
[Pages, Rails and Styles](/ui/reference/options) list every component and
option.
