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
- ✅ Named feeds — `Storyfeed::feeds()`, `only()`/`except()`, `Feed` classes,
  `make:feed`, and what a name is not. Sits directly after Reading because it is
  the same builder and the reader needs the scope half in hand before a second
  audience exists; the doctor findings it produces live in Reference, not here
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

## Pending coverage

Gaps handed over by the package lead on 2026-08-27 (Solo todo 411, scratchpad
63), with the lane's follow-up questions answered from source the same day.
Every item is on `dev-main` and **untagged**; the site is versioned to tags, so
nothing here publishes ahead of its tag, and a page that lands early carries its
own version callout. Sequencing is the docs lane's call.

Ask the package lead rather than reading the source. Three readers misread parts
of this on the day it was filed, source in hand.

### The site documents a package two releases old

Verified 2026-08-27 against `git tag` and `CHANGELOG.md` in the core checkout at
`~/Dev/projects/storyfeed`, which is a readable source and should be read
directly rather than asked about.

    v0.8.0-alpha.2   2026-08-18   <- what the site pins and documents
    v0.8.0           2026-08-23   the first stable tag
    v0.9.0           2026-08-26

Everything in this subsection is **live and wrong**, which is a different kind
of debt from a page not yet written: only these are misleading somebody right
now, and only these get worse by doing nothing. They outrank all seven gaps.

One of these is a class rather than an instance, and it is worth naming: **a
caveat placed inside a snippet is the only documentation that keeps being wrong
after the page is fixed.** Rule 9 is right — a caveat about code belongs with
the code, because copied code travels and prose does not — but the same property
that makes it reach the call site means a stale one cannot be recalled. Rule 9
may want a line acknowledging that cost; amending the house rules is Jasper's
call, not the lane's, so it is noted here rather than done.

- ⬜ **The install line tells a reader to install a pre-release.**
  `guide/upgrading.md` pins `composer require storyfeed/storyfeed:0.8.0-alpha.2`
  four days after a stable tag existed. First command a new reader runs. Fix
  this before anything else on the site.
- ⬜ **Two snippets teach a destructive default that no longer exists, and it is
  the default the docs themselves caused.** `guide/quickstart.md:70` and
  `basics/feedable-models.md:141` both carry an in-snippet comment saying an
  activity whose alias stops resolving is "treated as an orphan and deleted by
  the scheduled trickle". As of v0.9.0 pruning is **opt-in and off by default**;
  the trickle counts unresolved activities and reports them. The changelog is
  explicit that the destructive behaviour was what an installer got by following
  these instructions and reading no further — so this is the docs' own defect,
  not a change they failed to keep up with. Worst possible placement: house rule
  9 put the caveat inside the snippet deliberately, so it travels to the
  reader's `AppServiceProvider` and stays wrong there, and house rule 7 names
  the quickstart the strictest page on the site. `reference/commands.md:7`
  ("snapshots uncached activities and prunes orphans") is wrong the same way,
  and `reference/configuration.md` is missing `trickle.prune`.
- ⬜ **`basics/rendering.md`'s `::: danger` callout is now false, and it is the
  strongest device on the site.** It states "A group node has **no**
  `actor`/`object`/`target`/`context` keys". As of v0.9.0 group nodes carry
  exactly those keys alongside the exemplar lists — additive, nothing removed.
  The callout is stale twice over: wrong about the shape, and warning about a
  failure the payload change eliminated. It is not simply inverted, so do not
  replace it with "read the role key": the guard is pinned-by-registry **and**
  one distinct entity in fact, so a mis-declared custom axis still degrades to
  the exemplar list. The correct shape is "the singular key is there when it can
  be trusted; fall back to the exemplar list". `reference/payload.md`'s group
  node shape needs the same keys.

  Confirmed in core at `NodePresenter:339-343`: the singular is set only when
  the role token is in `aggregateTokens($axis)`, **and** there is exactly one
  exemplar, **and** `distinct` is exactly 1 — otherwise null. All three
  conditions are load-bearing. A mis-declared custom axis claiming to pin a role
  it does not still yields null. Getting the replacement right matters more than
  getting it soon: "read the role key" would be a new bug wearing a fix's
  clothes.
- ⬜ **`basics/rendering.md` advises the opposite of current guidance on unnamed
  groups.** Under null-headline groups it says "consider opening the group
  expanded". Core reversed that on 2026-08-27 — three unnamed groups turned a
  sixteen-row feed into forty rows, and it read as broken rather than
  unfinished. Sound about one node, wrong about a page. A genuine reversal, not
  two surfaces differing.
- ⬜ **`reference/doctor.md` overclaims in "From findings to code".** It says
  `--stubs` closes the loop; neither `roles` nor `aggregates.latent` emits one,
  both deliberately — the remedy for `roles` is authorial, and for latent an
  unrenderable stub is the exact harm the check closes.

### Unreleased-in-the-docs: two whole releases

