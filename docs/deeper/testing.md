# Testing

`Storyfeed::fake()` captures activities instead of saving them, so a test can
assert what was published. Coverage assertions fail the suite when an activity
or a group has no headline.

## Faking the Feed

```php
// tests/Feature/FeedTest.php
use Storyfeed\Facades\Storyfeed;

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

Methods with a `$verb` argument also accept a closure there. The fake uses
your real registries, but writes no snapshots or groupings and dispatches no
`ActivityPublished` event.

## Coverage Assertions

These fail the suite when an activity type has no headline, which would
otherwise render as a blank line.

```php
// tests/Feature/FeedTest.php
use App\Models\Order;
use Storyfeed\Testing\GrammarCoverage;

// every verb/type pair in the DB has grammar
GrammarCoverage::assertCoversRecorded();
// every pair published in this test
GrammarCoverage::assertCoversPublished();
// every group that formed has aggregate grammar
GrammarCoverage::assertCoversAggregates();
// every axis that COULD form, whether it did or not
GrammarCoverage::assertCoversPossibleAggregates();
GrammarCoverage::assertCovers([['order', 'place']]);
GrammarCoverage::assertCoversAggregateMatrix(
    axes: ['repeat', 'actors'],
    verbs: ['place', 'ask'],
    objectTypes: [Order::class],
);
```

Prefer `assertCoversPossibleAggregates()`: it checks every group your axes
*could* form, so it catches gaps before real traffic does. The matrix variant
asserts a grid you choose.

A group headline on a type, as a [Story class](/deeper/stories) writes it, is
kept under that type's key: `repeat.order.place`. On an axis that groups one
type, such as `repeat`, `assertCoversPossibleAggregates()` checks each type the
verb was recorded with, and `assertCoversAggregateMatrix()` checks each type in
`objectTypes:`, as model classes or morph aliases. One type's headline does not
cover another's. Without `objectTypes:`, the matrix checks the verb alone. A
missing headline is named by its key:

```txt
Storyfeed aggregate grammar coverage is incomplete:
  - repeat.order.place (no aggregate headline)
  - actors.place (no aggregate headline)
```

```php
// tests/Feature/FeedTest.php
use App\Models\Kitchen;
use Storyfeed\Testing\StorySurface;

StorySurface::assertNoUnwiredSurface();
StorySurface::assertNoUnwiredSurface(except: [Kitchen::class]);
```

This fails for a `Feedable` model that nothing publishes about, and for one the
enforced morph map has no alias for (see
[Surface](/reference/doctor#surface)). It also fails when the check cannot run, and when no activities are recorded,
because then there is nothing to judge. It works under the fake.

## Diagnostics in CI

```bash
# exits non-zero on a warning or an error
php artisan storyfeed:doctor --fail-on=warning
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
