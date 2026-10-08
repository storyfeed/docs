# Vue

The Vue kit draws Storyfeed's serialized items with Vue 3 components.
Copy it into your app and pass the feed's `items` to `FeedStream`.

```bash
php artisan storyfeed:ui vue
npm install lucide-vue-next markdown-it sanitize-html
```

```vue memo="resources/js/pages/History.vue"
<script setup lang="ts">
import FeedStream from '@/components/storyfeed/FeedStream.vue';
import type { FeedNode } from '@/components/storyfeed/types';

defineProps<{ items: FeedNode[] }>();
</script>

<template>
    <FeedStream :items="items" />
</template>
```

<script setup>
import { scene, liveOf } from '../.vitepress/theme/world'
</script>

<FeedExample :items="liveOf(scene.deeper.aggregation.orders)" />

The copied kit includes its `shared/` imports. Configure [Tailwind scanning
and tokens](/ui/installation#scanning-tailwind-utilities) in the host app.

## Loading Older Activity

```vue
<FeedStream :items="feed.items" :next-cursor="feed.next_cursor"
    :loading-more="loading" @load-more="loadOlder" />
```

The app fetches the next page and appends its items. `loading-more` disables
the pager while loading. Keep the cursor opaque and follow the
[feed's sync token](/basics/reading#handling-a-changed-feed).

## Replacing Row Content

| Slot | Receives | Replaces |
|---|---|---|
| `#body` | `{ node }` | body content |
| `#annotations` | `{ node }` | app annotations |
| `#time` | `{ node }` | timestamp content |

These slots reach activities, groups and expanded children.
Generic bodies come from activity data and the object's body/data.
[Host seams](/ui/customizing#host-seams) supply links, app components and media.

## Rails and Groups

```vue
<FeedStream :items="feed.items" rail="actor" child-rail="activity-only" />
```

`rail` accepts `actor`, `activity`, `actor-only`, `activity-only` or a structured
`Rail`. Dense children suppress badges. Without `child-rail`, children inherit
the parent posture. Sampled faces represent the group's actors.

| Option | Behaviour |
|---|---|
| `:grouped="false"` | hides day headings |
| `dividers` | maps item IDs to labels before those items |
| `divider-style="dot"` or `"branch"` | chooses the divider joint |
| `:interactive="false"` | draws static groups |
| `collapsed` | chooses initial group state; null opens static groups |

Static collapsed members remain in the HTML for printing.
Groups use explicit singular payload slots and their own headline; a distinct
count of one alone does not select a singular role. Photograph strips sample
Image bodies across roles, objects first, deduplicate sources and cap at three.
Expanded groups hide the strip.

See the [Vue kit README](https://github.com/storyfeed/ui/blob/main/resources/js/vue/README.md)
for the component contracts.
