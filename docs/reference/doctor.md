# Doctor

```bash
php artisan storyfeed:doctor
php artisan storyfeed:doctor --json          # structured, for CI
php artisan storyfeed:doctor --stubs         # print story stubs for every gap
php artisan storyfeed:doctor --only=grammar  # one check
```

Doctor inspects your registries, your schema, **and** the traffic actually in
your feed. Findings name the fix, not just the fault.

## Checks

| check | asks |
|---|---|
| `grammar` | does every verb/type pair in the feed have a headline? |
| `aggregates` | does every group that formed — or *could* form — have aggregate grammar? |
| `tokens` | does any aggregate template use a token its axis doesn't pin? (the anti-lie rule) |
| `verbs` | verbs recorded but unregistered (typos), or registered but never recorded (dead vocabulary) |
| `surface` | models that appear in the feed but that nothing publishes about |
| `feeds` | is every verb decided — named in the allowlist or denylist of at least one restricted [named feed](/basics/named-feeds)? |
| `parties` | party rows whose morph alias no longer resolves |
| `participants` | activities missing from the index `involving()` reads (an install that upgraded into it) |
| `tables` | are the package tables present? |
| `columns` | are write-path columns present? (catches schema drift after an upgrade) |
| `recording` | is anything being written? `storyfeed.recording.enabled` off, or `stopRecording()` at boot, makes every `publish()` return an unsaved row — a warning outside `testing`, info under it |
| `roles` | does a singular template name a role (`:object`, `:target`, `:context`, `:origin`, `:result`, `:instrument`) that none of its activities carry? The placeholder renders as content. `:actor` over all-anonymous rows is info |
| `grouping` | activities with no grouping row that today's axes would group — an import that ran `storyfeed:rebuild` before `storyfeed:trickle` |
| `entities` | a model filling a feed role that cannot be resolved: no class, not a model, not `Feedable`, or the row is gone. See [Entities](#entities) |
| `hydration` | which `Feedable` models load their live model in `feedMedia()`, and what a page pays for it. See [Hydration](#hydration) |
| `shapes` | snapshot fingerprints that no longer match current output (DTO drift) |
| `hashes` | grouping hash lengths consistent with the current axis recipes |
| `backlog` | activities still awaiting snapshots — is the trickle keeping up? |
| `manifest` | is the cached story manifest stale relative to your code? |
| `freshness` | has the feed stopped receiving new activity? (`doctor.stale_after`) — catches a forgotten feed, not a broken one |
| `details` | which [detail](/deeper/details) forms are actually in the `data` column, and the two ways one can be malformed quietly: a map with no form token, and a versioned map whose value is not what the form declares |
| `dangling` | grouping and participant rows whose activity no longer exists, trashed included — there is no database cascade from activities by design, so a bulk hard-delete that forgets to clear them leaves a count nothing else surfaces |

## Feed coverage

The `feeds` check reports five findings:

| finding | severity | means |
|---|---|---|
| `feeds.unclassified` | warning | a verb is named by no restricted feed, so nobody decided who may see it. Names no feed — it is the absence of one |
| `feeds.unrestricted` | info | a verb is named by no restricted feed, and some feed declared [`unrestricted()`](/basics/named-feeds#unrestricted). Reported on every run; the declaration does not decide the verb, it lowers the severity |
| `feeds.unknown_verb` | warning; info until the app registers its own verbs | a feed names a verb that is neither registered nor recorded. Usually a typo, and a typo in an allowlist drops the real verb from that feed |
| `feeds.none_restricted` | info | feeds are registered, but none restricts anything |
| `feeds.preset_failed` | warning | a preset threw while doctor inspected it, so the verbs it decides are unchecked. A `define()` reading constructor state lands here |

The verb vocabulary is your registered verbs plus the verbs actually in
`feed_activities`, because the verb nobody declared is the one that leaks. An
open feed — calling none of `only()`, `except()` or `verb()` — classifies
nothing, and an app that never calls `Storyfeed::feeds()` gets no findings from
this check.

Findings that name a feed end with where it was declared, file and line, for
classes and closures alike.

## Entities

The `entities` check walks every morph alias recorded in each role — actor,
object, target, context — and asks whether it resolves. Each finding names the
role, the alias, the class, how many activities carry it, and example activity
ids to look at.

| finding | severity | means |
|---|---|---|
| `entities.auth_model` | warning | the authentication model does not implement `Feedable`. The actor role is filled from the authenticated user, so every request-time publish carries an actor that never resolves. Needs no traffic; skipped when `actor_resolver` is set |
| `entities.unresolvable` | warning | the alias resolves to no class: no morph map entry, and no class by that name |
| `entities.not_model` | warning | the alias resolves to a class that is not an Eloquent model, so it can never be snapshotted |
| `entities.unfeedable` | warning | the alias resolves to a model without `Feedable`, so it is never snapshotted. Implement `Feedable`, then run `storyfeed:trickle` |
| `entities.missing` | warning | the model is `Feedable`, but the row is gone or hidden by a global scope. Sampled from the 50 most recent uncached rows per role and alias, never a scan. `storyfeed:trickle --prune` retires the activities |
| `entities.opaque` | info | the model's table could not be queried, so nothing can be said about its rows |

Every row these findings name renders without a label or a link, and the
trickle counts it as unresolved on every run. A row that is present and merely
uncached is `backlog`'s business, not this check's.

## Hydration

The `hydration` check calls each `Feedable` model's `feedMedia()` with a
context whose model loader is switched off, once per registered feed and once
with no feed. A resolver that asks for `$context->model()` is recorded, and no
query runs. Candidates are the `Feedable` models under `discovery.paths` plus
any class filling a role in recorded activities.

| finding | severity | means |
|---|---|---|
| `hydration.model` | info | the class loads its model in `feedMedia()`, and under which feeds: one query per class on every page it appears on, batched across the page. Says so when `hydration.enabled` is off and the call answers `null` instead |
| `hydration.page` | info | how many hydrating classes the 30 most recent activities carry, so how many queries that page pays on top of its own |
| `hydration.opaque` | info | `feedMedia()` threw when probed with the class's latest snapshot, so whether it hydrates cannot be said |

Hydrating is a choice, so the check is silent on an app where no resolver
asks. The probe uses the newest snapshot recorded for the alias; a resolver
that hydrates only under an unregistered feed name, or only for an older
snapshot shape, is not seen. A class with no snapshot yet that throws on an
empty one is not reported.

## From findings to code

`--stubs` closes the loop: doctor tells you what's missing, and prints the
story class that fixes it.

```bash
php artisan storyfeed:doctor --stubs   # only the findings that name a registry edit
php artisan make:story --from-doctor
```

It prints no headings and no counts, so its output can be piped. A run that
prints `// Nothing to author` means no finding named a registry edit — not that
there were no findings. Run doctor without `--stubs` for the report.

## In CI

```bash
php artisan storyfeed:doctor --json --fail-on=warning   # or --fail-on=error
```

Structured findings plus an exit code. Without `--fail-on` the exit code is 0
whatever the findings say, so that doctor stays safe to run anywhere; the flag
is the opt-in gate that makes CI fail. Pair it with the
[coverage assertions](/deeper/testing#coverage-assertions): the assertions fail
fast in the suite, doctor reports against real traffic.

## On a fresh install

With no data, doctor reports nothing to diagnose rather than reporting your app
as unwired.
