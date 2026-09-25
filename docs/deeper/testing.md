# Testing

## Introduction

`Storyfeed::fake()` captures activities instead of saving them, so you can
assert what your application publishes. Coverage assertions check that your
recorded activities and possible groups have headlines.

<a id="faking-the-feed"></a>

## Faking Activities

Fake Storyfeed before calling the code under test. This test exercises the
listener from [Publishing From Events](/deeper/events#publishing-from-a-listener),
using your application's model factories:

```php memo="tests/Feature/RecordOrderPlacedTest.php"
use App\Events\OrderPlaced;
use App\Listeners\RecordOrderPlaced;
use App\Models\Shop;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Storyfeed\Facades\Storyfeed;

uses(RefreshDatabase::class);

it('records the placed order', function () {
    $customer = User::factory()->create();
    $order = Order::factory()->for(Shop::factory())->create();

    Storyfeed::fake();

    (new RecordOrderPlaced)->handle(new OrderPlaced($order, $customer));

    Storyfeed::assertPublished('place', $order);
    Storyfeed::assertPublishedCount(1);
    Storyfeed::assertNotPublished('delete');
});
```

### Asserting Published Activities

| Method | Assertion |
|---|---|
| `assertPublished($verb, $object = null)` | a matching activity was published |
| `assertNotPublished($verb, $object = null)` | none was |
| `assertPublishedCount($n, $verb = null)` | exactly `$n` activities were published |
| `assertNothingPublished()` | nothing was published |

Methods with a `$verb` argument also accept a closure for matching activity
attributes. Use `assertNothingPublished()` in a test whose action should record
nothing, rather than after asserting a successful publication.

### Inspecting Captured Activities

`published($verb = null)` returns the captured activities for custom assertions.
Continue the listener test with:

```php memo="tests/Feature/RecordOrderPlacedTest.php" at="Inside the test"
$activity = Storyfeed::published('place')->sole();

expect((string) $activity->actor_id)->toBe((string) $customer->getKey());
```

> [!NOTE]
> The fake uses your real registries and story middleware, but writes no
> snapshots or groupings and dispatches no `ActivityPublished` event. Use a
> database-backed test without this fake to check persistence or grouped reads.

## Testing Queued and Event Publishing

Queued activities are captured separately from synchronous publications. For
a controller that ends its builder with `queue()`, assert the queued activity:

```php memo="tests/Feature/QueuedOrderTest.php"
use App\Http\Controllers\PlaceOrderController;
use App\Models\Shop;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

uses(RefreshDatabase::class);

it('queues the placed order', function () {
    $customer = User::factory()->create();
    $order = Order::factory()->for(Shop::factory())->create();
    $request = Request::create('/orders/'.$order->getKey().'/place', 'POST');
    $request->setUserResolver(fn () => $customer);

    Storyfeed::fake();

    // Use the controller from Queued Publishing, which calls queue().
    (new PlaceOrderController)($request, $order);

    Storyfeed::assertQueued('place', $order);
    Storyfeed::assertQueuedCount(1);
    Storyfeed::assertNothingPublished();
});
```

The [queued controller](/deeper/queues#queueing-activities) also uses the
application's `orders.show` route for its redirect.

| Method | Purpose |
|---|---|
| `assertQueued($verb, $object = null)` | asserts a queued activity; also accepts a queued Story class or a predicate |
| `assertNotQueued($verb, $object = null)` | asserts no match was queued |
| `assertQueuedCount($n, $verb = null)` | counts queued activities |
| `assertNothingQueued()` | asserts no activities or Story classes were queued |
| `queued($verb = null)` | returns captured queued activities |

The fake sends no job to the queue. For a queued Story class, it calls
`toFeedActivity()` during the test and captures the result.

To test publishing from an application event, dispatch the event while
Storyfeed is faked, then use `assertPublished()` or `assertQueued()` for its
publication path. Leave that application event unfaked so its listeners run.

To test that an `ActivityPublished` listener is queued, use Laravel's
`Queue::fake()` without `Storyfeed::fake()`. The publication must run normally
to dispatch that event after the transaction commits.

<a id="coverage-assertions"></a>

## Testing Headline Coverage

### Activity Headlines

Check the type and verb pairs your application records:

```php memo="tests/Feature/FeedCoverageTest.php" at="After exercising the application"
use Storyfeed\Testing\GrammarCoverage;

GrammarCoverage::assertCoversRecorded();  // Pairs in the database.
GrammarCoverage::assertCoversPublished(); // Pairs published in this test.
```

### Possible Groups

Check both groups that formed and groups the configured axes could form:

```php memo="tests/Feature/FeedCoverageTest.php" at="After exercising the application"
use Storyfeed\Testing\GrammarCoverage;

GrammarCoverage::assertCoversAggregates();
GrammarCoverage::assertCoversPossibleAggregates();
```

`assertCoversPossibleAggregates()` checks possible groups before real traffic
forms them. A type-specific headline such as `repeat.order.place` covers that
type only. For axes that hold one type, the assertion checks each type recorded
with the verb.

### Explicit Coverage Matrices

Choose a set of activities and group combinations explicitly:

```php memo="tests/Feature/FeedCoverageTest.php"
use App\Models\Order;
use Storyfeed\Testing\GrammarCoverage;

GrammarCoverage::assertCovers([['order', 'place']]);
GrammarCoverage::assertCoversAggregateMatrix(
    axes: ['repeat', 'actors'],
    verbs: ['place', 'ask'],
    objectTypes: [Order::class],
);
```

`objectTypes` accepts model classes or morph aliases. Without it, the matrix
checks the verb alone. A missing headline is named by its key:

```text
Storyfeed aggregate grammar coverage is incomplete:
  - repeat.order.place (no aggregate headline)
  - actors.place (no aggregate headline)
```

## Testing Feedable Coverage

```php memo="tests/Feature/FeedCoverageTest.php" at="After exercising the application"
use App\Models\Shop;
use Storyfeed\Testing\StorySurface;

StorySurface::assertNoUnwiredSurface();
// Or exclude models intentionally absent from this application's feed:
StorySurface::assertNoUnwiredSurface(except: [Shop::class]);
```

This fails for a `Feedable` model that nothing publishes about, and for one the
enforced morph map has no alias for. See [Surface](/reference/doctor#surface).
It also fails when the check cannot run or no activities are recorded. It
works under the fake.

<a id="diagnostics-in-ci"></a>

## Running Diagnostics in CI

```shell
php artisan storyfeed:doctor --fail-on=warning # Fails on a warning or an error.
```

Add `--json` for structured findings. See [Diagnosing Your Feed](/deeper/diagnosing#running-the-doctor-in-ci).

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

`StoryNameRule` also checks literal names passed to `story()`,
`Storyfeed::route()` and `Story::has()` against the booted application's story
names. It skips dynamic names and runs without findings when no application
registry is available.
