# Brand assets

| file | use |
|---|---|
| `storyfeed-mark.svg` | the mark, source of truth (same file as `docs/public/logo.svg`) |
| `storyfeed-avatar-1000.png` | 1000×1000 upload for the GitHub org avatar |

**The Collapse, amber on ink.** Three feed rows tapering into one solid bar:
many activities becoming one telling, which is the package's whole thesis drawn
as a shape.

Two rules the palette is built on, both easy to break by accident:

1. **The ink field is part of the mark, not a backdrop.** Amber on white is
   1.7:1 — unreadable. The badge carries its own background so it reads the same
   on a light or a dark header. Never place the bare amber mark on white.
2. **The avatar amber and the link amber are different colours.** Links run at
   amber-700 (`#b45309`, 5.0:1 on white) and amber-300 in dark mode
   (`#fbbf24`, 11.2:1). The logo's own `#fbbf24` as a body link colour looks
   fine in a screenshot and fails a real reader. Button text is ink, never
   white — white on amber is 2.1:1.

The avatar PNG is **full-bleed with no baked corner radius**: GitHub applies its
own rounded mask, and a baked radius leaves transparent slivers in the corners
after that clip.

Legibility was checked by rendering the mark at 16/20/24/32/48/64/96 px on both
light and dark. It holds at 16 px — the taper survives and the solid bottom bar
anchors it.

Placeholder status: this is a deliberate in-house mark, not a designed identity.
Replacing it later touches this folder, `docs/public/logo.svg`, and the tokens in
`docs/.vitepress/theme/custom.css` — nothing else.
