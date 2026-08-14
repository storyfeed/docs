# Testing

## Faking the feed

```php
Storyfeed::fake();

// … exercise your code …

Storyfeed::assertPublished('upload', $document);
Storyfeed::assertPublishedCount(3, 'upload');
Storyfeed::assertNotPublished('delete');
Storyfeed::assertNothingPublished();
```

| method | |
|---|---|
| `assertPublished($verb, $object = null)` | a matching activity was published |
| `assertNotPublished($verb, $object = null)` | none was |
| `assertPublishedCount($n, $verb = null)` | exactly `$n` |
| `assertNothingPublished()` | nothing at all |
| `published($verb = null)` | the captured activities, for custom assertions |

Each accepts a closure instead of a verb for arbitrary matching. The fake
inherits your real registries, so grammar and axes behave as configured.

## Coverage assertions

These fail your suite when the grammar stops keeping up with the app — the
failure mode where a feed silently renders blank lines for new activity types.

```php
use Storyfeed\Testing\GrammarCoverage;

GrammarCoverage::assertCoversRecorded();          // every verb/type pair in the DB has grammar
GrammarCoverage::assertCoversPublished();         // every pair published in this test
GrammarCoverage::assertCoversAggregates();        // every group that formed has aggregate grammar
GrammarCoverage::assertCoversPossibleAggregates(); // every axis that COULD form, whether it did or not
GrammarCoverage::assertCovers([['document', 'upload']]);
GrammarCoverage::assertCoversAggregateMatrix(
    axes: ['repeat', 'actors'],
    verbs: ['upload', 'comment'],
);
```

`assertCoversPossibleAggregates()` is the mechanical one to prefer: it asks
what your registered axes *could* produce, so it catches gaps before traffic
finds them. The matrix variant is for asserting a specific grid deliberately.

```php
use Storyfeed\Testing\StorySurface;

StorySurface::assertNoUnwiredSurface();
StorySurface::assertNoUnwiredSurface(except: [Client::class]);
```

That one flags models that appear in your feed but that nothing publishes
about. It is fake-aware, and with no data it reports nothing to diagnose.

## `optimize` before a test run wipes a seeded database

::: warning
`php artisan optimize` caches config, and cached config overrides
`phpunit.xml` — so the suite runs against your real database and
`RefreshDatabase` drops it. The symptom is a pile of *unrelated* failures
(auth 419s, missing notifications) that reads like a broken migration.

Run `php artisan optimize:clear` (or `storyfeed:clear`) before testing.
:::

## Diagnostics in CI

```bash
php artisan storyfeed:doctor --json
```

Exit status and structured findings make doctor usable as a CI gate. See
[Doctor](/reference/doctor).
