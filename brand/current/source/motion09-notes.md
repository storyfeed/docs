# Storyfeed — advancing activity queue, iteration 09

Review: http://127.0.0.1:8793/iteration-09/

Hero: http://127.0.0.1:8793/iteration-09/hero.html

One new hero motion direction. Nine activities advance through a three-card feed: the rear retires, middle moves rearward, front moves into the middle, and a new activity arrives at the front. Actor circles remain plain white throughout, following lead review. Headline width and body vary; each activity's content remains attached to its ID through all three depths. No rail, rotation, shimmer, or opening/closing accordion.

## Scope and identity

Only new `brand/studies/tim-wood-2026-10-05/iteration-09/**` is owned. Baseline commit `d333016e5d520c1b861b1c62c73ca50ca5684d50`; all 1,539 prior tracked study files remain frozen. No kit regeneration, live source edits, push or integration.

These are abstract hero illustrations grounded in the current core Body contracts, not actual feed renderer output, production activities or a new logo selection. Lowercase outlined wordmark and existing website copy are unchanged. Storyfeed is the proper name in prose.

Selected07 card geometry stays 460×280, radius 50, skewY(12), positions front (0,174), middle (116,82), rear (240,0), within outer translate(50,125) and 800×800 viewBox. Actor radius 37 and placement are unchanged. Settled fills are #17434B / #438D98 / #8EB8BD. Body accents use #B65326, #438D98 and gold #D9A008 light / #FBBF24 dark, with white content. During travel, card fills interpolate between the existing depth colours. The static/reduced-motion mark is the exact unchanged selected07 SVG, rather than a reconstructed animation frame.

## Sequence and cadence

`sequence.json` records the nine motifs in order:

1. Grouped entity media: selected three-tile strip. This is not a core Body type.
2. Prose: three text strokes and an orange emphasis.
3. Image: one abstract media plane and caption strokes; core resolves a named entity media slot.
4. KeyValue: two aligned label/value pairs.
5. FileAttachment: folded file silhouette and metadata strokes; core carries name/byte size/media type, with the link belonging to the entity.
6. Excerpt: quotation strokes plus attribution.
7. MediaObject: image beside subject/content strokes; core additionally supports optional files and footnote.
8. ItemList: three items with markers, distinct from label/value pairs.
9. Component: an illustrative custom two-part module. Core stores an app-defined name and props; it prescribes no visual shape.

Each state holds for 3,000ms, then advances for 750ms with smoothstep easing. The full nine-state cycle is 33,750ms. Three cards are present at each hold; four layers briefly coexist during retirement/arrival. The incoming face reaches full opacity early in the advance to keep its content legible. The last-to-first boundary is another normal activity advance: content IDs, positions and colours match the next hold without a separate reset animation.

A single JavaScript clock drives card positions, depth colours, opacity and all higher-card occlusion masks. Each mask uses the same transform/opacity as the card it represents, including the original 32-unit separation stroke. Content is not swapped on an existing visible card. `data-activity-id` tracks the nine recurring illustrative identities, while `data-sequence-id` records their position within the current cycle. This is a looping illustration, not an assertion of an endless production history.

Pause freezes the current timeline value; resume continues it. Replay explicitly restarts. Previous/next pauses on a settled activity. Hidden documents suspend progress, and delayed frames are capped to prevent large catch-up jumps. Reduced motion hides the dynamic SVG and shows the exact light/dark fallback; controls are disabled. Review-only source labels are outside the product hero.

## Source and licences

Core revision: `c6ae5864f199ce80429b1bf2fbbc3e1bff55a271`. Read-only contract snapshots for Prose, Excerpt, Image, MediaObject, FileAttachment, KeyValue, ItemList and Component are included under `source/`. `source/provenance.json` records their original paths and hashes, plus the six unchanged kit-08 font/wordmark/mark copies. Contract snapshots document semantics; PHP is not executed by this prototype.

Original mark concept: Tim Wood, with permission to adapt reported by Jasper. No broader artwork licence or sponsor relationship is asserted. Instrument Sans, Rodrigo Fuenzalida and Jordan Egstad, Google Fonts revision `6e8069ff8ba3dab2a397fb30e7fbd243aba9b57a`, SIL OFL 1.1. The font and OFL are copied unchanged from kit-08, including upstream trailing whitespace. The previous kit retains the full historical identity provenance.

## Use and focused verification

Serve this folder with any local static HTTP server. The existing study server uses port 8793. There are no runtime package installations, external images, credentials or live feed requests. Product navigation links retain the existing website destinations; checking them is outside this motion prototype.

From the clone root:

```sh
brand/studies/tim-wood-2026-10-05/.venv/bin/python brand/studies/tim-wood-2026-10-05/iteration-09/verify.py
```

The focused verifier uses installed Chrome through Playwright and Pillow. It checks all nine content identities through front/middle/rear, plain actors, moving-mask synchronization, sampled clipping, loop endpoint continuity, pause/resume/replay/step controls, desktop/mobile light/dark hero, and fresh-context exact RGBA reduced-motion comparisons at 800px. It also hashes all 1,539 prior files and the copied assets/contracts. `verification.json` records results; compact screenshots are under `evidence/`. No old motion or full-kit suite is repeated.

`build.py` refreshes the two review pages and documented local source copies from the original read-only clone paths; it is an authoring convenience, not a portable historical rebuild. `queue.js` is the editable animation source, and `capture_review.py` captures inspection views. `queueReview.seek(ms)` provides deterministic inspection through the same renderer as playback.

Limitations: this is a reversible hero prototype. Small body strokes are intentionally illustrative rather than readable UI, rear content is naturally occluded, and browser antialiasing during movement can differ from static edges. Identity fidelity is guaranteed by the separate exact fallback, not by claiming every animated hero frame is the logo.
