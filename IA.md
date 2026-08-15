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
   below. Prefer **GitHub-flavored alerts** (`> [!NOTE]`, `> [!TIP]`,
   `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`) — they render natively and
   their semantics are already known to every reader. `[!NOTE]` for something to
   take in even when skimming; `[!IMPORTANT]` only when success depends on it;
   `[!WARNING]`/`[!CAUTION]` only for real risk. A distinction between two terms
   is a `[!NOTE]`, never a warning. No callout instructs the reader to audit, resist, or never; show the
   correct line instead. Callout titles are sentence case, or absent.
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
    manifest (`theme/manifest.ts`) so recasting the docs is one edit.
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

### Getting started

- ✅ Introduction — `guide/introduction`
- ✅ Anatomy of an activity stream — the vocabulary preface, plain English, one
  burst carried through every section, glossary with a "what it is NOT" column
- ✅ Installation — `guide/installation`
- ✅ Your first feed — `guide/quickstart`
- ✅ Upgrade guide — per-version notes, including the published-migration rule

### The basics

Ordered by NEED, matching the quickstart. Recording a non-`Feedable` object does
not error — it produces an activity whose entity never snapshots — so teaching
recording first fails silently rather than loudly.

- ✅ Feedable models — `toFeed()` / `toFeedLink()`, snapshots, degradation, morph aliases
- ✅ Verbs — strings, the `FeedVerb` enum, `verbs.strict`, `storyfeed:verbs`
- ✅ Story classes — anatomy, `make:story`, registration, compilation
- ✅ Recording activities — `record()`, the fluent builder, roles, `replace:`
- ✅ Reading feeds — the builder, scoping, read modes, pagination
- ✅ Rendering — the Blade loop expanded; tokens; degraded entities; null headlines; reconciliation
- ✅ A live renderer — Vue: reconciliation in code, sync_token, bounded empty-page loop
  (written by the Newsroom agent against production; the parts a static template cannot show)

### Digging deeper

- ✅ Aggregation — axes, the winning axis, group nodes, custom axes
- ✅ Grammar — aggregate templates, token safety, the anti-lie rule
- ✅ Composites — `->objects()`, `Collectable`, batches and the quiet window
- ✅ Publishing from events — `PublishesToFeed`, the single listener
- ✅ Containers & context — the fourth role: grouping by place, container queries, AS2
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
