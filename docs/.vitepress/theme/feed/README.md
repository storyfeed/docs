# Feed kit — docs port

The Newsroom's live renderer, decoupled from the Newsroom. Same components,
same markup structure, same behaviour; app-specific dependencies replaced with
seams. Nothing here imports a framework beyond Vue.

## Files

| File | Role |
| --- | --- |
| `FeedStream.vue` | Day headings, list scaffold, load-more |
| `FeedNode.vue` | **Dispatches on `kind` and nothing else** |
| `FeedItem.vue` | One activity: avatar/icon gutter, headline, time, body slot |
| `FeedGroup.vue` | One group: avatar stack, aggregate headline, disclosure |
| `FeedHeadline.vue` | Token substitution — the correctness core |
| `FeedIcon.vue` | Token → icon component map |
| `EntityAvatar.vue` | Initials + deterministic colour |
| `EntityLink.vue` | Entity label, linked when the payload gives a URL |
| `useRelativeTime.ts` | Relative timestamps + day bucketing |
| `keys.ts` | Injection keys (`FEED_LINK`, `FEED_NOW`) |
| `types.ts` | Payload shapes |
| `feed.css` | All styling, via CSS custom properties |
| `sample-payload.json` | 5 real nodes from production, incl. a composite of 7 |

## Usage

```vue
<script setup>
import FeedStream from './FeedStream.vue'
import payload from './sample-payload.json'
import './feed.css'
</script>

<template>
  <FeedStream :items="payload.items" />
</template>
```

Props are **node-shaped**: `items` takes payload nodes verbatim. A response
from `GET /feed/page` can be passed straight in, so a documented example and
the payload cannot drift.

## The four seams

**Links.** Defaults to `<a href>`. Provide a router component to change that:

```js
provide(FEED_LINK, Link) // Inertia's Link, RouterLink, anything taking `href`
```

**Time.** `provide(FEED_NOW, Date.parse('2026-08-14T15:00:00Z'))` pins the
reference point. **You want this for prerendered pages** — otherwise a build
bakes "2h ago" into the HTML and it drifts further from the truth every day the
page is not rebuilt. Pinning also stops the timer from ever starting.

**Bodies.** `<slot name="body" :node>` renders under the headline — a comment's
text, a document preview. Empty by default because what belongs there is
entirely app-specific.

Both slots exist on group nodes too. Fill a group's `body` only when
`distinct.objects === 1`: with more than one distinct object a preview privileges
one exemplar and implies it stands for the group, the same failure as a headline
that names one document out of five.

The body renders only when the payload names a component on the object. That is a
boundary, not a gap: `component` is the backend stating what this entity should
render as, while `data` is an app-specific bag the contract does not define. A
renderer that reached into `data` for a conventional key — `excerpt`, say — would
be inventing presentation the backend never asked for, and would do it for any
entity that happened to use that word for something else. No component, no body;
an app that wants a preview says so by naming one.

**Annotations.** `<slot name="annotations" :node>` renders below the body on both
node kinds, for surfaces that explain a node rather than render it — this site's
slot mappings, a payload dump, a curation trace. It exists so documenting a feed
never costs you the app's own previews, which is what happens when the two share
the `body` slot.

**Timestamps.** `<slot name="time" :node :label>` wraps the rendered time; the
Newsroom makes it a permalink to the activity's AS2 document.

## SSR

Safe to prerender. No `window` or `document` at any point, no timer until
`onMounted`, and avatar colours are hashed from `type:id` rather than random —
so server and client agree.

## Notes on fidelity

Three things were **removed** rather than ported, because they were Newsroom
features rather than renderer behaviour: the AS2 document viewer behind the
timestamp, the comment/document body previews, and the Inertia dependency.
All three are now slots or injections, so the Newsroom re-adds them from the
outside without forking a file.

One thing to know about the icon map: the package ships **no icons** and has no
opinion about which set you use. The payload delivers a token (`file-up`), and
`FeedIcon` maps tokens to components. Swap the map for Heroicons or inline SVG
and nothing else changes. Imports here assume `lucide-vue-next`; the Newsroom
uses `@lucide/vue` — same icons, different package name, one import line.

## The pinned clock

`FEED_NOW` is declared in `keys.ts` and nowhere else. `useRelativeTime` imports and
re-exports it, and must never declare its own: two `Symbol('feedNow')` calls are
different keys, so a second declaration makes every `provide()` from the first one
miss. `inject(FEED_NOW, null)` then falls back to the wall clock, which is the
correct default and therefore cannot announce that anything went wrong. A
prerendered page silently drifts instead.

A byte-identical rebuild is the control that catches it: build twice, diff the
output. It fails on anything non-deterministic without needing to know what it is
looking for.
