# Vue

The Vue kit renders Storyfeed's serialized items with Vue 3 components.
Copy it into your app and pass a feed page to `FeedStream`.

```bash
php artisan storyfeed:ui vue
npm install lucide-vue-next micromark micromark-extension-gfm-autolink-literal micromark-extension-gfm-strikethrough micromark-extension-gfm-table micromark-extension-gfm-task-list-item sanitize-html
npm install -D @tailwindcss/typography
```

```vue memo="resources/js/pages/History.vue"
<script setup lang="ts">
import FeedStream from '@/components/storyfeed/FeedStream.vue';
import type { FeedPagePayload } from '@/components/storyfeed/types';

defineProps<{ feed: FeedPagePayload }>();
</script>

<template>
    <FeedStream :page="feed" />
</template>
```

<script setup>
import { scene, liveOf } from '../.vitepress/theme/world'
</script>

<FeedExample :items="liveOf(scene.deeper.aggregation.orders)" />

`page` takes the JSON of a page from `cursorPaginate()` or `simplePaginate()`,
which holds the items in `data`, or the plain array `get()` returns. The copied
kit includes its `shared/` imports. Configure [Tailwind scanning](/ui/installation#scanning-tailwind-utilities)
and the [Typography plugin](/ui/installation#registering-the-typography-plugin) in the host app.

## Loading Older Activity

```vue memo="resources/js/pages/History.vue" at="template"
<FeedStream :items="items" :next-cursor="nextCursor"
    :loading-more="loading" @load-more="loadOlder" />
```

The app fetches the next page from `next_cursor` and appends its `data` to
`items`. `loading-more` disables
the pager while loading. Keep the cursor opaque and follow the
[feed's sync token](/basics/reading#handling-a-changed-feed).

## Replacing Row Content

| Slot | Receives | Replaces |
|---|---|---|
| `#body` | `{ node }` | body content |
| `#annotations` | `{ node }` | app annotations |
| `#time` | `{ node, label }` | timestamp content |

These slots reach activities, groups and expanded children.
Built-in bodies render from the object’s bodies and data, and the activity’s data.
[Host seams](/ui/customizing#host-seams) supply links, app components and media.

<a id="rails-and-groups"></a>

Rails, day headings, dividers and group disclosure are set in [Customizing the Kits](/ui/customizing#rails-and-groups).

See the [Vue kit README](https://github.com/storyfeed/ui/blob/main/resources/js/vue/README.md)
for the component contracts.
