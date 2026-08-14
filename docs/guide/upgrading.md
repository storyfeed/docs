# Upgrading

Storyfeed is pre-1.0. Breaking changes are named here with their replacement.

## Before you upgrade

```bash
composer update storyfeed/storyfeed
php artisan vendor:publish --tag="storyfeed-migrations"
php artisan migrate
php artisan storyfeed:doctor
```

::: warning REPUBLISHING MIGRATIONS
Publishing is additive — new `add_*` files appear, existing ones are untouched.
If you published before v0.5, check for a duplicate column migration and
[read the schema note](/reference/schema#if-you-published-before-v0-5) before
deploying. Verify with `migrate:fresh` locally, never on the deploy.
:::

::: warning DON'T RUN `optimize` FIRST
If you verify with your test suite, do **not** run `php artisan optimize`
beforehand — cached config overrides `phpunit.xml` and can drop a seeded
database. Run `php artisan optimize:clear` first. See
[Testing](/deeper/testing#optimize-before-a-test-run-wipes-a-seeded-database).
:::

## v0.7 — read modes renamed

`flat` / `grouped` / `curated` → **`log`** / **`live`** / **`summary`**. The
default is `summary`; `curated` is reserved for a future relevance-ranked view.

```php
Storyfeed::feed()->flat();      // → ->log()
Storyfeed::feed()->grouped();   // → ->live()
Storyfeed::feed()->curated();   // → ->summary()
```

```php
'grouping' => ['default' => 'summary'],   // 'curated' now throws
```

API-only: mode names never appeared in the payload or in cursors, so no client
change is required. The old values throw and name their replacement rather than
falling back to a default.

If your UI exposes modes in a query string, translate old values rather than
letting a stale bookmark fall through to the default — showing the wrong view
silently is worse than an error.

## v0.6 — aggregation

- **Axes formalized.** Custom axes need no package edits; hashes are unchanged
  for the built-ins, so no payload change.
- **Composites.** `Collectable` models bundle at batch close. Author **both**
  `composite.{verb}` aggregate grammar and `*.{verb}` singular grammar for the
  parent — see [Grammar](/deeper/grammar#composite-parents-need-verb).
- **Null-headline groups became reachable.** A group with no safe headline now
  arrives with both `headline_template` and `headline` null. Audit any
  last-resort branch in your renderer that composes prose from node entities:
  written for singletons, it announces one actor over a many-actor group.
- **`sync_token`** added to the envelope. Store and compare it; on change, drop
  accumulated nodes and refetch.

## v0.5 — the Story layer

`Storyfeed\Story` classes and `make:story` replace hand-authoring seven
registries per activity type. The registries remain supported — Stories compile
into them.

Nothing to migrate: existing registry calls keep working, and you can move
types over one at a time.
