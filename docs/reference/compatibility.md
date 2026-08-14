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

That split is the point of a headless package: a renderer built against payload
v1 keeps working across package majors.

## Pre-1.0

Storyfeed is pre-1.0. Concretely:

- The payload contract is a **freeze candidate** — treat its shape as stable.
- Authoring APIs may still shift, with the change named in the upgrade notes.
- Schema changes ship as additive `add_*` migrations; one consolidation at 1.0.
- Unknown read modes, verbs, and config values **throw** rather than falling
  back — an error that names its replacement beats a silent default.

## Licensing

MIT, and everything MIT today stays MIT. The core is complete on its own —
recording, reads, aggregation, curation, and the payload contract. Paid
companions like `storyfeed/ui` add convenience on top; they never take anything
away, and a feed built on the core alone keeps working exactly as it does now.
