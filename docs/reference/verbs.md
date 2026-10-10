# Verb Vocabulary

## Introduction

`Storyfeed\Act` provides common verbs as backed enum cases. Each stores an
English verb, such as `accept`, and maps it to an Activity Streams 2.0 type,
such as `Accept`.

Verbs are free-form strings, so you may use your own names, enum cases, or both.

<span id="the-vocabulary"></span>

## Available Verbs

The verbs below are grouped by Activity Streams type. Case names start
with a capital letter: `Act::TentativelyAccept` stores `tentativelyAccept`.

| Activity type | Verbs |
| --- | --- |
| `Create` | `create`, `upload`, `draft` |
| `Update` | `update`, `rename`, `amend`, `correct`, `supersede`, `complete`, `confirm`, `cancel`, `begin`, `end`, `pause`, `resume`, `extend`, `shorten`, `enable`, `disable` |
| `Delete` | `delete`, `discard` |
| `Undo` | `undo`, `restore`, `reinstate`, `revert`, `void`, `withdraw` |
| `Add` | `add`, `attach`, `apply`, `record` |
| `Remove` | `remove`, `retire`, `archive`, `release`, `detach` |
| `Join` | `join`, `pair` |
| `Leave` | `leave` |
| `Offer` | `offer`, `send`, `propose`, `request` |
| `Invite` | `invite` |
| `Accept` | `accept`, `agree` |
| `Reject` | `reject`, `decline` |
| `TentativeAccept` | `tentativelyAccept` |
| `TentativeReject` | `tentativelyReject` |
| `View` | `view`, `open` |
| `Read` | `read`, `download` |
| `Listen` | `listen` |
| `Announce` | `announce`, `remind` |
| `Question` | `ask` |
| `Flag` | `flag` |
| `Like` | `like` |
| `Dislike` | `dislike` |
| `Follow` | `follow` |
| `Ignore` | `ignore` |
| `Block` | `block` |
| `Arrive` | `arrive` |
| `Travel` | `travel` |
| `Move` | `move` |

All verbs use present tense, such as `send`. The enum covers all 28 Activity
Streams activity types.

<span id="recording-with-a-verb"></span>

For example, `Act::Accept` stores `accept` and serializes as
`"type": "Accept"` with `"sf:verb": "accept"`.
[Activity Verbs](/basics/verbs) shows how to record with an enum case.

<span id="registering-the-verbs-you-use"></span>

## Registering Verbs

Pass a verb-to-type map to `Storyfeed::verbs()`. Use `Act::only()` to build
the map from the cases your application records:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Act;
use Storyfeed\Facades\Storyfeed;

Storyfeed::verbs(
    Act::only(
        Act::Create, Act::Update, Act::Accept, Act::Archive,
    ),
);
```

Register only the verbs your application records. Registering all 67 cases
produces a `verbs.dead` finding for each unused verb.

<span id="using-your-own-words"></span>

## Using Application Verbs

Register custom verbs as strings or in an enum implementing `FeedVerb`.

Domain actions such as `reply`, `settle`, `deliver`, `approve`, and `sign` are
application-owned verbs. Register their Activity Streams types explicitly.

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Storyfeed;

Storyfeed::verbs([
    'plate' => ActivityType::Create,
    'reply' => ActivityType::Create,
    'deliver' => ActivityType::Create,
    'settle' => ActivityType::Update,
    'approve' => ActivityType::Accept,
    'sign' => ActivityType::Accept,
]);
```

<span id="mixing-an-enum-with-the-shipped-cases"></span>

## Combining Verb Enums

`Storyfeed::verbs()` merges registrations by default, so both vocabularies remain available.

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use App\Enums\ShopActivity;
use Storyfeed\Act;
use Storyfeed\Facades\Storyfeed;

Storyfeed::verbs(Act::only(Act::Create, Act::Confirm));
Storyfeed::verbs(ShopActivity::class);
```

### Replacing the Registered Verbs

Pass `merge: false` to replace every registered verb, the shipped defaults
included, with the given map:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use App\Enums\ShopActivity;
use Storyfeed\Facades\Storyfeed;

Storyfeed::verbs(ShopActivity::class, merge: false);
```

## Verb Enums

A backed string enum that implements `Storyfeed\Contracts\FeedVerb` can be
registered with `Storyfeed::verbs(ShopActivity::class)` and passed wherever a
verb is accepted. See [Publishing From an Enum Case](/basics/verbs#publishing-from-an-enum-case).

### The `FeedVerb` Contract

| Method | Returns |
|---|---|
| `verb()` | the verb string stored on the activity |
| `activityType()` | an `ActivityType` case, an extension type string kept as given, or `null` |

When `activityType()` returns `null`, registering the enum maps the case to the
type of the [default verb](#unregistered-verbs) with the same name, or to
`Activity` when there is none.

### `AsFeedVerb` Methods

The `Storyfeed\Concerns\AsFeedVerb` trait implements the contract: `verb()`
returns the case's value and `activityType()` returns `null`. Override
`activityType()` to declare a type. The trait also adds these methods to each
case:

| Method | Returns |
|---|---|
| `of($object = null)` | a `PendingActivity` with this verb and the object |
| `anonymous($object = null)` | the same, with no actor recorded |
| `publish($object = null)` | the published `Activity` |
| `record(object:, actor:, target:, …)` | the published `Activity`; takes the named arguments of `Storyfeed::record()`, except `verb` and `anonymous` |
| `by()`, `to()`, `object()`, `data()`, and the other `PendingActivity` methods | a `PendingActivity` with this verb, after calling that method on it |

## Unregistered Verbs

Storyfeed registers these 29 verbs without a `Storyfeed::verbs()` call:

| Activity type | Verbs |
| --- | --- |
| `Accept` | `accept` |
| `Add` | `add` |
| `Announce` | `announce`, `share` |
| `Arrive` | `arrive` |
| `Block` | `block` |
| `Create` | `create` |
| `Delete` | `delete` |
| `Dislike` | `dislike` |
| `Flag` | `flag` |
| `Follow` | `follow` |
| `Ignore` | `ignore` |
| `Invite` | `invite` |
| `Join` | `join` |
| `Leave` | `leave` |
| `Like` | `like` |
| `Listen` | `listen` |
| `Move` | `move` |
| `Offer` | `offer` |
| `Question` | `question` |
| `Read` | `read` |
| `Reject` | `reject` |
| `Remove` | `remove` |
| `TentativeAccept` | `tentativeAccept` |
| `TentativeReject` | `tentativeReject` |
| `Travel` | `travel` |
| `Undo` | `undo` |
| `Update` | `update` |
| `View` | `view` |

Publishing any other verb before it is registered depends on
[`verbs.strict`](/reference/configuration#verbs):

| `verbs.strict` | Result |
|---|---|
| `true`, or `null` in the `local` and `testing` environments | throws `Storyfeed\Exceptions\UnknownVerb` |
| `false`, or `null` in other environments | publishes; the activity serializes as `"type": "Activity"` |

A verb containing a dot throws `Storyfeed\Exceptions\DottedVerb` when it is
registered, declared or published, whatever `verbs.strict` says. See
[Naming Verbs](/cookbook/choosing-a-verb#naming-a-verb).
