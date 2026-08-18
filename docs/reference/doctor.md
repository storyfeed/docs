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
| `shapes` | snapshot fingerprints that no longer match current output (DTO drift) |
| `hashes` | grouping hash lengths consistent with the current axis recipes |
| `backlog` | activities still awaiting snapshots — is the trickle keeping up? |
| `manifest` | is the cached story manifest stale relative to your code? |
| `freshness` | has the feed stopped receiving new activity? (`doctor.stale_after`) — catches a forgotten feed, not a broken one |

## Feed coverage

The `feeds` check reports four findings, all at warning severity:

| finding | means |
|---|---|
| `feeds.unclassified` | a verb is named by no restricted feed, so nobody decided who may see it. Names no feed — it is the absence of one |
| `feeds.unknown_verb` | a feed names a verb that is neither registered nor recorded. Usually a typo, and a typo in an allowlist drops the real verb from that feed |
| `feeds.none_restricted` | feeds are registered, but none restricts anything |
| `feeds.preset_failed` | a preset threw while doctor inspected it, so the verbs it decides are unchecked. A `define()` reading constructor state lands here |

The verb vocabulary is your registered verbs plus the verbs actually in
`feed_activities`, because the verb nobody declared is the one that leaks. An
open feed — calling neither `only()` nor `except()` — classifies nothing, and an
app that never calls `Storyfeed::feeds()` gets no findings from this check.

Findings that name a feed end with where it was declared, file and line, for
classes and closures alike.

## From findings to code

`--stubs` closes the loop: doctor tells you what's missing, and prints the
story class that fixes it.

```bash
php artisan storyfeed:doctor --stubs
php artisan make:story --from-doctor
```

## In CI

```bash
php artisan storyfeed:doctor --json
```

Structured findings plus exit status. Pair it with the
[coverage assertions](/deeper/testing#coverage-assertions): the assertions fail
fast in the suite, doctor reports against real traffic.

## On a fresh install

With no data, doctor reports nothing to diagnose rather than reporting your app
as unwired.
