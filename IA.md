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
   and the wire format is
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
11. **If it can't be taught concisely to a beginner, it isn't for the docs.**
    A large block of code offered as a suggestion ("here is a merge function")
    is internals: either core ships something friendlier, or the page is for
    source divers and doesn't belong on the site (ruled 2026-09-22, dropping
    Polling and Pagination).

    **Describe the shipped API, and only Storyfeed's.** A page never says
    what a renderer will or will not do ("a renderer skips…", "never
    errors"): Storyfeed has no say over someone else's frontend (ruled
    2026-09-22). No internals the public API doesn't expose, no
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
14. **Examples are rendered by the real components, from payload-shaped data,
    and a reader can see that data.** A feed in the docs is the ported kit
    reading node-shaped samples — never a mocked blockquote, never prose
    pretending to be output. Sample data carries the contract's full entity
    shape (an inline subset is how the comment preview silently broke), and
    every mock name and string lives in ONE manifest (`theme/manifest.ts`) so
    recasting the docs is one edit. Manifest keys are handles (`who.designer`,
    `doc.report`), never names, and prose that names the cast interpolates the
    manifest (`{{ who.designer.label }}`); `npm run test:cast` fails the build
    when a manifest value appears literally in prose.

    **Every rendered feed is `<FeedExample :items="…" />`** — one card holding
    the feed and, under it, a collapsible `Payload` bar with a copy button,
    serialised from the SAME nodes it drew. Never hand-written beside it,
    which is the block that eventually disagrees with the picture above it; it
    caught its first drift within a minute of existing, a sample still
    carrying a verb the prose had renamed.

    Collapsed by default, because most pages teach the sentence rather than
    the shape. Add `expanded` where the data IS the lesson, and `context` to
    sit the example inside a running feed — real rows above and below, blurred
    rather than greyed, because grey reads as a disabled state and blur reads
    as depth of field. One row each side for a single activity (the rail only
    has to arrive and leave), two for a group or a sequence, which is already
    several rows tall; `:context="3"` overrides, and three is the cap, because
    past that the example stops being the subject. The payload still
    serialises `items` alone, so nothing surrounding can appear in it. The card is the
    well: a feed inside one drops its own ring and corner label, because a
    fence inside a fence is the crowding the detail block spent a day removing
    one package over. Use `FeedStream` directly only where a page is showing a
    consumer's own markup.

    **A feed link stays a link and refuses to navigate.** Sample payloads carry
    real-looking URLs, because null urls would teach that entities have none,
    and this site has no such routes. `SampleLink`, provided through the kit's
    `FEED_LINK` seam, keeps the anchor — the colour, the hover underline and
    the status bar are the affordance, and a span loses all three — and
    prevents `click` and `auxclick`. The URL moves to the tooltip, which turns
    the dead end into the lesson.

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
    to Digging deeper or Reference, or is cut. (Sharpens rule 8.) Getting
    Started too: it ends when the feed renders, with no "verify" or "check
    your work" step (ruled 2026-09-22: "the doctor is an advanced usage
    concern"). Elsewhere the doctor appears only where it is the
    section's subject (Testing, grammar stubs, catching drift), never as an
    aside that closes a section.
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
22. **Bite-sized snippets, and almost never a focus marker** (ruled
    2026-09-23: "if the entire snippet is short enough, don't focus. it needs
    judgement"). One idea per snippet; a page is a sequence of small deltas,
    not one large listing — except the one representative example per concept
    (rule 23). The test for a marker is whether the reader would lose the point
    without it. Anything readable at a glance, roughly a screenful, gets none,
    and that is every snippet on the site today. `// [!code focus]` is only for
    something genuinely long where one small part matters and the rest stays
    for orientation; it never dims an import (rule 35), a line the prose
    contrasts against, or anything the section teaches. Prefer a shorter
    snippet to a marker, and `// [!code highlight]`, not focus, for "this is
    the line that changed". A long example string is shortened, never left to
    run off the side of the block.
23. **One representative example per concept, from a real app.** A class
    example that exhausts the feature within reason and self-documents for
    the savvy reader. Drawn from the owner's own apps, never an imagined
    scenario; public prose still frames the source collectively.
24. **Every snippet has a purpose and a feed outcome.** What the reader sees
    in the feed after this snippet is rendered directly beneath it, by the
    real components. Now mandatory on every concept page, not only on
    showcases. (Sharpens rule 15.)
25. **The docs describe `dev-main` as it is now, with no history behind it.**
    One moment in time. No removed APIs, prior names, reversals, stability
    guarantees, licensing or risk; no "not in a tagged release" callouts, no
    per-version notes, no upgrade guide. A page never says what something used
    to be, and never says which release it arrived in — the reader installs
    what the install page installs, and that is the only version in play.
    Today's pre-1.0 status is chrome (`StabilityBanner`), never page content.
    (Sharpens rule 11.)
26. **No forward references.** A page never names a tool or a term a later
    page introduces — the doctor, aggregation, axes — and never closes with a
    pointer to the next concept. No "Where to Go Next" section either: the
    sidebar and the prev/next links already do that job. (Rule 18,
    generalised to prose.)
27. **Plain words over coined phrases.** No "anti-lie rule", no "the axis
    pins it", no "immutable snapshots live in…". Where a name is useful the
    plain sentence comes first and the name is optional. (Sharpens rule 3.) Two words are out (ruled 2026-09-22):
    **form** reads as an HTML form, so a `KeyValue`, `Excerpt` or `MediaObject`
    is a **body type**, and one instance is a **body**; **mint** is jargon, so
    what `feedMedia()` returns is **resolved** when the feed is read, and a
    composite is **created**. Prose says **Storyfeed**, never "core": a reader who
    installed one package has no "core" to picture. And say what the package
    does in plain verbs ("stores it and hands it back unchanged"), not in
    shorthand like "core never reads it".
28. **Cookbook owns best practices.** Guidance tables ("choosing a publish
    site", "when to…") live in the cookbook, not on the concept page.
29. **Title Case everywhere** — sidebar, H1, H2, H3. Section shapes: "What
    Is X?", "Using X", "Examples of X". No numbers in headings ("1. Make the
    Models Feedable"): VitePress does not number them, and hand numbers have to
    be reshuffled whenever a step is added or removed (ruled 2026-09-22).
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

33. **Getting Started hooks; the teaching pages leave nothing to guess**
    (ruled 2026-09-22). Introduction, Usage Examples, Installation and
    Quickstart show fragments under a location comment, because their job is
    to intrigue. From The Basics on, a recording example is the **full call
    site**: the class with its namespace and imports, the method, where each
    variable comes from, and what the method returns, so a developer can
    follow along in their own app. The whole class
    reads at once, with no focus markers (rule 22). A later snippet in the same section may be a fragment of a
    class already shown in full, under `// app/…/File.php, method()`.
    The same holds for a model's feed code (`describeFeed()`, `toFeed()`,
    `feedMedia()`, the `booted()` that registers `feedMediaUsing()`): the
    first snippet in a section is the model class, namespace and imports
    included. A `routes/feed.php` snippet opens
    with `// routes/feed.php` and its `use` lines, as Laravel's route files do.
34. **Every recording example shows both forms, as tabs** (ruled 2026-09-22).
    A `::: code-group` with `[Fluent Syntax]` first and `[Named Arguments]`
    second: the same activity as one `Storyfeed::record()` call. Every argument
    named (`verb:`, `object:`, `actor:` …), one per line, with a trailing
    comma, so a long call stays readable. Fluent leads
    and is the default tab. Shared snippets get a twin file,
    `<name>.named-arguments.php`. No second tab where `record()` has no
    equivalent: a chain that returns a `PendingActivity` (`toFeedActivity()`),
    or one that says `->anonymously()` or `->by(null)`, because `record()`
    reads `actor: null` as "not given" and resolves the ambient user.
    **Value objects too:** a `FeedEntity`, a body, a `FeedMedia` or a
    `FeedImage` built in `toFeed()`, `describeFeed()` or `feedMedia()` gets
    the same two tabs: the chain (`FeedEntity::make()->label(…)->body(…)`)
    first, `make()` with every argument named second.
    **Definitions use fluent syntax only:** declare them in `routes/feed.php`.
    Do not teach registry-array calls or array-based story declarations.
    `Storyfeed::verbs()` remains the verb vocabulary registration API.
35. **Every snippet that calls a facade shows its `use` line** (ruled
    2026-09-23). There is no global `Storyfeed` alias, so `Storyfeed::…`
    without `use Storyfeed\Facades\Storyfeed;` is a line the reader cannot
    run. A class snippet has it in its `use` block; a fragment has it under
    its location comment, above the code. The same for `Story`
    (`Storyfeed\Facades\Story`) and any framework facade the snippet calls
    (`Relation`, `Route`, `DB`). Exempt: an API fragment on a Reference page
    (a method signature, a chain segment), and a later fragment in the same
    section that continues a snippet which already showed the import.
 — Silent / Unguarded / In-Hand

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

### Amended 2026-09-25: the pages follow Laravel's docs

The owner asked for every page to follow the page structure and teaching style
of its Laravel counterpart (Laravel 13.x docs; the audit is in the lead's
Solo scratchpad 355). **Laravel wins on page skeleton and teaching style.** The
rules above still hold where Laravel says nothing. Where a rule above conflicts,
this section overrides it:

- **1, 6, 21: a page opens with its purpose, then its own simplest useful
  operation.** A short introduction or prerequisite is allowed. The first
  snippet shows *this page's* operation (naming, constraining, generating), not
  a repeated elementary publish. Generators come before the class they generate
  (`make:story`, `make:feed`), as `make:controller` does on Controllers.
- **4, 5: prose may explain why and when inline.** Use tables for comparisons
  and options, H3s for tasks that can be taught separately, and lists for short
  inventories.
- **8, 20, 28: a capability page teaches its variants, its setup, and how to
  inspect it** (list, cache, doctor), as Routing teaches `route:list` and
  caching. Reference stays exhaustive; the Cookbook keeps application recipes,
  and when to use a feature stays with the feature.
- **9: callouts use Laravel's `> [!NOTE]` / `> [!WARNING]`** for prerequisites,
  limits and guarded mistakes. The silent/unguarded/in-hand gate below no longer
  decides *whether* to warn; it still decides `WARNING` over `NOTE`.
- **10, 26: one canonical home, with a link wherever it's needed.** Links to
  prerequisites and later pages are allowed; an optional, purposeful "next
  steps" is allowed. Don't append one to every page mechanically.
- **13: irrelevant boilerplate may be elided;** never shorten what the example
  teaches.
- **29: headings are task-shaped** ("Generating Story Classes", "Registering
  Middleware") or precise capability nouns. The fixed What Is / Using /
  Examples trio is retired. Title Case stays.
- **Unchanged:** 3, 7, 11 (shipped API only, no history), 12 (string-first *in
  Recording*), 14–19, 22–25, 27, 30, 31, and **32–35 (namespace, full call
  sites, both forms as tabs, `use` lines)**. The lead kept those pending the
  owner's morning review, since they're his recent rulings.
- **No protected pages.** Introduction and Activity Verbs are ordinary pages
  (owner, 2026-09-24).

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

- ✅ Feedable Models — the guessed label, `describeFeed()` / `feedMediaUsing()`, a link per feed, `toFeed()` by hand, models you don't own, the model's own feed, morph aliases
- ✅ Recording Activities — the builder, the verb as a plain string, roles, the actor, replace
- ✅ Activity Verbs (`basics/verbs`) — the same verb typed, as a `FeedVerb` enum (owner's page). Named
  `Activity Types & Verbs` until 2026-09-14: the compound title was paying for
  a definition Recording Activities now gives, and AS2.0 has no term "verb"
  while every reader of an activity feed does. Then `Verbs`, until the owner
  chose `Activity Verbs` on 2026-09-24: it says whose verbs they are beside
  Recording Activities and Activity Content, and stays apart from Reference's
  Verb Vocabulary. The slug stays `basics/verbs`, so no link moves
- ✅ The Feed File (`basics/the-feed-file`) — `routes/feed.php` and the `Story` facade: headlines, tokens, optional segments, icons and intents, `Story::resource()`, group headlines, `->missing()`, `story()` at the call site, loading, listing and caching. Named `Headlines` until 2026-09-23; renamed for the file's job, as Laravel's Routing page is. Declaration only: what a glyph means moved to Rendering, translation to Localization
- ✅ What an Activity Shows — a headline alone, a quoted utterance, the body types
- ✅ Reading Feeds — the builder, read modes, scoping, `query()`, pagination
- ✅ The Payload — the envelope, one activity node beside the row it draws, an entity, one group
- ✅ Anatomy of a Row — the wireframe: every zone, what fills it, and the taste rules a renderer pays for otherwise
- ✅ Rendering — the smallest loop, links, what a glyph means, degraded entities, groups, details, resync
- ✅ Named Feeds — declaring, entering, `only()`/`except()`, `Feed` classes

### Digging Deeper

Recording depth, then payload depth, then grouping, then operations.

- ✅ Publishing from Events — the listener, `PublishesToFeed`, events core emits
- ✅ Containers & Context — the fourth role, target vs context, the container query
- ✅ Parties & Anonymous Actors — null actor vs named non-model participant
- ✅ Story Classes (`deeper/stories`) — elementary publishing, the three `make:story` shapes, activities constructed with data and `toFeedActivity()`, resource methods, request-based actors, single-verb declarations and generator options
- ✅ Constraining Roles (`deeper/constraining-roles`) — allowed role types, parties and empty roles, publish-time mismatches and inspection
- ✅ Activity Body Content (`deeper/body`) — typed blocks in `data`, body types, versions
- ✅ Aggregation — grouping repeats, axes, group headlines (per type or per verb), plural tokens, the tokens a group may use, nouns, thresholds, custom axes
- ✅ Composites — `->objects()`, `Bundleable`, batches, the group and parent headlines
- ✅ Localization — `FeedHeadline::trans()`, `FeedNoun::trans()`: translated in the reader's locale when the feed is read. Kept apart from The Feed File, as Laravel keeps Localization apart from Routing
- ✅ Queued Publishing (`deeper/queues`) — `queue()`, queued Story classes, publication time and snapshots, transactions, missing models, actor/context carry and first/last/latest behaviour
- ✅ Testing — `Storyfeed::fake()`, coverage assertions, static analysis
- ✅ Activity Streams 2.0 — conformance, the route, the `@context`, verb mapping
- ✅ Deleted Models — tombstones, restore, force delete, keeping the label, `->missing()`, `->missingHeadline()`, `->forgetWhenMissing()` on the verb, bulk deletes
- ✅ Retention — per-verb `keepFor()` / `keepForever()` over `prune.after_days`, `--pretend`, groups shrink, orphaned snapshots swept. Taught with `view`; ephemeral state is Choosing What Not to Record
- ✅ Latest Activity per Object — `latestPer()` on a feed: one row per key in that view, every activity still stored; the key table, which activity is the latest, groups formed from what the feed shows. Contrasted with `keepLatest()` in one tip
- ✅ Healing a Feed — retiring stories whose source is permanently gone

### Cookbook

In the order a reader meets the problem.

- ✅ Composing a Coherent Activity · Choosing When to Publish · Choosing What Not to Record ·
  Repeating Activities · Recording Deletions · Activities Without an Actor · Recording an
  Authoriser · Headlines for Grouped Activities · Keeping Verbs and Grammar Together ·
  Counts That Keep Changing

### Reference

Vocabulary, then what you type, then the shapes, then the policy pages.

- ✅ Glossary · Configuration · Commands · Doctor · Feedable API · The Payload Contract ·
  Schema · Compatibility

## Pending coverage

Gaps handed over by the package lead on 2026-08-27 (Solo todo 411, scratchpad
63). **Audited 2026-09-14**: what the sweep closed is struck from this list, and
what is still open is below. Ask the package lead rather than reading the
source.

### Still open

Nothing. Re-audited 2026-09-14 after the sweep; every item below is on the
deployed site. Ask the package lead rather than reading the source when the
next gap arrives.

### Void under rule 25

Upgrade notes for v0.8.0 and v0.9.0, and the `storyfeed/filament`
published-language-file trap. All three describe moving between releases, and
these pages describe one: `dev-main`, as it is now.

### Closed by the 2026-09-14 sweep

- ✅ `reference/doctor.md` no longer overclaims in "From Findings to Code": it
  names the two findings that emit no stub, `roles` and `aggregates.latent`,
  and says why each is deliberate.
- ✅ Read-mode reachability is on the site: `aggregates.latent` at Info with no
  fix stub, and `aggregates.reachability_unknown`, both on `reference/doctor.md`.
  The upgrade note it asked for is void under rule 25.
- ✅ The Checks table carries a severity column, so Info being load-bearing on
  `aggregates.latent` and on `roles` over `:actor` is visible without reading
  the prose.
- ✅ `deeper/aggregation.md` says which axes each mode reads, as a matrix:
  `log()` no axis, `live()` repeat plus authored composites, `summary()` the
  winning axis with a repeat fallback.
- ✅ `basics/reading.md` chooses a mode per surface, as a table of three
  surfaces with the reason for each, under the sentence that mode is chosen per
  surface and not per app.

- ✅ The install line pinned a pre-release; `guide/installation.md` installs
  `dev-main`.
- ✅ The destructive-trickle comments, the stale `::: danger` on group-node
  shape, and the expanded-group advice went with the page rewrites.
- ✅ Group headlines are keyed by axis and verb, and by type where the axis
  holds one — `deeper/aggregation.md` says so, with nouns and the fallback to
  the single-activity headline (Grammar was folded into it on 2026-09-23).
- ✅ The `roles` check has its row in `reference/doctor.md`.
- ✅ `basics/named-feeds.md` carries the mode pointer.

### Not for the site

`FeedBuilder::declaredMode()` is `@internal` tooling surface. Recorded here only
so nobody documents it as public API.

## Notes

- **The pre-1.0 status is chrome, not a page.** A reader arrives from a search
  engine on a deep page and never sees the introduction, so the status rides in
  `layout-top` on every route (`theme/components/StabilityBanner.vue`), and the
  banner is the whole statement: no page section behind it, no link (ruled
  2026-09-22). It is the ONLY place a version is named: per-page version callouts were removed on
  2026-09-14 under rule 25, because a page that says "not in a tagged release"
  is describing a release, and these pages describe `dev-main`.
- Guide pages describe curation **behaviour** as "how it behaves today" —
  policy is explicitly free to change; only the group-node *shape* is contract.
- **These docs are for someone who installed `storyfeed/storyfeed` and nothing
  else.** No `storyfeed/ui`, no `storyfeed/filament`: not their APIs, not their
  config keys, not "the Filament adapter does X" as an aside. A reader who has
  only the core package must never meet a line they cannot run. Two pages were
  deleted on 2026-09-14 for breaking this — Setting Up a New Consumer, and The
  Feed Rail, whose four configurations were the plugin's (its core half, the
  glyph's intent, moved to Headlines).

  **Naming the boundary is not the same as teaching across it.** Where the
  package stops, use the `::: headless` container. It has ONE message, written
  once in `config.ts` (ruled 2026-09-22: "can't the single one we just refined
  satisfy all of them?"):

  > **Storyfeed is headless: it has no views**
  > Storyfeed serializes the feed as a structured payload. Your frontend
  > chooses how to render it to suit your application. Official Storyfeed UI
  > components are currently in development.

  A page writes `::: headless` then `:::` and nothing else; a title or a body
  on the page fails the build. At most one per page.

  **The Quickstart's closing callout is where a reader first meets it.** It
  ends the page, after the feed is fetched, shown as a payload, drawn, and
  sketched in Vue. Every `::: headless` after it is a callback, so none may
  appear on a page before the Quickstart.

  It is LOUDER than `::: tip`, never a warning: a reader who misses it builds
  on something the package does not do. Teal is `tip` and yellow is
  `warning`, so it is loud by contrast: ink edges, an ink title, a solid fill.
  Rule 9's one-spelling rule still holds: it is a container, not a component.
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
