# Testing

`Storyfeed::fake()` captures activities instead of saving them, so a test can
assert what was published. Coverage assertions fail the suite when an activity
or a group has no headline.

## Faking the Feed

```php
// tests/Feature/FeedTest.php
Storyfeed::fake();

// … exercise your code …

Storyfeed::assertPublished('place', $order);
Storyfeed::assertPublishedCount(3, 'place');
Storyfeed::assertNotPublished('delete');
Storyfeed::assertNothingPublished();
```

| Method |  |
|---|---|
| `assertPublished($verb, $object = null)` | a matching activity was published |
| `assertNotPublished($verb, $object = null)` | none was |
| `assertPublishedCount($n, $verb = null)` | exactly `$n` |
| `assertNothingPublished()` | nothing at all |
| `published($verb = null)` | the captured activities, for custom assertions |

Each accepts a closure in place of the verb. The fake uses your real
registries, so grammar and axes behave as configured.

## Coverage Assertions

These fail the suite when an activity type has no headline, which would
otherwise render as a blank line.

```php
// tests/Feature/FeedTest.php
use Storyfeed\Testing\GrammarCoverage;

GrammarCoverage::assertCoversRecorded();          // every verb/type pair in the DB has grammar
GrammarCoverage::assertCoversPublished();         // every pair published in this test
GrammarCoverage::assertCoversAggregates();        // every group that formed has aggregate grammar
GrammarCoverage::assertCoversPossibleAggregates(); // every axis that COULD form, whether it did or not
GrammarCoverage::assertCovers([['order', 'place']]);
GrammarCoverage::assertCoversAggregateMatrix(
    axes: ['repeat', 'actors'],
    verbs: ['place', 'ask'],
);
```

Prefer `assertCoversPossibleAggregates()`: it checks every group your axes
*could* form, so it catches gaps before real traffic does. The matrix variant
asserts a grid you choose.

```php
// tests/Feature/FeedTest.php
use Storyfeed\Testing\StorySurface;

StorySurface::assertNoUnwiredSurface();
StorySurface::assertNoUnwiredSurface(except: [Kitchen::class]);
```

This fails for a model that appears in your feed but that nothing publishes
about. It works under the fake, and passes when there is no data.

## Diagnostics in CI

```bash
php artisan storyfeed:doctor --fail-on=warning   # exits non-zero on a warning or an error
```

Add `--json` for structured findings. See [Doctor](/reference/doctor).

## Static Analysis

The package ships a PHPStan rule that checks each `Feed::make()` call against
the constructor of the feed class it builds:

```
CustomerFeed::make() invoked with 0 arguments, 1 required —
CustomerFeed::__construct() declares ($order). A Feed takes its subject
through the constructor, so this is an unscoped feed: it would throw
ArgumentCountError on the first call.
```

It installs through `phpstan/extension-installer` with no configuration. It
checks the argument count only, and stays quiet where it cannot be certain:
spread arguments, named arguments, `static::make()`, abstract classes.
