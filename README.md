# storyfeed/docs

The documentation site for [`storyfeed/storyfeed`](https://github.com/storyfeed/storyfeed),
published at **https://docs.storyfeed.dev**.

VitePress, deployed to GitHub Pages by
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to
`main`.

**We run VitePress 2.0 alpha on purpose.** 1.x is effectively frozen (1.6.4 is
from 2025-08-05 and all development happens on the v2 line), and this site is new
enough to have nothing invested in the old theme internals. The trade is that
breaking changes still land between alphas — the CSS reset changed in alpha.19 —
so treat `npm update vitepress` as a deliberate act with a visual check after it,
not routine housekeeping. Reverting is a one-line change to `package.json`.
Bug reports upstream are part of the deal we accepted.

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # docs/.vitepress/dist
npm run preview
```

Port 5174 is deliberate: 5173 belongs to the Laravel apps in this project, and
two Vite dev servers fighting over one port is a confusing five minutes.

## Where things live

| | |
|---|---|
| `docs/` | the site source — `index.md` is the home page, `guide/` the prose |
| `docs/.vitepress/config.ts` | nav, sidebar, search, sitemap |
| `docs/.vitepress/theme/` | default theme plus brand tokens |
| `docs/public/` | static assets served at the root (`logo.svg`, and `CNAME` if it ever moves into the repo) |
| `IA.md` | the planned page structure — **not published**, and the source of truth for what still needs writing |

## Two rules for this repo

**The sidebar lists only pages that exist.** An entry pointing at a page nobody
has written yet is worse than a short sidebar: it promises documentation and
delivers a 404. Planned structure belongs in `IA.md` until the page is real.

**Prose here can drift from the package, and nothing will tell you.** The docs
live in a different repo from the code they describe, so a behaviour change and
its documentation cannot be one commit. Runnable examples belong in the package's
test suite, where drift fails a build; this site carries the explanation. Treat
doc accuracy as a release-checklist item, not something CI will catch.

## Hosting

GitHub Pages, `build_type: workflow`, custom domain set in repository settings
(not via a `CNAME` file). Changing the domain is a settings change plus a DNS
record — see the repo's Pages settings for the current state.
