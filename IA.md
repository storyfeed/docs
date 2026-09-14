# Planned structure

Not published — a working document. Pages move into the sidebar in
`docs/.vitepress/config.ts` **when they are written**, never before.

Legend: ✅ written · 🚧 in progress · ⬜ planned

## House style — the DX bar

The success metric is a developer reading the docs and *getting it* — and
wanting to try the package. The register is Laravel's own docs. Concretely:

1. **Code first, and nothing before it is needed.** Every concept is shown before
   it is explained. If a section has three paragraphs before its first code
   block, restructure it. And do not front-load: if a section opens by setting up
   material for *later* sections, that material belongs later. A page teaches one
   thing at a time — an example arrives at the moment it becomes necessary, not
   where it was convenient to introduce.
2. **No autobiography, no selling, no category arguments, no meta-commentary.**
   The reader already clicked; positioning prose belongs on the splash site. A
   docs page earns excitement by making the thing look *easy*, not by claiming it
   is loved or arguing about what it isn't. Never write about the page itself
   ("no API here", "read this once and…", "the second column is the useful one").
   **And never warn about confusion.** If two terms are easy to mix up, that is a
   subheading explaining the difference — "The difference between target and
   context" — not a caution about how expensive the mistake is. Confusion
   observed while building the package is not evidence about the reader, and
   ranking it ("the single most expensive confusion") is autobiography wearing a
   warning label.
3. **Industry vocabulary, not invented vocabulary.** The pattern is an
   *activity feed*; the flat read is a *timeline*; grouping is *aggregation*
   (the package's own API says `aggregateGrammar`); the wire format is
   *Activity Streams 2.0*. Humble means the reader recognizes every noun.
4. **Short declarative sentences.** One idea each. Sub-clauses about why the
   API is shaped this way go in a `::: tip` — or get cut, and default to cut.
5. **Tables for anything enumerable** — options, modes, columns, tokens.
   Prose lists hide information; tables scan.
6. **Every page answers "what do I have when I'm done?" in its first two
   lines.**
7. **Copyable code is the strictest page on the site.** A reader who copies the
   quickstart never reaches the page that corrects it. Two artifacts each
   correct in isolation, contradicting each other one click apart, is worse than
   either being wrong alone — so example code must satisfy every rule stated
   anywhere in the docs, and payload-shaped examples get checked against a real
   payload, not against source.
8. **Reference pages are exhaustive; guide pages are minimal.** A guide shows
   the one obvious path. Alternatives, edge cases, and configuration live in
   reference pages the guide links to.
9. **A caveat lives where the mistake is made.** Copied code travels to the call
   site; prose about the code does not. So: a caveat about code is a comment
   *inside the snippet*; about a command, a trailing `#`; about payload shape, a
   cell in the shape's table. A standalone callout has to earn it — see the test
   below. **One spelling: VitePress containers** (`::: tip`, `::: warning`,
   `::: danger`), because two spellings of one device inside a page read as an
   accident, and the severity vocabulary below is the container vocabulary.
   `::: tip` for something to take in even when skimming, and for a distinction
   between two terms — a distinction is never a warning. `::: warning` and
   `::: danger` only for real risk, graded by the test below. No callout
   instructs the reader to audit, resist, or never; show the correct line
   instead. Callout titles are sentence case, or absent.
10. **Say it once.** One canonical home per fact, plus a pointer — one sentence
    or a code comment — on every page that literally prints the triggering line
    of code or command. Count those pages; that is the number of homes.
    *Exception:* a fact that contradicts a widely-held framework prior gets
    **stated** at each trigger site, not linked. A reader who doesn't know the
    fact exists will not click.
11. **Describe the shipped API.** No internals the public API doesn't expose, no
    defence of alternatives that weren't shipped, no history of the package or
    its showcase app, and no anthropomorphism — the package does not refuse,
    want, or lie; a sentence names what the code does. If the reader needs no
    knowledge of a fix for it to work, the fix is not documentation.
12. **String-first, sentence-shaped.** Canonical examples use plain strings and
    self-describing variables; typed layers (enums, Story classes) arrive
    afterwards as an improvement on working code. A recording example reads in
    the same order as the headline it produces, and showcase pages use the
    sugar — the chain IS the pitch:
    `->by($user)->action('upload', $file)->to($project)`. One register per
    page: mixing `->to($project)` with `->target($document)` in adjacent
    examples makes the reader reconcile two spellings of one slot. The
    long-hand (`actor()`, `verb()`, `target()`, `context()`) is documented once,
    in Recording.

13. **Never truncate content.** An example's text is the information — a
    comment whose label is a whole sentence is *teaching* that a comment's label
    is its body. No `Str::limit`, no ellipsis, no CSS clipping; a long value
    wraps or takes its own row. Where the demo app truncates for its UI, the
    docs diverge and the divergence is deliberate.
14. **Examples are rendered by the real components, from payload-shaped data.**
    A feed in the docs is the ported kit reading node-shaped samples — never a
    mocked blockquote, never prose pretending to be output. Sample data carries
    the contract's full entity shape (an inline subset is how the comment
    preview silently broke), and every mock name and string lives in ONE
    manifest (`theme/manifest.ts`) so recasting the docs is one edit. Manifest
    keys are handles (`who.designer`, `doc.report`), never names, and prose that
    names the cast interpolates the manifest (`{{ who.designer.label }}`);
    `npm run test:cast` fails the build when a manifest value appears literally
    in prose.
