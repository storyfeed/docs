# Compatibility

## Support policy

| | |
|---|---|
| PHP | **8.4 only** (and newer). The package leans on 8.4 idioms rather than supporting older runtimes |
| Laravel | **rolling current + previous major** — today, 12 and 13 |
| Databases | MySQL, PostgreSQL, SQLite, SQL Server |

CI runs PHP 8.4/8.5 × Laravel 12/13 × prefer-lowest/stable.

## Versioning

Two things version independently:

| | promise |
|---|---|
| the **package** | semver from 1.0 |
| the **payload contract** | no breaking changes within a payload major; new majors are additive new serializers, old ones maintained |

A renderer built against payload v1 keeps working across package majors.

## Stability before 1.0

Storyfeed is pre-1.0 and genuinely unfinished. It is not marketed, not
announced, and the author is currently its only user. Anyone who finds it is
welcome to build on it, at their own risk — which is a real risk here, not
boilerplate.

| | |
|---|---|
| **breaking changes** | ship without a deprecation cycle and without a major bump. The version is `0.x` so that they can |
| **these docs** | change with the code and can lag it. A page describing a method renamed yesterday is a bug worth reporting, not a promise to plan around |
| **installing** | pin an exact commit or tag, never a range. `dev-main` is a moving target by design |
| **design decisions** | get reversed — in the open, with the reasoning written down, sometimes within days |

The evidence for those, rather than a disclaimer standing in for it: two
renaming waves landed in one week — `for()` became `involving()` on the read
side, and `flat`/`grouped`/`curated` became `log`/`live`/`summary` — and a
licensing decision was reversed four days after it was taken.

Also true, and unchanged by the above:

- Schema changes ship as additive `add_*` migrations; one consolidation at 1.0.
- Unknown read modes and config values **throw**, naming their replacement.
- Every rename lands in the [upgrade notes](/guide/upgrading) with its
  replacement.

### What does not move

**The payload contract.** It versions independently of the package — see
[Versioning](#versioning) above — and it is a freeze candidate: treat its shape
as stable and build renderers against it. It hardens early and stays hard while
everything behind it moves, which is what makes the rest of this section
affordable. The package can change its mind because the contract does not.

**The MIT commitment.** Instability is about the API surface. It is not a
licence to walk back what has been published — see [Licensing](#licensing)
below.

## Licensing

| package | licence | where |
|---|---|---|
| `storyfeed/storyfeed` — the core, documented here | MIT | Packagist |
| `storyfeed/ui` — Vue/Inertia + Blade feed components | MIT | Packagist |
| `storyfeed/filament` — the Filament plugin | commercial, ~$49 one-time | Anystack: a licence key and a private Composer endpoint |

**What is MIT stays MIT** — the core and `storyfeed/ui` alike. Neither moves
behind a licence later.

`storyfeed/ui` is funded by sponsorship rather than sold: sponsorship sets how
many adapters it reaches, not who may use it. Unsponsored it ships Vue/Inertia
and Blade components; sponsored, Livewire and React become reachable.

### The Filament plugin is paid, and this page used to say otherwise

Until **2026-08-18** this page promised the Filament adapter as part of MIT
`storyfeed/ui`. It is now `storyfeed/filament`: a separate repository,
commercial from its first commit. That narrows something already
written down in public, so it is explained here rather than quietly edited.

- **The pattern stays free, end to end.** The core plus `storyfeed/ui` render a
  real feed — recording, reads, grouping, curation, the payload contract and
  components that consume it — with nothing withheld. A package you cannot see
  working is not worth learning.
- **Filament is the one corner of this ecosystem with a working paid-plugin
  market**: a directory, a habit of paying, buyers with a budget line. Charging
  there is an ordinary transaction, not a toll booth bolted onto an open-source
  project.
- **What the plugin sells is live-feed correctness and Filament-native
  components.** Reconcile by node identity rather than list position; drop and
  refetch when the `sync_token` changes; an empty page is not the end of the
  feed; follow with a live cursor. Rules every consumer gets wrong
  independently, worth getting right once on everyone's behalf and keeping right
  as Filament moves.
- **What it does not sell is safety.** Deciding which verbs an audience may see
  — the thing that makes a customer-facing feed trustworthy — shipped in the
  **MIT core** on the same day, as named feed presets with per-verb allow and
  deny lists and a doctor check that insists every verb be decided. Nothing that
  makes a feed safe to show will ever live in a paid package. If it did, the
  free core could not honestly ship a customer-facing feed at all.
- **Now is the only moment this costs nobody.** No release anyone depends on, no
  installs, no adopters — there is nobody whose plans this breaks. The same
  change after the package has users would be a bait and switch, so it is being
  made before, in the open, with the reasoning attached.