Neither release has an `guide/upgrading.md` section. Both are tagged, so both
are writable today. The v0.8.0 content is largely **already written under the
wrong heading** — the site documents the nested `query()` callbacks, the `Feed`
class role lock and the AS2.0 collection route removal under `v0.8.0-alpha.2`,
so this is re-attribution plus a stable-release heading, not new prose.

- ⬜ **v0.8.0 — "Feed classes, and a scope that cannot leak."** Mostly a
  re-heading. Confirm whether the alpha.2 items are restated at the stable tag
  or the heading simply moves.
- ⬜ **v0.9.0 — "Grouping says which day, and a group speaks for its members."**
  Genuinely missing, and it carries the pruning default reversal above, the
  additive singular keys on group nodes above, plus three more:
  - `:verb` became a pinnable token. Touches the token table in
    `basics/rendering.md`, the anti-lie rule in `deeper/grammar.md`, and the
    pinning column in `deeper/aggregation.md`. Note it converges with the
    ladder's verb-label rung (gap 2) — "31 clause.added activities" rather than
    "31 activities" is the same improvement from the other side.
  - `->data()` accepts an `Arrayable` DTO while storage stays a plain array.
    `basics/recording.md:93` shows the array form only. The doctrine is the verb
    ladder's — typed thing is an authoring convenience, storage stays plain.
  - The solo tiebreak now descends to match `log()`. Two activities sharing a
    timestamp came back in opposite orders in `log()` and `live()`; groups keep
    ascending deliberately. Behaviour change worth an upgrade note.
  - The grouping day is cut in `app.timezone` at publish time, while a
    renderer's day headings are cut in the display zone at read time. When they
    disagree the group wins, and a burst straddling midnight renders under one
    heading with half of it belonging to yesterday. Explicitly **not fixed**;
    the app-side action is to set `app.timezone` to the zone the feed is read
    in. Documentable as shipped behaviour with a real remedy.

### Read mode is a per-surface decision — the top of the queue

Added to scratchpad 63 later on 2026-08-27, after four grouping complaints from
two consumer apps in one afternoon all turned out to be read-mode questions.
Ranked first of the seven: it is the only item that would have **prevented** the
confusion rather than explained it afterwards, and it is writable today with
zero version dependency — all three modes shipped in v0.6.

**It splits across two tiers, and the split is forced rather than chosen.**
Axis vocabulary is not taught until Digging deeper, so `basics/reading.md`
cannot say "`live` reads `repeat` plus authored composites" without leaking a
term its tier has not introduced. The mechanism and the choosing guidance
therefore live apart:

- ⬜ **`basics/reading.md` — choosing a mode per surface.** Extends the existing
  Read modes table; no new page, because splitting the choice from the mode list
  would give one fact two homes. Three surfaces, the mode each wants, one
  sentence of why: an audit dashboard, an operator feed, a customer page opened
  once. Plain English throughout, no axis words. The load-bearing sentence is
  that mode is chosen per **surface**, not per app — one app wanting all three
  at once is the normal case, not an exotic one.
- ⬜ **`deeper/aggregation.md` — which axes each mode reads.** A matrix, since it
  is enumerable: `log` reads no axis at all; `live` reads `repeat` plus authored
  composites; `summary` reads the winner on any bucket, with a `repeat` fallback.
  The page currently says only "each activity ends up in exactly one axis per
  read mode" and never says which — that omission is the actual cause of the
  complaints. Carry the consequence with it: authoring grammar for an axis your
  surface's mode never reads produces templates that can never render, and
  `object` pins the specific object where `repeat` pins only its type, which is
  why the better-reading rows exist only under `summary`.
- ⬜ **`basics/named-feeds.md` — a pointer.** A feed class declares its mode
  (`make:feed --mode=`), so named feeds are the mechanism by which a mode
  becomes per-surface. One sentence and a link.

**Write this before the Doctor items.** `aggregates.latent` is the same idea one
altitude down — a check for exactly the pairs no registered feed's mode can read
— so this page is the conceptual home its finding will point at. Writing it
first makes gap 4 cheap; writing gap 4 first leaves the finding explaining
itself from scratch in a reference table.

### Grammar — `deeper/grammar.md` absorbs three

- ⬜ **Grammar is keyed `(axis, verb)`, not verb.** The page states the key shape
  in one line; the consequence is unwritten. A verb authored on one axis renders
  unnamed on another. Own section, with the failure shown. **Writable today** —
  true at the current tag, no version callout, nothing outstanding. The existing
  key documentation is correct and needs no change: keys are built by
  concatenation and never split, so a dotted verb (`object.document.opened` is
  axis `object` plus verb `document.opened`) is safe precisely because nothing
  parses the key apart.
