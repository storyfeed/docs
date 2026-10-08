# React

The React kit draws Storyfeed's serialized items with React 19 components.
Copy it into your app and wrap the feed in `FeedProvider`.

```bash
php artisan storyfeed:ui react
npm install react@^19 react-dom@^19 lucide-react markdown-it sanitize-html
npm install -D @types/react @types/react-dom @types/markdown-it @types/sanitize-html
```

```tsx memo="resources/js/pages/History.tsx"
import { Link } from '@inertiajs/react';
import { FeedProvider, FeedStream } from '@/components/storyfeed';
import type { FeedPayload } from '@/components/storyfeed';

export default function History({ feed }: { feed: FeedPayload }) {
    return (
        <FeedProvider FEED_LINK={Link}>
            <FeedStream items={feed.items} />
        </FeedProvider>
    );
}
```

<script setup>
import { scene, liveOf } from '../.vitepress/theme/world'
</script>

<FeedExample :items="liveOf(scene.deeper.aggregation.orders)" />

The kit supports Inertia 2/3's React adapter and Laravel's React starter kit.
The copied `shared/` directory makes the imports self-contained. Configure
[Tailwind scanning and tokens](/ui/installation#scanning-tailwind-utilities).

## Loading Older Activity

```tsx
<FeedStream items={feed.items} nextCursor={feed.next_cursor}
    loadingMore={loading} onLoadMore={loadOlder} />
```

The app fetches and appends older items. `loadingMore` disables the pager.
Follow the [feed's sync token](/basics/reading#handling-a-changed-feed).
`empty` accepts a React node for an empty page.

## Replacing Row Content

| Render Prop | Receives | Replaces |
|---|---|---|
| `body` | `{ node }` | body content |
| `annotations` | `{ node }` | app annotations |
| `time` | `{ node, label }` | timestamp content; null omits time |

These functions reach activities, groups and expanded children. Returning null
from `time` retains unused role metadata. `FeedProvider` inherits surrounding
options; explicit values win. See [Host Seams](/ui/customizing#host-seams).

## Rails and Groups

```tsx
<FeedStream items={feed.items} rail="actor" childRail="activity-only" />
```

`rail` accepts `actor`, `activity`, `actor-only`, `activity-only` or a structured
`Rail`. `childRail` independently controls expanded members. Dense children
suppress badges. `grouped={false}` hides day headings. `dividers` maps item IDs
to labels; `dividerStyle` accepts `dot` or `branch`.

Groups use native `details` and keyboard disclosure. Unnamed groups start open.
`interactive={false}` draws static groups; `collapsed` chooses their initial
state. Static collapsed members remain available to print. Groups display true
member totals and truncation. Photograph strips sample Image bodies across
roles, objects first, with at most three distinct sources; open groups hide them.

## Server Rendering

SSR and the first hydration render use ISO timestamps and UTC day keys.
After mounting, labels use the browser's locale and calendar timezone.
`FEED_NOW` pins the clock in milliseconds; otherwise relative labels refresh
according to age. No timer runs during `renderToString`; mounted timers are
cleaned up on unmount or clock changes.

See the [React kit README](https://github.com/storyfeed/ui/blob/main/resources/js/react/README.md)
for the provider and component contracts.
