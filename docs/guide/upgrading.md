# Upgrading

Storyfeed is pre-1.0. Breaking changes are named here with their replacement.

## Before you upgrade

```bash
# A caret constraint on 0.x stops at the next minor, so an upgrade names it.
composer require storyfeed/storyfeed:^0.9
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

## v0.8.0-alpha.2 — `query()` callbacks are nested

Two behaviour changes. Neither has a rename to chase; both change what a read
returns.

### A `query()` callback can no longer widen a feed

Callbacks used to be applied at the top level of the candidate query. Because
`AND` binds tighter than `OR`, a callback whose first move was `orWhere` became
a sibling of everything the builder had already applied:

```sql
-- before: the OR escapes the scope and the publish gate
where (published and involving and yours) or (their other thing)
```

Such a feed could return **unpublished activities**, including ones scheduled
for later, and **activities outside the scope it asked for** — another tenant's,
another model's — on a page that looked entirely correct. The counts agreed,
because they recomputed against the same widened set.

Every callback is now wrapped in its own group. What that does to your SQL:

| your feed | change |
|---|---|
| no `query()` callback | byte-identical |
| callbacks that only `AND` | form only — `and not "verb" = ?` becomes `and (not "verb" = ?)` |
| a callback with a top-level `orWhere` | **meaning changes** — the OR is confined to the callback's own group, which then ANDs against the publish gate, the scope and any verb allowlist |

Only the third case moves. If a page depended on it, it depended on reaching
past its own scope; read the wider set deliberately instead, with a second read
or a callback that names it inside its own closure.

`v0.8.0-alpha.1` nested callbacks only when a verb allowlist was active, so
whether a callback was confined depended on whether something else in the feed
had called `only()`. It is unconditional now.

### A `Feed` class locks the role it binds

Rebinding the subject of a scoped [feed class](/basics/named-feeds#feed-classes)
throws `FeedMisconfigured` instead of silently replacing it:

```php
CustomerFeed::make($order)->context($other);   // throws
CustomerFeed::make($order)->only(['order.placed'])->summary();   // fine
```

A role filter is a single-slot assignment, so the second call used to win — and
it won quietly, in the one dimension that fails open. Narrowing is untouched.
This reaches only `Feed` classes: plain builders, closure presets and
`$model->storyfeed()` behave as they always did.

### The AS2.0 collection route is gone

`GET /{prefix}/feed` is **removed**, not deprecated. It served every published
activity in the system, unscoped and with no verb allowlist, so an app that
enabled the AS2.0 routes published its whole activity table. The single-activity
route stays. See [Activity Streams 2.0](/deeper/activity-streams).

If you were serving it, the collection **shape** is unchanged and still
available: `CollectionSerializer::collection($page, $iri, $cursor)` takes the
activities and the IRI from you, so the query is yours to scope.

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
