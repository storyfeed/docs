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
use App\Models\Order;
use App\Models\Shop;
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
to dispatch that event after the transaction commits. Role IDs in the event
payload are strings when non-null, so listener assertions should compare with
`'1'`, not `1`.

## Muting Recording in Tests

To keep a suite from writing activities, set `STORYFEED_RECORDING_ENABLED` to
`false` in `phpunit.xml`:

```xml memo="phpunit.xml"
<php>
    <env name="STORYFEED_RECORDING_ENABLED" value="false"/>
</php>
```

Every `publish()` then returns an unsaved activity and dispatches no event.
`Storyfeed::fake()` still captures activities while recording is off. Opt the
tests that assert on real feed rows back in with the `RecordsStories` trait:

```php memo="tests/Pest.php"
use Storyfeed\Testing\RecordsStories;

uses(RecordsStories::class)->in('Feature/Feed');
```

In a suite that records, the `WithoutRecording` trait mutes one test file
instead:

```php memo="tests/Feature/ImportMenuTest.php"
use Storyfeed\Testing\WithoutRecording;

uses(WithoutRecording::class);
```

While recording is off, `Feedable` models also stop refreshing their snapshots
on save. To switch recording for part of a test, call the facade:

| Method | Effect |
|---|---|
| `Storyfeed::withoutRecording($callback)` | runs the callback with recording off, then restores the previous state |
| `Storyfeed::recording($callback)` | runs the callback with recording on, then restores the previous state |
| `Storyfeed::stopRecording()` | turns recording off for the rest of the process |
| `Storyfeed::startRecording()` | turns recording on for the rest of the process |
| `Storyfeed::isRecording()` | returns whether activities are being written |

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

When [`storyfeed:doctor`](/deeper/diagnosing) reports a missing headline or
icon, the finding names the assertion that guards it:
`assertCoversRecorded()` for an activity's headline or icon, and
`assertCoversGroups()` for a group headline.

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
the check cannot run, or no activities are recorded. It also works under `Storyfeed::fake()`.
See [Surface](/reference/doctor#feedable-models).

## Testing Feed Audiences

`FeedAudience` asserts which verbs a [named feed](/basics/named-feeds) shows:

```php memo="tests/Feature/FeedAudienceTest.php"
use Storyfeed\Testing\FeedAudience;

it('shows the kitchen only order verbs', function () {
    FeedAudience::assertAllows('kitchen', ['place', 'confirm']);
    FeedAudience::assertRefuses('kitchen', 'reprice');
    FeedAudience::assertAllowsOnly('kitchen', ['place', 'confirm', 'ready']);
});
```

| Method | Assertion |
|---|---|
| `assertAllows($feed, $verbs)` | the feed shows every one of the verbs |
| `assertRefuses($feed, $verbs)` | the feed shows none of the verbs |
| `assertAllowsOnly($feed, $verbs)` | the feed shows every one of the verbs and no other verb the application declares with `Storyfeed::verbs()` or has recorded |

Each method accepts one verb, an array of verbs, or verb enums. The assertions
read the feed's `only()` and `except()` declarations, so they work with or
without `Storyfeed::fake()`. A verb removed inside a `query()` callback is not
visible to them; assert that over the feed's payload. `assertAllowsOnly()`
fails when no verbs are declared or recorded.

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
