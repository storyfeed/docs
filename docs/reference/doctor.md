# Doctor

```bash
php artisan storyfeed:doctor
php artisan storyfeed:doctor --json          # structured, for CI
php artisan storyfeed:doctor --stubs         # print story stubs for every gap
php artisan storyfeed:doctor --only=grammar  # one check
```

Doctor checks your registries, your schema and the activities in your feed.
Each finding names its fix.

## Checks

| Check | Asks | Reports |
|---|---|---|
| `grammar` | does every verb/type pair in the feed have a headline? | error · warning · info |
| `aggregates` | does every group that formed — or *could* form — have aggregate grammar? | error · info |
| `tokens` | does any aggregate template use a token its axis doesn't pin? | warning · info |
| `axes` | does a grouping recipe omit `v`? Its groups may span several verbs, so no per-verb aggregate key is true of one. Answered from the registry, before any group forms | warning |
| `verbs` | verbs recorded but unregistered (typos), or registered but never recorded (dead vocabulary) | warning · info |
| `surface` | models that appear in the feed but that nothing publishes about | warning · info |
| `feeds` | is every verb decided — named in the allowlist or denylist of at least one restricted [named feed](/basics/named-feeds)? | warning · info |
| `parties` | party rows whose morph alias no longer resolves | info |
| `participants` | activities missing from the index `involving()` reads | warning |
| `tables` | are the package tables present? | error |
| `columns` | are write-path columns present? (catches schema drift after an upgrade) | error |
| `recording` | is anything being written? `storyfeed.recording.enabled` off, or `stopRecording()` at boot, makes every `publish()` return an unsaved row — a warning outside `testing`, info under it | error · info |
| `roles` | does a singular template name a role (`:object`, `:target`, `:context`, `:origin`, `:result`, `:instrument`) that none of its activities carry? The placeholder renders as content. `:actor` over all-anonymous rows is info | error · info |
| `grouping` | activities with no grouping row that today's axes would group — an import that ran `storyfeed:rebuild` before `storyfeed:trickle` | warning |
| `entities` | a model filling a feed role that cannot be resolved: no class, not a model, not `Feedable`, or the row is gone. See [Entities](#entities) | error · warning · info |
| `hydration` | which `Feedable` models load their live model in `feedMedia()`, and what a page pays for it. See [Hydration](#hydration) | info |
| `shapes` | snapshot fingerprints that no longer match current output (DTO drift) | warning · info |
| `hashes` | grouping hash lengths consistent with the current axis recipes | warning |
| `backlog` | activities still awaiting snapshots — is the trickle keeping up? | warning |
| `manifest` | is the cached story manifest stale relative to your code? | error |
| `freshness` | has the feed stopped receiving new activity? (`doctor.stale_after`) — catches a forgotten feed, not a broken one | warning · info |
| `body` | which [body](/deeper/details) forms are actually in the `data` column, and the two ways one can be malformed quietly: a map with no form token, and a versioned map whose value is not what the form declares | warning · info |
| `dangling` | grouping and participant rows whose activity no longer exists, trashed included. Activities have no database cascade, so a bulk hard-delete leaves these behind | info |

## Feed Coverage

The `feeds` check reports five findings:

| Finding | Severity | Means |
|---|---|---|
| `feeds.unclassified` | warning | a verb is named by no restricted feed, so nobody decided who may see it. Names no feed — it is the absence of one |
| `feeds.unrestricted` | info | a verb is named by no restricted feed, and some feed declared [`unrestricted()`](#declaring-an-unrestricted-feed). Reported on every run; the declaration does not decide the verb, it lowers the severity |
| `feeds.unknown_verb` | warning; info until the app registers its own verbs | a feed names a verb that is neither registered nor recorded. Usually a typo, and a typo in an allowlist drops the real verb from that feed |
| `feeds.none_restricted` | info | feeds are registered, but none restricts anything |
| `feeds.preset_failed` | warning | a preset threw while doctor inspected it, so the verbs it decides are unchecked. A `define()` reading constructor state lands here |

The verbs checked are your registered verbs plus the verbs in
`feed_activities`. An open feed (none of `only()`, `except()` or `verb()`)
classifies nothing. An app that never calls `Storyfeed::feeds()` gets no
findings. A finding that names a feed ends with the file and line that declared
it.

### Declaring an Unrestricted Feed

```php
// config/storyfeed.php
'portal' => fn (FeedBuilder $feed) => $feed->unrestricted()->summary(),
```

`unrestricted()` declares a feed that carries every verb. It changes no query,
and a call site can still narrow it. A verb covered only by this feed reports
as `feeds.unrestricted` at info instead of `feeds.unclassified` at warning.

```php
// config/storyfeed.php
'portal' => fn (FeedBuilder $feed) => $feed->only(['place', 'ready'])->unrestricted(), // throws FeedMisconfigured
Storyfeed::feed('portal')->only(['place', 'ready'])->get();                            // fine: narrowing at a call site
```

One feed declaration cannot both filter and be `unrestricted()`, and `verb()`
counts as a filter.

### Groups No Surface Can Read

| Finding | Severity | Means |
|---|---|---|
| `aggregates.missing` | error | a pair clusters, has no aggregate grammar, and a registered feed's mode reads that axis. Its groups fall back to the singular headline where its tokens are safe, and otherwise arrive with no headline |
| `aggregates.latent` | info | the same pair, but no registered feed reads the axis. No fix stub, because the grammar would render nowhere. A call site can still override a feed's mode and read the axis, and `--fail-on=warning` does not trip on it |
| `aggregates.reachability_unknown` | info | no feeds are registered, or one threw while being inspected. Every pair is then reported as `aggregates.missing`, at error |

Register your feeds so this check can tell a real gap from a latent one.

## Entities

The `entities` check resolves every morph alias recorded in the actor, object,
target and context roles. Each finding names the role, the alias, the class,
how many activities carry it, and example activity ids.

| Finding | Severity | Means |
|---|---|---|
| `entities.auth_model` | warning | the authentication model does not implement `Feedable`. The actor role is filled from the authenticated user, so every request-time publish carries an actor that never resolves. Needs no traffic; skipped when `actor_resolver` is set |
| `entities.unresolvable` | warning | the alias resolves to no class: no morph map entry, and no class by that name |
| `entities.not_model` | warning | the alias resolves to a class that is not an Eloquent model, so it can never be snapshotted |
| `entities.unfeedable` | warning | the alias resolves to a model without `Feedable`, so it is never snapshotted. Implement `Feedable`, then run `storyfeed:trickle` |
| `entities.missing` | warning | the model is `Feedable`, but the row is gone or hidden by a global scope. Sampled from the 50 most recent uncached rows per role and alias, never a scan. `storyfeed:trickle --prune` retires the activities |
| `entities.opaque` | info | the model's table could not be queried, so nothing can be said about its rows |

The rows these findings name render without a label or a link, and the trickle
counts them as unresolved on every run. A row that exists but is not yet cached
is reported by `backlog`.

## Hydration

The `hydration` check calls each `Feedable` model's `feedMedia()` with a
context whose model loader is switched off, once per registered feed and once
with no feed. A resolver that asks for `$context->model()` is recorded, and no
query runs. Candidates are the `Feedable` models under `discovery.paths` plus
any class filling a role in recorded activities.

| Finding | Severity | Means |
|---|---|---|
| `hydration.model` | info | the class loads its model in `feedMedia()`, and under which feeds: one query per class on every page it appears on, batched across the page. Says so when `hydration.enabled` is off and the call answers `null` instead |
| `hydration.page` | info | how many hydrating classes the 30 most recent activities carry, so how many queries that page pays on top of its own |
| `hydration.opaque` | info | `feedMedia()` threw when probed with the class's latest snapshot, so whether it hydrates cannot be said |

The check is silent when no resolver hydrates. It probes with the newest
snapshot for the alias, so a resolver that hydrates only under an unregistered
feed name, or only for an older snapshot shape, is not seen. A class with no
snapshot that throws on an empty one is not reported.

## From Findings to Code

```bash
php artisan storyfeed:doctor --stubs   # only the findings that name a registry edit
php artisan make:story --from-doctor   # a story class per gap
```

`--stubs` prints the registrations the findings imply: a grammar key with the
tokens that are safe for it, an icon key, an actorless verb, an axis template.
Every stub comes from what was recorded: pairs that occurred, axes the compiled
recipes apply, tokens that are pinned. `roles` and `aggregates.latent` emit no
stub; the first needs its sentence rewritten, the second would render nowhere.

The output has no headings or counts, so it can be piped. `// Nothing to
author` means no finding named a registry edit, not that there were no
findings.

## In CI

```bash
php artisan storyfeed:doctor --json --fail-on=warning   # or --fail-on=error
```

Without `--fail-on` the exit code is always 0. The
[coverage assertions](/deeper/testing#coverage-assertions) fail fast in the
suite; doctor reports against real traffic.

## On a Fresh Install

With no data, doctor reports that there is nothing to diagnose.
