# Styling: pure Tailwind, enforced in CI

Use literal Tailwind v4 utilities in markup, including arbitrary properties,
values, variants and container queries. Tokens belong in `@theme`. No component
style blocks, hand-written component CSS or inline appearance styles unless
Tailwind cannot express the requirement. Fixed sets are never exceptions.

`npm run test:tailwind` scans authored theme/components and the Markdown renderer
config. It runs before `npm run build` and in PR CI. Build/dist/cache directories,
dependencies, sample payloads and Markdown usage examples are excluded.
`scripts/tailwind-allowlist.json` records exact runtime snippets/counts and
SHA-256 hashes for the two VitePress theme CSS entries, with reasons. Prefer
conversion. Add only the smallest exact exception with a one-line constraint
Tailwind cannot express, then run the guard. Edited, missing and duplicated
exceptions fail; LF/CRLF checkouts are equivalent. Never exempt a whole Vue file.
Every entry has `kind: genuine` or `debt`. Debt entries include a conversion
plan and must be burned down, never added. The guard freezes debt to the
existing custom.css entry; the maintainer tracks its burn-down separately.

# Storyfeed docs

Public VitePress documentation for the free MIT Storyfeed core and UI kits.
The site uses Tailwind without preflight; utilities are scoped to article
examples and docs-owned chrome. The shared Vue kit comes from `storyfeed/ui`
through a Vite alias; do not fork or copy it into this repository.

## Tests stay in their lane

Each package tests only what it implements: everyone stays in their lane.
Docs tests cover authored documentation, generated examples and this site's
own components. A test never reads another package's source files or asserts
another package's class names or geometry. Never pin storyfeed/ui class strings
from this repo; UI tests its rendering in its own workbench. Cross-package
contract/reference checks use the public contract, not implementation trivia.

## Workflow and gates

Read `README.md`, `package.json`, the relevant docs and scripts/tests before
editing. Work on a branch from latest origin/main and stage by explicit path.
Run `npm run build` and `npm run test:drift`; build runs the authored content,
payload, schema, UI reference, internal link, live-drift and generated-link
checks. Set `STORYFEED_UI_PATH` and `STORYFEED_CORE` to isolated compatible
checkouts when required. Generated payloads must reflect real core output;
never hand-merge them. Keep wording consistent with the versioned contract.

Every change needs a regression test. Local passes are not hosted CI, a merge
or deployment; inspect PR checks on the final commit before claiming green.
Commit as `Jasper Tey <jasper@teylabs.com>` with imperative, sentence-case
subjects. No attribution of any kind: no co-authors, generator notices, agent
identifiers, session URLs or AI mentions in commits or PRs.

Open draft PRs with the concrete change, verification and `Closes #N` when
applicable. Never merge, push to main, tag or release. Main deploys the docs;
the maintainer merges green changes.

This repository is public. Never publish secrets, local absolute paths,
private app/client names or internal notes. Without the local client-name
list, do not touch or discuss prior implementations.