- ⬜ **The fallback ladder gained a rung.** Rewrites the existing "When no
  aggregate grammar resolves…" paragraph, which is now wrong: an unpinned role
  is pluralised rather than discarded. Authored aggregate → safe singular →
  pluralised singular → verb label → bare count; five rungs, so a table. Repeat
  axis only among the built-ins, because a role is substitutable only where the
  axis pins its kind. The count is the **distinct** count, never the member
  count.

  The mechanism is the least guessable part and must survive any language pass:
  core substitutes the **literal text** ("7 clauses") into the template string
  before returning it, so `:object` is gone by the time the renderer sees it.
  What arrives is `":actor reworded 7 clauses in the clause library"` — one
  remaining token, one plain phrase. **No new token, no change to `:count`, no
  payload shape change, and the token tables in `basics/rendering.md` and
  `reference/payload.md` do not move.** `:actor` stays a token because it is a
  real entity the renderer turns into a link; the unpinned role has seven
  referents and no link to lose, so plain text costs it nothing.

  **Two things land with this rung and only with it**, because neither is
  observable until it ships:

  - One sentence wherever the rung is documented: a substituted role is plain
    text, and is therefore the one noun in a headline that is **not** a link.
    Deliberate — many referents, no single entity to link to — but it breaks the
    otherwise reliable rule that a token becomes a linked label, and a reader
    will notice.
  - A property statement on `reference/payload.md`: a template is per **node**,
    not per grammar key, so anything memoizing on the emitted string sees
    unbounded cardinality. Key such a cache on the rendered node or on the
    grammar key you registered, never on the emitted template. Core stated this
    in its own `docs/payload.md`; the site's contract page is where an
    implementer reading this site would look for it. No consumer relies on the
    old shape — this is stating a property someone could reasonably infer, not
    warning about a break. The token tables still do not move.

  Not blocked on any question — gated only by the coupling below.
- ⬜ **`Storyfeed::nouns()` — the noun registry.** New public API, undocumented.
  Sits with the other registries (`icons()`, translation) as a section; earns
  `deeper/nouns.md` only if it outgrows one. Keys are the morph alias, never a
  class name (a comment inside the snippet, not a callout). Both plural forms
  required. Core never inflects — the prior-contradicting fact, so it is stated
  at each trigger site rather than linked. Extra pipe segments serve locales with
  more than two plural forms. A translation key may be used instead of a literal;
  the key supplies the noun and `phrase()` owns the number, for literals and keys
  alike. **Hold**: a consumer pilot is in production and the shape may change.

  **Coupled to the ladder rung above, and the coupling is load-bearing.** Without
  a registered noun the rung renders "7 items" — true, useless, and the exact
  sentence a consumer's own research flagged. Documenting the rung alone sells a
  feature the reader cannot reach, so the two want writing together.

### Doctor — `reference/doctor.md` absorbs two

- ⬜ **Read-mode reachability.** New `aggregates.latent` (clusters, has no
  grammar, and no registered feed's mode can read it) at Info, carrying no fix
  stub, plus `aggregates.reachability_unknown` when no feeds are registered or
  one will not inspect. Reachability is "as declared" — any call site may
  override a feed's mode. CI-affecting: latent being Info means
  `--fail-on=warning` no longer trips on those pairs, so this needs an entry in
  `guide/upgrading.md`, and registering named feeds now has a concrete payoff
  worth a pointer on `basics/named-feeds.md`.
- ⬜ **The `roles` check and `--only=roles`.** Warns when a singular template
  names a role its activities never carry. Warning for object/target/context,
  Info for `:actor`, because a null actor has a documented meaning. One table
  row and a short section; the cheapest item here. Emits no fix stub — see the
  overclaim defect above.
- ⬜ The Checks table has no severity column. With Info load-bearing in **two**
  places — `aggregates.latent`, and `roles` on `:actor` — it likely needs one.

### Filament renderer — no home on this site yet

Group rendering changed in `storyfeed/filament` (groups render closed named or
not; a surface with no Alpine renders every group open, because "closed" only
means something where something can open it; an unnamed group shows its verb
typeset as English, muted, with the raw token on `title`). Per the note below,
anything describing `storyfeed/filament` waits for the package and lands as a
pricing and install page, so this behaviour has nowhere to go today. The lead
agrees, and would rather the upgrade trap landed than the rest:

- ⬜ **The published-language-file upgrade trap.** The `verb_activities` line
  changed shape; an app that published the plugin's language files keeps the old
  string and the new rendering never appears. Same species as the
  published-migration rule, so it belongs on `guide/upgrading.md`. Passes the
  callout test — silent, unguarded, in-hand — and is recoverable, so `warning`.
  The plugin's CHANGELOG.md carries the detail.

### Not for the site

`FeedBuilder::declaredMode()` is `@internal` tooling surface. Recorded here only
so nobody documents it as public API.

The translated-noun `:count` bug ("7 7 clauses") was fixed in core `5de7e1e`
rather than documented — `trans_choice()` was adding `count` to the replacements
for free. A reader needs no knowledge of it for the code to work.

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
  — not a normal package page; the free-versus-paid model and its reasoning stay
  on Compatibility. Nothing about keeping a feed safe to show belongs on it:
  audience scoping is in the MIT core, and pricing copy must never imply
  otherwise.
- The 2023 scaffold's sidebar anticipated much of this structure; what it got
  wrong was exposing internals (`FeedActivity` etc.) as user-facing pages — the
  contract is the public surface, the models are not.
