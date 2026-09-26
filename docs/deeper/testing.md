# Testing

## Introduction

`Storyfeed::fake()` captures activities instead of saving them, so you can
assert what your application publishes. Coverage assertions check that your
recorded activities and possible groups have headlines.

<a id="faking-the-feed"></a>

## Faking Activities

Call `Storyfeed::fake()` before running the code under test. This test uses
your application's model factories and dispatches the event from
[Publishing From Events](/deeper/events#publishing-from-an-event):

```php memo="tests/Feature/RecordOrderPaidTest.php"
use App\Events\OrderPaid;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Storyfeed\Facades\Storyfeed;

uses(RefreshDatabase::class);

it('records the paid order', function () {
    $order = Order::factory()->create();

    Storyfeed::fake();

    OrderPaid::dispatch($order);

    Storyfeed::assertPublished('pay', $order);
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

Methods with a `$verb` argument also accept a closure to match activity
attributes. Use `assertNothingPublished()` when the tested action should
record no activities.

### Inspecting Captured Activities

`published($verb = null)` returns the captured activities for custom assertions.
Continue the test with:

```php memo="tests/Feature/RecordOrderPaidTest.php" at="Inside the test"
$activity = Storyfeed::published('pay')->sole();

expect((string) $activity->object_id)->toBe((string) $order->getKey());
```

> [!NOTE]
> The fake uses your registries and story middleware but saves no activities
> and dispatches no `ActivityPublished` event. Grouped queries and model
> snapshots therefore exclude captured activities. Test persistence and
> grouping against the database without this fake.

## Testing Queued and Event Publishing

The fake captures queued activities separately. For the
[queued controller](/deeper/queues#queueing-activities), which calls `queue()`,
assert that the activity was queued:

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

    (new PlaceOrderController)($request, $order);

    Storyfeed::assertQueued('place', $order);
    Storyfeed::assertQueuedCount(1);
    Storyfeed::assertNothingPublished();
});
```

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
use Storyfeed\Testing\HeadlineCoverage;

HeadlineCoverage::assertCoversRecorded();  // Pairs in the database.
HeadlineCoverage::assertCoversPublished(); // Pairs published in this test.
```

### Possible Groups

Check existing groups and groups the configured rules could form:

```php memo="tests/Feature/FeedCoverageTest.php" at="After exercising the application"
use Storyfeed\Testing\HeadlineCoverage;

HeadlineCoverage::assertCoversGroups();
HeadlineCoverage::assertCoversPossibleGroups();
```

Use `assertCoversPossibleGroups()` to check headline coverage before traffic
forms the groups. A headline such as `repeat.order.place` covers only orders.
For groups limited to one type, the assertion checks each type recorded with
the verb.

### Explicit Coverage Matrices

Choose a set of activities and group combinations explicitly:

```php memo="tests/Feature/FeedCoverageTest.php"
use App\Models\Order;
use Storyfeed\Testing\HeadlineCoverage;

HeadlineCoverage::assertCovers([['order', 'place']]);
HeadlineCoverage::assertCoversAggregateMatrix(
    axes: ['repeat', 'actors'],
    verbs: ['place', 'ask'],
    objectTypes: [Order::class],
);
```

`objectTypes` accepts model classes or morph aliases. Without it, the matrix
checks the verb alone. A missing headline is named by its key:

```text
Storyfeed group headline coverage is incomplete:
  - repeat.order.place (no group headline)
  - actors.place (no group headline)
```

## Testing Feedable Coverage

Check that each `Feedable` model is referenced by an activity or has a
headline defined for its type:

```php memo="tests/Feature/FeedCoverageTest.php" at="After exercising the application"
use App\Models\Shop;
use Storyfeed\Testing\StorySurface;

StorySurface::assertNoUnwiredSurface();
// Or exclude models intentionally absent from this application's feed:
StorySurface::assertNoUnwiredSurface(except: [Shop::class]);
```

The assertion also fails if a `Feedable` model lacks an enforced morph alias,
the check cannot run, or no activities are recorded. It works with the fake.
See [Surface](/reference/doctor#feedable-models).

<a id="diagnostics-in-ci"></a>

## Running Diagnostics in CI

The doctor can fail a CI build on its findings. See
[Running the Doctor in CI](/deeper/diagnosing#running-the-doctor-in-ci).

## Static Analysis

Storyfeed ships a PHPStan rule that checks each `Feed::make()` call against
the constructor of the feed class it builds:

```
CustomerFeed::make() invoked with 0 arguments, 1 required —
CustomerFeed::__construct() declares ($order). A Feed takes its subject
through the constructor, so this is an unscoped feed: it would throw
ArgumentCountError on the first call.
```

The rule installs through `phpstan/extension-installer` without configuration.
It checks argument counts, skipping spread arguments, named arguments,
`static::make()`, and abstract classes where it cannot determine the count.

The same extension checks story names. See
[Checking Names With Static Analysis](/deeper/named-stories#checking-names-with-phpstan).
