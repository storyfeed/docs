# Brand assets

**The Carousel.** One activity in focus, with the entries either side of it
fading out of frame — a feed that keeps ticking while older stories recede.
Each entry is four parts, and they are the package's own vocabulary:

| part | colour | what it is |
|---|---|---|
| actor node | `#FBBF24` dark / `#D9A008` light | who did it |
| headline | `#EE876B` | the sentence the feed prints |
| body | `#438D98` | what the activity shows |
| rail | `#858585` | the thread the entries hang from |

## The files

| file | use |
|---|---|
| `full-light.svg` | the mark on a light surface — **source of truth** |
| `full-dark.svg` | the mark on a dark surface |
| `restrained-{light,dark}.svg` | three colours, coral dropped |
| `yellow-{light,dark}.svg` | single colour |
| `mono-{light,dark}.svg` | one ink, for stamps, print and embroidery |
| `avatar.svg`, `avatar-512.png` | contained on `#202735`, for the GitHub org avatar |
| `storyfeed-motion-{light,dark}.svg` | the advancing carousel, 4s cadence |

`docs/public/` carries the deployed copies: `logo-light.svg`, `logo-dark.svg`,
`favicon.svg`, `favicon.ico` (16/32/48) and `apple-touch-icon.png`.

## Rules, each of which is a mistake someone has already made

1. **Two yellows, and they are not interchangeable.** `#FBBF24` is for dark
   surfaces; on white it measures 1.60 and disappears. `#D9A008` is the light
   surface yellow. Copying the wrong one is the single easiest way to break
   this, which is why it is rule one.
2. **The brand colours are not text colours.** Teal is 3.82 on white and yellow
   is worse. Links run at `#356F78` in light (5.68) and `#7CC3CE` in dark
   (8.63) — see `docs/.vitepress/theme/custom.css`.
3. **Button text is white now, not ink.** White on `#356F78` is 5.68; ink on it
   is 2.63. This *inverts* the old amber-on-ink rule, which said the opposite
   for the opposite reason. Do not carry the old rule forward.
4. **The bare mark needs no container.** Unlike the amber mark it replaces, the
   light variant is legible on white, so there is no badge and no baked field.
   The contained `avatar.svg` exists only because a GitHub avatar sits on
   backgrounds we do not control.
5. **`avatar-512.png` is full-bleed with no baked corner radius.** GitHub
   applies its own rounded mask, and a baked radius leaves transparent slivers
   in the corners after that clip.
6. **The faded entries run at 0.52 opacity**, not lower. At 0.35 they measured
   1.19–1.49 on a light field, which is invisible in print, on a projector and
   through most exports — the fade has to be perceptible for the mark to say
   what it means.
7. **Motion degrades to the still composition.** Under
   `prefers-reduced-motion` the carousel stops with all three entries visible.
   Reduced motion means do not animate; it does not mean show less. That state
   is also what screenshots and PDF exports capture, so it is closer to the
   default than it looks.

## Replacing it

Touches this folder, `docs/public/`, the sidebar logo in
`docs/.vitepress/config.ts`, the tokens in `docs/.vitepress/theme/custom.css`,
and the mirrored tokens and assets in `storyfeed-website` — which copies these
values deliberately so the port stays a copy rather than a fork. They move
together or they fork.

The GitHub org avatar is a manual upload and is not covered by any deploy.
