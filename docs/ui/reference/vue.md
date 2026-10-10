---
kit: vue
---

# Vue Components

Every component the Vue kit copies into your app, with its props, slots and
events, and the injection keys it reads. Paths are relative to the kit's
directory, `resources/js/components/storyfeed` by default.

```vue
<FeedStream :page="feed" rail="actor" @load-more="loadOlder" />
```

Attributes not listed below, such as `class` and `style`, land on the
component's root element.

## The Feed

### `FeedStream`

`FeedStream.vue`: a page of the feed, with day headings, each node, and a
"Load older activity" button while there is a next cursor.

| Prop | Default | Accepts |
|---|---|---|
| `page` | | any [page shape](/ui/reference/options#page-shapes) as JSON |
| `items` | | the nodes to draw, in place of `page` |
| `next-cursor` | | the next page's cursor when you pass `items`; `null` at the end of the feed |
| `loading-more` | `false` | `true` disables the button and shows "Loading…" |
| `grouped` | `true` | `false` hides the day headings |
| `rail` | `null` | a [rail](/ui/reference/options#rails) name or `{ primary, secondary }`; `null` draws `actor-only` |
| `child-rail` | | the rail for expanded group members; unset inherits the group's |
| `interactive` | `true` | `false` draws groups without a disclosure control |
| `collapsed` | `null` | the initial group state; see [Group State](/ui/reference/options#group-state) |
| `dividers` | `{}` | labels keyed by item id, drawn on the rail before those items |
| `divider-style` | `'dot'` | how a divider meets the rail: `dot` or `branch` |

| Slot | Receives | Replaces |
|---|---|---|
| `empty` | | the "No activity yet." text |
| `body` | `{ node }` | nothing; added under each row's meta line, before its bodies |
| `annotations` | `{ node }` | nothing; added at the end of each row |
| `time` | `{ node, label }` | each row's timestamp |

| Event | Payload | Fires |
|---|---|---|
| `load-more` | none | when the reader asks for older activity |

The `body`, `annotations` and `time` slots reach activities, groups and
expanded group members.

```vue
<FeedStream :items="items" :next-cursor="nextCursor"
    :loading-more="loading" @load-more="loadOlder">
    <template #time="{ node, label }">
        <a :href="`/activity/${node.id}`">{{ label }}</a>
    </template>
</FeedStream>
```

### `FeedNode`

`FeedNode.vue`: one node. It draws `FeedItem` or `FeedGroup`, whichever the
node is.

| Prop | Default | Accepts |
|---|---|---|
| `item` | | an activity or group node |
| `is-last` | `false` | `true` ends the rail at this row |
| `rail` | `null` | a [rail](/ui/reference/options#rails) |
| `child-rail` | | the rail for a group's expanded members |
| `interactive` | `true` | `false` draws a group without a disclosure control |
| `collapsed` | `null` | a group's initial state |

| Slot | Receives | Replaces |
|---|---|---|
| `body` | `{ node }` | nothing; added before the bodies |
| `annotations` | `{ node }` | nothing; added at the end of the row |
| `time` | `{ node, label }` | the timestamp |

## Rows

### `FeedItem`

`FeedItem.vue`: an activity row.

| Prop | Default | Accepts |
|---|---|---|
| `item` | | an activity node |
| `dense` | `false` | `true` draws the compact row used for group members |
| `is-last` | `false` | `true` ends the rail at this row |
| `rail` | `null` | a [rail](/ui/reference/options#rails) |

| Slot | Receives | Replaces |
|---|---|---|
| `body` | `{ node }` | nothing; added before the bodies |
| `annotations` | `{ node }` | nothing; added at the end of the row |
| `time` | `{ node, label }` | the timestamp |

### `FeedGroup`

`FeedGroup.vue`: a group row, with its strip of member pictures and its
members behind a disclosure.

| Prop | Default | Accepts |
|---|---|---|
| `item` | | a group node |
| `is-last` | `false` | `true` ends the rail at this row |
| `rail` | `null` | a [rail](/ui/reference/options#rails) |
| `child-rail` | | the rail for expanded members |
| `interactive` | `true` | `false` draws no disclosure control |
| `collapsed` | `null` | the initial state |

| Slot | Receives | Replaces |
|---|---|---|
| `body` | `{ node }` | nothing; added under the meta line, for the group and each member |
| `annotations` | `{ node }` | nothing; added at the end of the group and each member |
| `time` | `{ node, label }` | the group's and each member's timestamp |

### `FeedHeadline`

`FeedHeadline.vue`: a headline, each entity in it linked.

| Prop | Default | Accepts |
|---|---|---|
| `template` | | the node's `headline_template`, or `null` |
| `headline` | | the node's `headline`, drawn when there is no template |
| `entities` | | the node's singular role slots |
| `sample` | | a group's `sample` |
| `distinct` | | a group's `distinct` counts |
| `count` | | a group's member count |
| `verb` | | the node's verb, drawn when there is neither |
| `aggregate` | | `true` for a group |

### `FeedMeta`

`FeedMeta.vue`: the line under a headline: the time, a time range and the
roles the headline does not name.

| Prop | Default | Accepts |
|---|---|---|
| `node` | | an activity or group node |
| `templates` | | the headline templates the row draws, to tell which roles they name |

| Slot | Receives | Replaces |
|---|---|---|
| `default` | | the timestamp |

## The Rail

### `FeedIcon`

`FeedIcon.vue`: the activity's icon, in a disc or as a badge. Edit its icon
map to draw your glyph tokens.

| Prop | Default | Accepts |
|---|---|---|
| `icon` | | the node's glyph token |
| `intent` | `null` | the node's `glyph_intent`, written to `data-sf-intent` |
| `variant` | `'disc'` | `disc` or `badge` |

### `EntityAvatar`

`EntityAvatar.vue`: an entity's face: its `media.icon`, else its initials on
its colour.

| Prop | Default | Accepts |
|---|---|---|
| `entity` | | an entity, or `null` for a blank disc |
| `size` | `'md'` | `md`, `sm`, `badge`, `tile` or `pair` |

### `EntityLink`

`EntityLink.vue`: an entity's label, linked through `FEED_LINK` when it has
a link.

| Prop | Default | Accepts |
|---|---|---|
| `entity` | | an entity, or `null` |
| `fallback` | | the text drawn when the entity is `null` |

## Pictures

### `FeedMedia`

`FeedMedia.vue`: one picture, its box reserved from its declared width and
height. With `FEED_MEDIA` provided, that component draws it instead.

| Prop | Default | Accepts |
|---|---|---|
| `image` | | `{ src, alt, width, height }` |
| `href` | | a link around the picture |
| `link-attributes` | | attributes for that link; `href` and event handlers are dropped |

### `FeedMediaStrip`

`FeedMediaStrip.vue`: a group's strip: one square tile per member, then a
"+N" tile.

| Prop | Default | Accepts |
|---|---|---|
| `tiles` | | tiles from `strip()` in `shared/strip.ts`, or your own `{ image, href }` objects |
| `overflow` | | the "+N" count |
| `toggle` | | `{ expanded, controls, label }`: the "+N" tile becomes a button |

| Event | Payload | Fires |
|---|---|---|
| `toggle` | none | when the reader clicks the "+N" button |

## Bodies

Each built-in body type has a component in `body/`. The kit draws the body
with the component registered for its type in `FEED_BODIES`, else its own.
A type with neither draws its `$fallback` line, or nothing.

| Body Type | Component |
|---|---|
| `Storyfeed/Body/CallToAction` | `body/CallToAction.vue` |
| `Storyfeed/Body/Component` | `body/ComponentBody.vue` |
| `Storyfeed/Body/Excerpt` | `body/Excerpt.vue` |
| `Storyfeed/Body/FileAttachment`, `Storyfeed/Body/File` | `body/FileAttachment.vue` |
| `Storyfeed/Body/Image` | `body/Image.vue` |
| `Storyfeed/Body/ItemList` | `body/ItemList.vue` |
| `Storyfeed/Body/KeyValue` | `body/KeyValue.vue` |
| `Storyfeed/Body/MediaObject` | `body/MediaObject.vue` |
| `Storyfeed/Body/Prose` | `body/Prose.vue` |
| `Storyfeed/Body/Table` | `body/Table.vue` |

Every body component, and every renderer in `FEED_BODIES`, receives these
props. A component declares the ones it reads.

| Body Prop | Holds |
|---|---|
| `payload` | the body as it appears in the payload |
| `entity-label` | the label of the entity that carries the body |
| `entity-url` | that entity's link URL |
| `entity-link` | that entity's link: `{ href, modal, attributes }` |
| `entity-media` | that entity's `media` |

### `MediaObject`

| Prop | Default | Accepts |
|---|---|---|
| `payload` | | the body |
| `entity-label` | | the entity's label |
| `entity-url` | | the entity's link URL |
| `entity-link` | | the entity's link |
| `entity-media` | | the entity's `media` |
| `image-placement` | | `beside` or `below` the text; unset reads `FEED_MEDIA_OBJECT_PLACEMENT`, then `beside` |

## Injection Keys

Import the keys from `keys.ts` and `provide()` them in a page or layout, or
app-wide with `app.provide()`.

```vue
<script setup lang="ts">
import { provide } from 'vue';
import { Link } from '@inertiajs/vue3';
import { FEED_LINK } from '@/components/storyfeed/keys';

provide(FEED_LINK, Link);
</script>
```

| Seam | Value | Default |
|---|---|---|
| `FEED_LINK` | a component that takes `href`, such as Inertia's `Link`; receives the entity's attributes and, for a modal CallToAction, `modal` | `'a'` |
| `FEED_BODIES` | `{ [type]: Component }`, body type to renderer; one registered for a built-in type replaces the kit's | `{}` |
| `FEED_COMPONENTS` | `{ [name]: Component }`, Component body name to component; receives the body's `props` | `{}` |
| `FEED_MEDIA` | a component that receives `image`, `href` and `link-attributes`, and draws every picture | none |
| `FEED_FILE_LABELLER` | `({ name, mediaType }) => string \| null`; `null` uses the built-in MIME labels | none |
| `FEED_MEDIA_OBJECT_PLACEMENT` | `'beside'` or `'below'` | `'beside'` |
| `FEED_NOW` | a timestamp in milliseconds that pins the clock | the browser's clock |

### `feedBodies()`

`body/index.ts` exports `feedBodies()`, a plugin that installs renderers in
`FEED_BODIES` app-wide. Each install merges into the renderers already
installed.

```ts
import { feedBodies } from '@/components/storyfeed/body';
import Shipment from '@/components/feed/Shipment.vue';

createApp(App).use(feedBodies({ 'Acme/Shipment': Shipment }));
```

## Words

`shared/messages.ts` holds the role words after the time, "Yesterday", and
"from" and "until" for time ranges. The other words, such as "Show all" and
"Load older activity", are in the components' templates.