15. **Snippet, then its output.** What a code block produces is shown directly
    beneath it, rendered, in a well that lines up with the code block (same
    radius and rhythm, page-coloured inside a ring, muted `output` corner tag).
    The output is of THIS snippet — not a more advanced scenario the snippet
    does not produce. Showcase examples follow three beats: one plain-English
    sentence describing the incoming request, the recording, the published
    output.
16. **Snippets show the real shape of the requests.** Activities arrive from
    separate requests at different moments — so show separate publishes with
    time-passing captions ("*a minute later, another request*"), not a
    `foreach` that implies one request did it all. A loop is only shown when
    one request genuinely loops.
17. **Annotations are editorial overlay, and look it.** Docs commentary on a
    rendered node goes in the kit's `annotations` slot inside the callout
    chrome (`Annotation.vue`) — notch, mono tab, and a tone that is
    deliberately OFF-brand, because amber is the product's voice and the
    annotation is the narrator's. Never repurpose the `body` slot: that is the
    app's, and stealing it cost the comment example its preview.
18. **An annotation maps exactly the vocabulary introduced so far.** Fixed key
    set, fixed order, nothing added, nothing dropped — and an empty slot shows
    `null` rather than vanishing, so every example in a section has the same
    shape and the column scans. Entity values print `type · label`, because a
    bare label is ambiguous. Vocabulary is progressive across sections (the
    anatomy page teaches three roles before context exists); a section's
    annotations never leak a term a later section introduces.
