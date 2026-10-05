# Storyfeed — current brand kit

This is the permanent, self-contained home of the selected stacked-card identity, refreshing activity queue and centered social composition. Lowercase **storyfeed** is the visual wordmark; **Storyfeed** is the proper name in prose. This is a naming preference, not an exclusive trademark assertion.

[Download the complete kit](downloads/storyfeed-current-kit.zip) · [Open the local review](index.html) · [Source hashes](source/frozen-assets.json)

After extracting the ZIP, run `python3 -m http.server 8802` in its `storyfeed-current` folder, then visit `http://localhost:8802/`. No sibling studies, credentials, environment file or dependency installation is needed for review. GitHub previews Markdown and downloads assets; it does not execute this kit's HTML or JavaScript. The ZIP excludes itself; run `python3 package.py` in the extracted kit to recreate the review's full-ZIP download.

## Current assets

- `marks/`, `icons/`, `avatars/`: exact selected07 light/dark, mono/reverse and optical small assets consolidated from kit08. Dark avatar background preserves the mark boundary.
- `lockups/`: frozen outlined Instrument Sans 700 / width100 lowercase geometry. Single ink is the baseline. The four named duotone treatments are available comparisons, not a new final selection.
- `social/`: **iteration10 only**, light/dark 2400×1200 canonical and 1200×630 crop, SVG/PNG/JPG. The centered foreground and genuine captured feed share the approved 1.08 transform. No old social composition is distributed here.
- `motion/`: exact iteration09 queue renderer and controls. Nine compact abstract motifs remain attached to their activity identity through front/middle/rear. Three-second holds and .75-second advances form a 33.75-second cycle. This is a hero illustration, not a production feed or a new logo. Exact selected07 stills are the reduced-motion fallback.
- `banners/`: frozen repository banners plus the new README GIF and static PNG/SVG exports. GIFs are captured at 1600px, displayed at 800px, with stationary outlined lettering. README derivatives use pure white / GitHub dark backgrounds and reserve exact brand colours in their global GIF palette. GIF palette conversion can soften antialiased edges; the PNG/SVG alternatives preserve full-colour/vector stills.

## Provenance and licences

The frozen donor is the isolated Storyfeed study at commit `da8b64aea9d1a014ae34f5d5b78125f9f86b54f3`. `source/frozen-assets.json` records every copied file's original study path and SHA-256; `manifest.json` records distribution hashes. Existing artwork is copied unchanged; only packaging/review paths and new README derivatives are authored here.

Selected mark: front/middle/back #17434B / #438D98 / #8EB8BD, white actor/headline, gold #D9A008 light / #FBBF24 dark, orange #B65326 and teal #438D98 media tiles. Concept by Tim Wood; permission to adapt reported by Jasper. `source/tim-wood-original.png` preserves the supplied reference. No broader artwork licence, endorsement or sponsor claim is asserted.

Instrument Sans by Rodrigo Fuenzalida and Jordan Egstad, Google Fonts revision `6e8069ff8ba3dab2a397fb30e7fbd243aba9b57a`, SIL OFL1.1: see `fonts/OFL.txt`, font and metadata. Runtime dependency licences are in `source/licenses/`.

The social backdrop is the genuine website DemoFeed/FeedStream Vue renderer at `932001a449d4884670a7771e096a811ff1105855`. Byte-identical component/native CSS snapshots are under `source/website/`; `harness/site/` is its prebuilt, inspectable local fixture. A deterministic fixture and clock produce authentic source milestone wording and native actor/rail/date spacing. This is **renderer output with fixture data**, not a production response or social crawler capture. See `source/social10/` for frozen inputs, captures, original provenance and exact composition measurements. Previous study notes in `source/motion09-notes.md` describe historical scope and verification, not this kit's publication status.

## Reproduction boundary

The editable SVGs and unchanged raster exports are the source of truth for existing identity assets; this kit does not recreate every historical generator. `render_banner.py` uses the actual unmodified `motion/queue.js` with deterministic `queueReview.seek()` calls in Chrome. It replaces only the frozen banner's mark region at its original placement and captures 20fps during advances, with long identical holds. Install Pillow and Playwright in a separate environment and provide Chrome to rerender; `requirements.txt` lists those requirements. `source/banner-render.json` records actual dimensions, frame counts, timing and bytes.

`regenerate_social.py` applies the documented shared transform to frozen iteration08 inputs in `source/social10/source/`. It does not reconstruct feed rows. `capture_feed.py` and `harness/` preserve the optional native-renderer reproduction path; its frozen prebuilt fixture is usable immediately. Rebuilding it needs the documented Node dependencies and does not imply a newly verified clean install. No need to regenerate approved captures for normal use.

Run `python3 package.py` for the manifest and deterministic ZIP. The archive excludes environments, dependency folders, historical review screenshots and itself. The top-level review offers current social, identity, colour comparisons, motion and all asset downloads.

## README and accessibility

GitHub's Markdown API retains `<picture>` with a `(prefers-reduced-motion: reduce)` source. The core README uses a standalone reduced-motion source first, selecting the light static PNG in either theme, then a simple dark animated source. GitHub runtime rewrites theme conditions, so no combined dark/reduced-motion condition is used. Both static theme downloads remain available in this kit. The core README keeps meaningful alternative text without utility links. Browser reduced-motion selection is checked on GitHub-rendered HTML. Final hosted GitHub/Camo behaviour can only be verified after an approved push; local/API rendering is not represented as live repository verification.
