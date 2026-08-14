# Upgrading

Storyfeed is pre-1.0. Breaking changes are named here with their replacement.

## Before you upgrade

```bash
composer update storyfeed/storyfeed
php artisan vendor:publish --tag="storyfeed-migrations"
php artisan migrate
php artisan storyfeed:doctor

# If you verify with your test suite, clear cached config first — it overrides
# phpunit.xml and can drop a seeded database.
php artisan optimize:clear
```

::: warning Republishing migrations
Publishing is additive — new `add_*` files appear, existing ones are untouched.
If you published before v0.5, check for a duplicate column migration and
[read the schema note](/reference/schema#if-you-published-before-v0-5) before
deploying. Verify with `migrate:fresh` locally, never on the deploy.
:::

## v0.7 — scoped feeds: `involving()`

`FeedBuilder::for()` is now **`involving()`**, and it spans all four roles —
actor, object, target and context:

```php
Storyfeed::feed()->for($project);        // → ->involving($project)
```

The old name threw two meanings at once: on the recording side `for()` sets the
*target*, on the read side it filtered by *any* role. It now throws and names
its replacement.

`involving()` reads a new materialized index, so this upgrade has a required
step:

```bash
php artisan vendor:publish --tag="storyfeed-migrations"
php artisan migrate
php artisan storyfeed:participants   # one-time backfill for existing history
```

Until the backfill runs, `involving()` returns nothing for activities recorded
before the table existed. `storyfeed:doctor` reports it as
`participants.unindexed`.

Worth re-checking your entity pages while you are here: if one scopes by
`context()`, it is omitting that entity's own lifecycle — "project created"
records the project as the object, not the context.

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

If your UI exposes modes in a query string, translate old values; a stale
bookmark otherwise falls through to the default.

## v0.6 — aggregation

- **Axes formalized.** Custom axes need no package edits; hashes are unchanged
  for the built-ins, so no payload change.
- **Composites.** `Collectable` models bundle at batch close. Author **both**
  `composite.{verb}` aggregate grammar and `*.{verb}` singular grammar for the
  parent — see [Grammar](/deeper/grammar#composite-parents-need-verb).
- **Null-headline groups became reachable.** A group with no safe headline now
  arrives with both `headline_template` and `headline` null. A last-resort branch
  that composes prose from node entities will name one actor over a many-actor
  group — see [Rendering](/basics/rendering#null-headline-groups).
- **`sync_token`** added to the envelope. Store and compare it; on change, drop
  accumulated nodes and refetch.

## v0.5 — the Story layer

`Storyfeed\Story` classes and `make:story` replace hand-authoring seven
registries per activity type. The registries remain supported — Stories compile
into them.

Nothing to migrate: existing registry calls keep working, and you can move
types over one at a time.
