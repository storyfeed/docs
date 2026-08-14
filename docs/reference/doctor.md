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
| `parties` | party rows whose morph alias no longer resolves |
| `tables` | are the package tables present? |
| `columns` | are write-path columns present? (catches schema drift after an upgrade) |
| `shapes` | snapshot fingerprints that no longer match current output (DTO drift) |
| `hashes` | grouping hash lengths consistent with the current axis recipes |
| `backlog` | activities still awaiting snapshots — is the trickle keeping up? |
| `manifest` | is the cached story manifest stale relative to your code? |
| `freshness` | has the feed stopped receiving new activity? (`doctor.stale_after`) |

## The check worth understanding

`freshness` is the odd one out. Every other check asks whether what you have is
*correct*; this one asks whether anything is still *arriving*. The failure it
exists for is not a broken feed but a **forgotten** one — grammar gets authored
once, new modules ship, and nothing publishes from them.

It is honest about its reach: a module that never touches Storyfeed is
invisible to Storyfeed. `storyfeed:stories` covers the part that is detectable.

## From findings to code

`--stubs` closes the loop: doctor tells you what's missing, and prints the
story class that fixes it.

```bash
php artisan storyfeed:doctor --stubs
php artisan make:story --from-doctor
```

That replaces the register → run → inspect → hand-transcribe ritual entirely.

## In CI

```bash
php artisan storyfeed:doctor --json
```

Structured findings plus exit status. Pair it with the
[coverage assertions](/deeper/testing#coverage-assertions): the assertions fail
fast in the suite, doctor reports against real traffic.

## On a fresh install

Doctor refuses a verdict when there is no data to look at, rather than
reporting your whole app as unwired. "Nothing to diagnose yet" is a valid
result.