19. **The sample world is ultra-simple, nothing clever.** The person type is
    `user` — the word a developer reads without translating — regardless of
    what the demo app calls it. Prose names parts, not cast members ("A user
    uploads a document"), because prose is the one thing the manifest cannot
    reach and named prose goes stale on recast. No role words in showcase
    headings ("on the same project", not "on a shared target") — role
    vocabulary starts where it is taught.

20. **The Basics teaches only what is needed to start building feeds.**
    Strict modes, config keys, commands, the doctor, caching, AS2 mapping,
    event and snapshot internals: none of it belongs in The Basics. It moves
    to Digging deeper or Reference, or is cut. (Sharpens rule 8.)
21. **Elementary form first.** The first snippet on any page is
    `Storyfeed::activity()->by()->action()->to()->publish()` or the plainest
    equivalent for the concept; typed and decorated forms (enums, Story
    classes, `PublishesToFeed`) arrive as a second step. Every later snippet
    on the page keeps the same form; a typed form is a clearly secondary
    example, after the concept is shown. **The standard example is single-
    sourced:** it lives in `docs/snippets/`, one explicit file per context
    (`publish.php`, `publish-from-listener.php`, `publish-from-event.php`),
    embedded with `<<< @/snippets/<file>`, and its node is `scenes.upload` in
    `samples.ts`. No templating: a new context is a new file, named for it. (Sharpens rule 12.)
22. **Bite-sized, focused snippets.** One idea per snippet, and
    `// [!code focus]` on the lines that changed since the previous snippet.
    A page is a sequence of small deltas, not one large listing — except the
    one representative example per concept (rule 23).
23. **One representative example per concept, from a real app.** A class
    example that exhausts the feature within reason and self-documents for
    the savvy reader. Drawn from the owner's own apps, never an imagined
    scenario; public prose still frames the source collectively.
24. **Every snippet has a purpose and a feed outcome.** What the reader sees
    in the feed after this snippet is rendered directly beneath it, by the
    real components. Now mandatory on every concept page, not only on
    showcases. (Sharpens rule 15.)
25. **No history, no promises.** Nothing about removed APIs, prior names,
    reversals, stability guarantees, licensing, or risk. A reader who arrives
    at 1.0 does not know or care. Pre-1.0 status is one phrase: "under active
    development". History lives on the upgrade guide and nowhere else.
    (Sharpens rule 11.)
26. **No forward references.** A page never names a tool or a term a later
    page introduces — the doctor, aggregation, axes — and never closes with a
    pointer to the next concept. (Rule 18, generalised to prose.)
27. **Plain words over coined phrases.** No "anti-lie rule", no "the axis
    pins it", no "immutable snapshots live in…". Where a name is useful the
    plain sentence comes first and the name is optional. (Sharpens rule 3.)
28. **Cookbook owns best practices.** Guidance tables ("choosing a publish
    site", "when to…") live in the cookbook, not on the concept page.
29. **Title Case everywhere** — sidebar, H1, H2, H3. Section shapes: "What
    Is X?", "Using X", "Examples of X".
30. **Story is the blueprint, Activity is the published fact.** A Story class
    produces an Activity; prose never uses one word for the other.
31. **Both spines are a table of contents.** A sidebar entry names the
    capability its page covers; an H2/H3 names what its section covers. Read
    either spine top to bottom with no page content and it must describe the
    site, or the page. No evocative, clever, or sentence-shaped titles; no
    "The X Rule"; no "What a Y Is Not". Cookbook entries follow the same rule
    in task shape ("Recording Deletions", "Headlines for Grouped Activities").

32. **Every class snippet opens with its namespace.** `namespace App\Events;`
    is what tells a reader that `DocumentUploaded` is an event; without it the
    class is a name and nothing else. Models under `App\Models`, stories under
    `App\Stories`, feeds under `App\Feeds`, events, listeners, observers and
    enums under their Laravel-conventional namespaces; a package type under
    its real one. The snippet opens with `<?php`, then the namespace, then the
    `use` block, so it reads as the file it is.
    **A snippet that is not a class opens with a comment naming where it
    goes:** `// config/storyfeed.php`, `// app/Providers/AppServiceProvider.php,
    boot()`, `// routes/console.php`, `// where the fact happens: a controller,
    an action, a listener`, `{{-- resources/views/feed.blade.php --}}`. A reader
    of any snippet must never have to ask "where do I put this?". Exempt: an
    API fragment on a Reference page (an argument list, a chain segment).

### When a callout is earned — Silent / Unguarded / In-Hand

All three must hold:

1. **Silent** — the mistake produces plausible output and throws nothing. If it
   throws, the stack trace is the documentation: use prose.
2. **Unguarded** — nothing in the reader's default toolchain catches it,
   including `storyfeed:doctor` **at its default exit code** (it reports; it
   only fails with `--fail-on`).
3. **In hand** — on this page the reader is holding, copying, or about to run
   the exact artifact where the mistake happens.

Severity is derived, not chosen: `danger` = all three *and* the consequence is
wrong data shown to a user, or data loss. `warning` = all three, recoverable.
Fails 1 or 2 → prose, or delete. Fails 3 → one sentence and a link, on the page
that does pass 3.

Models studied for register: Laravel docs (guide/reference split, code-first),
Spatie package docs (one page per capability, ruthless brevity), Inertia
(short pages, no page over ~1500 words), Tailwind (tables + live examples).

## The structure

Laravel-style grouping: a reader goes Getting started → The basics →
Digging deeper → Reference, and can stop at any tier with a working feed.

### Getting Started

- ✅ Introduction — `guide/introduction`
- ✅ Usage Examples — the showcase: a snippet, the feed it renders, and the page that teaches it
- ✅ Installation — `guide/installation`
- ✅ Quickstart — three steps until the app is recording; reading and drawing are choices, not setup

### The Basics

Feedable Models first, because recording a non-`Feedable` object fails silently.
After that, simple to complex: the elementary act, the typed layer over it,
reading and drawing, a second audience, then renderer-specific pages.

- ✅ Feedable Models — `toFeed()` / `feedMedia()`, a link per feed, the model's own feed, morph aliases
- ✅ Recording Activities — the builder, the verb as a plain string, roles, the actor, replace
- ✅ Activity Types & Verbs — the same verb typed, as a `FeedVerb` enum (owner's page)
- ✅ Headlines — `Storyfeed::grammar()`, tokens, icons, translation
- ✅ What an Activity Shows — a headline alone, a quoted utterance, the detail forms
- ✅ Reading Feeds — the builder, read modes, scoping, `query()`, pagination
- ✅ Rendering — the smallest loop, links, degraded entities, groups, details, resync
- ✅ Named Feeds — declaring, entering, `only()`/`except()`, `Feed` classes
- ✅ Live Rendering — Vue: reconciliation in code, sync_token, bounded empty-page loop
- ✅ The Feed Rail — the four configurations, choosing one, the glyph's intent

### Digging Deeper

Recording depth, then payload depth, then grouping, then operations.

- ✅ Publishing from Events — the listener, `PublishesToFeed`, events core emits
- ✅ Containers & Context — the fourth role, target vs context, the container query
- ✅ Parties & Anonymous Actors — null actor vs named non-model participant
- ✅ Story Classes — the blueprint: headline, icon and grouping in one class (not required to get a feed going)
- ✅ Activity Details — typed blocks in `data`, forms, versions
- ✅ Aggregation — grouping repeats, axes, thresholds, custom axes
- ✅ Grammar — group headlines, plural tokens, the tokens a group may use, nouns, wildcards
- ✅ Composites — `->objects()`, `Bundleable`, batches
- ✅ Queues — queued listeners and jobs, the actor on a worker
- ✅ Testing — `Storyfeed::fake()`, coverage assertions, static analysis
- ✅ Activity Streams 2.0 — conformance, the route, the `@context`, verb mapping
- ✅ Healing a Feed — retiring stories whose source is permanently gone

### Cookbook

In the order a reader meets the problem.

- ✅ Composing a Coherent Activity · Choosing When to Publish · Choosing What Not to Record ·
  Repeating Activities · Recording Deletions · Activities Without an Actor · Recording an
  Authoriser · Headlines for Grouped Activities · Keeping Verbs and Grammar Together ·
  Counts That Keep Changing · Setting Up a New Consumer (Filament; last until a Filament section exists)

### Reference

Vocabulary, then what you type, then the shapes, then the policy pages.

- ✅ Glossary · Configuration · Commands · Doctor · Feedable API · The Payload Contract ·
  Schema · Compatibility · Upgrade Guide (moved here from Getting Started: a new reader has nothing to upgrade)

## Pending coverage

Gaps handed over by the package lead on 2026-08-27 (Solo todo 411, scratchpad
63). **Audited 2026-09-14**: what the sweep closed is struck from this list, and
what is still open is below. Ask the package lead rather than reading the
source.

### Still open

- ⬜ **`reference/doctor.md` overclaims in "From findings to code".** It says
  `--stubs` closes the loop; neither `roles` nor `aggregates.latent` emits one,
  both deliberately — the remedy for `roles` is authorial, and for latent an
  unrenderable stub is the exact harm the check closes. **Live and wrong on the
  deployed site.**
- ⬜ **`reference/doctor.md` — read-mode reachability.** `aggregates.latent`
  (clusters, has no grammar, and no registered feed's mode can read it) at Info,
  carrying no fix stub, plus `aggregates.reachability_unknown`. CI-affecting:
  Info means `--fail-on=warning` no longer trips on those pairs, so it needs an
  upgrade note, and registering named feeds gains a concrete payoff worth a
  pointer on `basics/named-feeds.md`. Not on the site at all today.
- ⬜ **The Checks table has no severity column.** With Info load-bearing in two
  places — `aggregates.latent`, and `roles` on `:actor` — it likely needs one.
- ⬜ **`deeper/aggregation.md` — which axes each mode reads.** A matrix: `log`
  reads no axis; `live` reads `repeat` plus authored composites; `summary` reads
  the winner on any bucket, with a `repeat` fallback. The page still says only
  that each activity ends up in exactly one axis per read mode and never says
  which, which was the original cause of four consumer complaints in one
  afternoon.
- ⬜ **`basics/reading.md` — choosing a mode per surface.** The modes table
  exists; the guidance does not. Three surfaces, the mode each wants, one
  sentence of why. The load-bearing sentence is that mode is chosen per
  **surface**, not per app.
- ⬜ **Upgrade notes for v0.8.0 and v0.9.0.** Neither release has a section, and
  both are tagged. The v0.8.0 content is largely written under the
  `v0.8.0-alpha.2` heading already, so that half is re-attribution.
- ⬜ **The published-language-file upgrade trap** (`storyfeed/filament`): the
  `verb_activities` line changed shape, and an app that published the plugin's
  language files keeps the old string, so the new rendering never appears. Same
  species as the published-migration rule. Nothing about it is on the site.

### Closed by the 2026-09-14 sweep

- ✅ The install line pinned a pre-release; `guide/installation.md` installs
  `dev-main`.
- ✅ The destructive-trickle comments, the stale `::: danger` on group-node
  shape, and the expanded-group advice went with the page rewrites.
- ✅ Grammar is keyed `(axis, verb)` — `deeper/grammar.md` says so twice, and
  the fallback ladder and `Storyfeed::nouns()` are documented there.
- ✅ The `roles` check has its row in `reference/doctor.md`.
- ✅ `basics/named-feeds.md` carries the mode pointer.

### Not for the site

`FeedBuilder::declaredMode()` is `@internal` tooling surface. Recorded here only
so nobody documents it as public API.

## Notes

- **The pre-1.0 status is chrome, not a page.** A reader arrives from a search
  engine on a deep page and never sees the introduction, so the status rides in
  `layout-top` on every route (`theme/components/StabilityBanner.vue`) and
  points at its one canonical home, Compatibility → Stability before 1.0. It
  does not replace a per-page version callout: the banner answers "how settled
  is any of this", a page callout answers "does this snippet run on the install
  the site documents", and only the second can name an API. A page documenting
  something not in the current tag still carries its own callout.
- Guide pages describe curation **behaviour** as "how it behaves today" —
  policy is explicitly free to change; only the group-node *shape* is contract.
- Anything describing `storyfeed/ui` or `storyfeed/filament` waits until that
  package exists. When the `storyfeed/filament` page lands it is a **pricing and
  install** page — what it costs, the licence key, the private Composer endpoint
  — not a normal package page. Licensing and the free-versus-paid reasoning live
  on the splash site, not on Compatibility (cut 2026-09-14: no promises before v1). Nothing about keeping a feed safe to show belongs on it:
  audience scoping is in the MIT core, and pricing copy must never imply
  otherwise.
- The 2023 scaffold's sidebar anticipated much of this structure; what it got
  wrong was exposing internals (`FeedActivity` etc.) as user-facing pages — the
  contract is the public surface, the models are not.
