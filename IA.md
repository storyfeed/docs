# Planned structure

Not published — a working document. Pages move into the sidebar in
`docs/.vitepress/config.ts` **when they are written**, never before.

Legend: ✅ written · 🚧 in progress · ⬜ planned

## House style — the DX bar

The success metric is a developer reading the docs and *getting it* — and
wanting to try the package. The register is Laravel's own docs. Concretely:

1. **Code first.** Every concept is shown before it is explained. If a section
   has three paragraphs before its first code block, restructure it.
2. **No autobiography, no selling, no category arguments.** The reader already
   clicked; positioning prose belongs on the splash site. A docs page earns
   excitement by making the thing look *easy*, not by claiming it is loved or
   arguing about what it isn't.
3. **Industry vocabulary, not invented vocabulary.** The pattern is an
   *activity feed*; the flat read is a *timeline*; grouping is *aggregation*
   (the package's own API says `aggregateGrammar`); the wire format is
   *Activity Streams 2.0*. Humble means the reader recognizes every noun.
4. **Short declarative sentences.** One idea each. Sub-clauses about why the
   API is shaped this way go in a `::: tip` or a "Why?" details block, or get
   cut.
5. **Tables for anything enumerable** — options, modes, columns, tokens.
   Prose lists hide information; tables scan.
6. **Every page answers "what do I have when I'm done?" in its first two
   lines.**
7. **Reference pages are exhaustive; guide pages are minimal.** A guide shows
   the one obvious path. Alternatives, edge cases, and configuration live in
   reference pages the guide links to.

Models studied for register: Laravel docs (guide/reference split, code-first),
Spatie package docs (one page per capability, ruthless brevity), Inertia
(short pages, no page over ~1500 words), Tailwind (tables + live examples).

## The structure

Laravel-style grouping: a reader goes Getting started → The basics →
Digging deeper → Reference, and can stop at any tier with a working feed.

### Getting started

- ✅ Introduction — `guide/introduction`
- ✅ Installation — `guide/installation`
- ✅ Your first feed — `guide/quickstart`
- ✅ Upgrade guide — per-version notes, including the published-migration rule

### The basics

- ✅ Recording activities — `record()`, the fluent builder, roles, `replace:`
- ✅ Verbs — strings, the `FeedVerb` enum, `verbs.strict`, `storyfeed:verbs`
- ✅ Feedable models — `toFeed()` / `toFeedLink()`, snapshots, degradation, morph aliases
- ✅ Story classes — anatomy, `make:story`, registration, compilation
- ✅ Reading feeds — the builder, scoping, read modes, pagination
- ✅ Rendering — the Blade loop expanded; tokens; degraded entities; null headlines

### Digging deeper

- ✅ Aggregation — axes, the winning axis, group nodes, custom axes
- ✅ Grammar — aggregate templates, token safety, the anti-lie rule
- ✅ Composites — `->objects()`, `Collectable`, batches and the quiet window
- ✅ Publishing from events — `PublishesToFeed`, the single listener
- ✅ Parties & anonymous actors — null actor vs named non-model participant
- ✅ Activity Streams 2.0 — conformance, routes, the `@context`, extension types
- ✅ Testing — `Storyfeed::fake()`, coverage assertions

### Reference

- ✅ The payload contract — envelope, entity objects, activity/group nodes, cursors, sync token
- ✅ Configuration — every key in `config/storyfeed.php`
- ✅ Commands — the full `storyfeed:*` reference
- ✅ Doctor — every check, what it means, how to act on it
- ✅ Schema — the tables and their columns
- ✅ Compatibility — PHP/Laravel support policy

## Notes

- Guide pages describe curation **behaviour** as "how it behaves today" —
  policy is explicitly free to change; only the group-node *shape* is contract.
- Anything describing `storyfeed/ui` waits until that package exists.
- The 2023 scaffold's sidebar anticipated much of this structure; what it got
  wrong was exposing internals (`FeedActivity` etc.) as user-facing pages — the
  contract is the public surface, the models are not.
