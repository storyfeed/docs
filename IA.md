# Planned structure

Not published — a working document. Pages move into
`docs/.vitepress/config.ts`'s sidebar **when they are written**, never before.

Legend: ✅ written · 🚧 in progress · ⬜ planned

## Getting started

- ✅ Introduction — `guide/introduction`
- ✅ Installation — `guide/installation`
- ✅ Your first feed — `guide/quickstart`
- ⬜ Upgrading — per-version notes, including the published-migration rule

## Recording

- ⬜ Verbs — free-form strings, the `FeedVerb` enum, `verbs.strict`, `storyfeed:verbs`
- ⬜ Roles — actor, object, target, context, and why there are exactly four
- ⬜ Feedable models — `toFeed()` / `toFeedLink()`, snapshots, morph aliases
- ⬜ Story classes — one file per activity type, `make:story`, compilation
- ⬜ Publishing from events — `PublishesToFeed`, the single listener
- ⬜ Anonymous actors and parties — a null actor is *unknown*; a Party is *named*
- ⬜ Composites — one story whose object is a collection (`->objects()`, `Collectable`)

## Reading

- ⬜ Feeds and filters — the builder, scoping by entity
- ⬜ Read modes — `log()` / `live()` / `summary()`, and choosing a default
- ⬜ Pagination — opaque cursors, empty pages, the sync token
- ⬜ The payload contract — the envelope, entity objects, activity and group nodes
- ⬜ Rendering — the Blade reference loop expanded; degraded entities; null headlines

## Grouping and curation

- ⬜ How grouping works — candidates at write time, one winning axis
- ⬜ Axes — the recipe DSL, the built-ins, writing a custom axis
- ⬜ Grammar — templates, token safety, the anti-lie rule, one plural list per template
- ⬜ Batches — bursts, the quiet window, `BatchClosed`
- ⬜ Icons — resolution order, and why the vocabulary is yours

## Operations

- ⬜ Commands — the full `storyfeed:*` reference
- ⬜ Doctor — what each check means and how to act on it
- ⬜ Caching — `storyfeed:cache`, and its place in `php artisan optimize`
- ⬜ Retention — pruning, and the full-history posture
- ⬜ Testing — `Storyfeed::fake()`, the coverage assertions

## Activity Streams 2.0

- ⬜ What conformance means here — and what it deliberately doesn't
- ⬜ The routes and the documents they serve
- ⬜ The `@context` at `ns.storyfeed.dev`
- ⬜ Extension vocabulary — unknown types are preserved, never dropped

## Reference

- ⬜ Configuration — every key in `config/storyfeed.php`
- ⬜ Schema — the tables, and what each column is for
- ⬜ Compatibility — PHP and Laravel support policy

## Notes

- The 2023 scaffold that this repo replaced had a sidebar anticipating
  Recording / Retrieving / Grouping / Anonymous actors / Pruning / Publishing
  from events / Story discovery. That structure held up remarkably well and is
  reflected above. What it got wrong was naming internals as user-facing pages
  (`FeedActivity`, `FeedGroup`, `FeedEntity` as an "Architecture" section) — the
  package is headless, so the *contract* is the public surface and the models
  are not.
- Grouping and curation are still an active R&D track in the package. Document
  the group-node **shape** as contract; document curation **policy** as "how it
  behaves today", explicitly free to change.
- Anything describing `storyfeed/ui` waits until that package exists.
