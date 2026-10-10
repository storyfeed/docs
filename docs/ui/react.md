# React

The React kit renders Storyfeed's serialized items with React 19 components.
Copy it into your app, wrap the feed in `FeedProvider`, and pass a feed page to
`FeedStream`.

```bash
php artisan storyfeed:ui react
npm install react@^19 react-dom@^19 lucide-react markdown-it sanitize-html
npm install -D @types/markdown-it @types/sanitize-html
```

Laravel's [React starter kit](https://github.com/laravel/react-starter-kit/blob/main/package.json)
already includes React and its types. In another app, also install
`@types/react` and `@types/react-dom` as development dependencies.

```tsx memo="resources/js/pages/History.tsx"
import { Link } from '@inertiajs/react';
import { FeedProvider, FeedStream } from '@/components/storyfeed';
import type { FeedPagePayload } from '@/components/storyfeed';

export default function History({ feed }: { feed: FeedPagePayload }) {
    return (
        <FeedProvider FEED_LINK={Link}>
            <FeedStream page={feed} />
        </FeedProvider>
    );
}
```

<script setup>
import { scene, liveOf } from '../.vitepress/theme/world'
</script>

<FeedExample :items="liveOf(scene.deeper.aggregation.orders)" />

`page` takes the JSON of a page from `cursorPaginate()` or `simplePaginate()`,
which holds the items in `data`, or the plain array `get()` returns.
It works with Inertia’s React adapter and Laravel’s React starter kit.
The copied `shared/` directory makes the imports self-contained. Configure
[Tailwind scanning and tokens](/ui/installation#scanning-tailwind-utilities).

## Loading Older Activity

```tsx
<FeedStream items={items} nextCursor={nextCursor}
    loadingMore={loading} onLoadMore={loadOlder} />
```

The app fetches the next page from `next_cursor` and appends its `data` to
`items`. `loadingMore` disables the pager.
Follow the [feed's sync token](/basics/reading#handling-a-changed-feed).
`empty` accepts a React node for an empty page.

## Replacing Row Content

| Render Prop | Receives | Replaces |
|---|---|---|
| `body` | `{ node }` | body content |
| `annotations` | `{ node }` | app annotations |
| `time` | `{ node, label }` | timestamp content; null omits time |

These functions reach activities, groups and expanded children. Return `null`
from `time` to omit the timestamp; the other metadata still renders. Nested
providers inherit the outer options; explicit values win. See [Host Seams](/ui/customizing#host-seams).

## Rails and Groups

```tsx
<FeedStream page={feed} rail="actor" childRail="activity-only" />
```

`rail` accepts `actor`, `activity`, `actor-only`, `activity-only` or a structured
`Rail`. `childRail` controls expanded members. See the [rail and group examples](/ui/vue#rails-and-groups)
for each appearance, day headings, dividers and disclosure states.

`grouped={false}` hides day headings. `dividers` maps item IDs to labels;
`dividerStyle` accepts `dot` or `branch`. Native `details` provides group
disclosure; groups without headlines start open. `interactive={false}` renders
static groups, and `collapsed` sets their initial state. Static collapsed
members remain available to print. A group shows its full member count even
when the page holds fewer members.

## Server Rendering

SSR and the first hydration render use ISO timestamps and UTC day keys.
After mounting, labels use the browser's locale and calendar timezone.
`FEED_NOW` pins the clock in milliseconds; otherwise relative labels refresh
according to age.

See the [React kit README](https://github.com/storyfeed/ui/blob/main/resources/js/react/README.md)
for the provider and component contracts.
