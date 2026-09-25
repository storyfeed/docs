# World packs

Every feed in the docs is drawn from one **world**: a cast, the places they
go, and a dated list of what they did. The world is a **pack** in this
directory. One config value picks the active pack, and swapping it recasts
every example on the site.

```
theme/world.ts            the engine: anchor, shifting, node builders, Live / Summary / Log
theme/worlds/contract.ts  what a pack must supply: roles, scenes, rows (the WorldPack type)
theme/worlds/index.ts     the registry: every pack, by name
theme/worlds/<pack>/      one pack: manifest.ts (its strings) and index.ts (everything else)
```

## Writing a page

A page never names a pack's people and never picks its rows by id. It asks
for **roles** and **scenes**:

```vue
<script setup>
import { scene, role, logOf, liveOf, summaryOf } from '../.vitepress/theme/world'
</script>

**{{ role.customer.label }}** placed **{{ scene.order.object.label }}** with **{{ role.shop.label }}**.

<FeedExample :items="[scene.order]" />
<FeedExample :items="liveOf(scene.glance)" days />
```

Code snippets use neutral names too: `$customer`, `$order`, `$shop`.

| Role | What it is |
| --- | --- |
| `role.customer` | Someone who orders from the shop |
| `role.shop` | The place orders are placed with |
| `role.product` | Something the shop sells |
| `role.staff` | Someone who works at the shop |
| `role.service` | A named service with no model in the app, such as a payment provider (a Party) |

| Scene | What it is | What the test checks |
| --- | --- | --- |
| `scene.order` | The customer places an order with the shop: the standard example | verb `place`, actor `role.customer`, target `role.shop` |
| `scene.question` | The customer asks about a product | verb `ask`, a note as object, target `role.product` |
| `scene.otherApps.{task, code, billing, signature, support, team}` | One row from each kind of app | verbs `complete`, `merge`, `pay`, `sign`, `assign`, `join` |
| `scene.busyPlace` | Three or more people doing one thing at one place on one day | Summary folds them into one group; Live does not |
| `scene.repeats` | Runs of one person doing one thing at one target twice or more on one day | Live folds each run, and only those |
| `scene.distant` | One row from long ago | 30 days or more before now |
| `scene.cameo` | Jasper's rows | flagged `cameo` |
| `scene.glance` | The short, wide feed: the scenes above plus the pack's `around` rows | Live shows 10–14 rows over a few days with 3+ expanders; 6+ kinds of activity; Summary < Live < Log |

The cookbook also requires `scene.cookbook`: `actorless` (anonymous placement,
service payment, actorless expiry), `transitions` (confirmation and a
place/confirm/place timeline for the same order), `pricing` (add and latest
reprice of the product), `deletion`, `discussion`, and `grouped` (three orders
by one customer, and three customers placing one shared order). These are
software illustrations: a pack marks invented transactions as uncertain and
cites its software premise, without claiming they happened on screen.

`everything()` returns every row published by now, for the long feeds later
in the docs. `liveOf`, `summaryOf` and `logOf` fold any list of rows.

**A page that needs a scene the contract lacks adds it to the contract** (a
key in `SceneIds`, a line in `worldOf`, a check in `scripts/world.test.mjs`)
and supplies it in every pack. It never reaches into one pack.

## Adding a pack

1. Make `worlds/<name>/manifest.ts` with every display string the pack uses,
   in the manifest's form: `key: 'value',`, one per line. The cast test reads
   every pack's manifest and fails when a value appears literally in prose.
2. Make `worlds/<name>/index.ts`, and default-export a `WorldPack`:
   - `canonicalNow`: the instant the rows are written against. It is the
     default anchor, so with no override the pack's dates come out exactly.
   - `rows`: dated activities, written with `row(id, at, verb, actor, object,
     target, src, { headline?, uncertain?, cameo? })`. `at` is local
     wall-clock time, `YYYY-MM-DD HH:MM`.
   - `sources`: where each fact comes from. Every row's `src` must be a key.
     Mark anything unsettled with `uncertain`.
   - `verbs`: the pack's own verbs, and its own wording for the engine's
     (`BASE_VERBS` in world.ts). Every row's verb needs wording.
   - `roles` and `scenes`: see the tables above. Scenes name row ids.
3. Register it in `worlds/index.ts`.
4. Run `npm run test:world`. It checks every registered pack against the
   contract, and it names what is missing or does not do its job.
5. Select it with `VITE_WORLD_PACK=<name>` at build time, or change the
   default in world.ts.

## The anchor

"Now" for every page is `WORLD_ANCHOR`: the pack's `canonicalNow`, or
`VITE_WORLD_ANCHOR=<ISO instant>` at build time. Each row is shifted by
(anchor − canonicalNow), so it keeps its distance from now while its date
moves. An anchor at the same clock time as `canonicalNow` keeps every row on
the same day as before.

## Cameos

Rows come, in order of preference, from:

1. What happened in the setting, sourced.
2. What could have: invented events the setting would plausibly hold (an
   order at the shop, a fourth try at a stall game). Mark them `uncertain`.
3. A cameo, only when the setting reaches a dead end: an act it cannot hold
   at all (a pull request, a review, a deploy, a webhook). Jasper carries it,
   anachronism and all; that is the charm, not a mistake to hide.

Cameo rows are flagged `cameo` for Jasper's review, and a test fails if one
isn't. Jasper is the one real person; in a pack set in the past he is his
true age then, and his birth date is never printed.
