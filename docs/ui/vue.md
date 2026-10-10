# Vue

The Vue kit renders Storyfeed's serialized items with Vue 3 components.
Copy it into your app and pass a feed page to `FeedStream`.

```bash
php artisan storyfeed:ui vue
npm install lucide-vue-next markdown-it sanitize-html
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
const groupedOrders = liveOf(scene.deeper.aggregation.orders)
const divider = { [groupedOrders[0].id]: 'Orders' }
</script>

<FeedExample :items="liveOf(scene.deeper.aggregation.orders)" />

`page` takes the JSON of a page from `cursorPaginate()` or `simplePaginate()`,
which holds the items in `data`, or the plain array `get()` returns. The copied
kit includes its `shared/` imports. Configure [Tailwind scanning
and tokens](/ui/installation#scanning-tailwind-utilities) in the host app.

## Loading Older Activity

```vue
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
| `#time` | `{ node }` | timestamp content |

These slots reach activities, groups and expanded children.
Built-in bodies render from the object’s bodies and data, and the activity’s data.
[Host seams](/ui/customizing#host-seams) supply links, app components and media.

## Rails and Groups

```vue
<FeedStream :page="feed" rail="actor" child-rail="activity-only" />
```

`rail="actor"` puts the actor’s avatar on the rail with a small verb icon;
`rail="activity"` puts the icon first. The `-only` variants drop the badge.
Group members inherit the group’s rail unless `child-rail` says otherwise;
members omit badges. Groups with several actors show sampled avatars.

<FeedExample :items="[scene.order]" rail="actor">Avatar with a verb icon</FeedExample>
<FeedExample :items="[scene.order]" rail="activity">Verb icon with an avatar</FeedExample>
<FeedExample :items="[scene.order]" rail="actor-only">Avatar only</FeedExample>
<FeedExample :items="[scene.order]" rail="activity-only">Verb icon only</FeedExample>
<FeedExample :items="groupedOrders" rail="actor" child-rail="activity-only" :collapsed="false">Expanded members with their own rail</FeedExample>

| Option | Behaviour |
|---|---|
| `:grouped="false"` | hides day headings |
| `dividers` | maps item IDs to labels before those items |
| `divider-style="dot"` or `"branch"` | how the divider meets the rail: a dot on it or a branch off it |
| `:interactive="false"` | renders groups without a disclosure control |
| `collapsed` | chooses initial group state; null opens static groups |

<FeedExample :items="groupedOrders" days>Day headings</FeedExample>
<FeedExample :items="groupedOrders" :grouped="false">Without day headings</FeedExample>
<FeedExample :items="groupedOrders" :dividers="divider" divider-style="dot">Divider on the rail</FeedExample>
<FeedExample :items="groupedOrders" :dividers="divider" divider-style="branch">Divider branching off the rail</FeedExample>
<FeedExample :items="groupedOrders" collapsed>Collapsed disclosure</FeedExample>
<FeedExample :items="groupedOrders" :interactive="false">Static expanded group</FeedExample>
<FeedExample :items="groupedOrders" :interactive="false" collapsed>Static collapsed group</FeedExample>

Static collapsed members remain in the HTML for printing. A collapsed group
shows up to three member pictures; an expanded group hides that strip.

See the [Vue kit README](https://github.com/storyfeed/ui/blob/main/resources/js/vue/README.md)
for the component contracts.
