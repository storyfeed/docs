# Verb Vocabulary

## Introduction

`Storyfeed\Act` provides common verbs as backed enum cases. Each stores an
English verb, such as `approve`, and maps it to an Activity Streams 2.0 type,
such as `Accept`.

Verbs are free-form strings, so you may use your own names, enum cases, or both.

<span id="the-vocabulary"></span>

## Available Verbs

The 72 verbs below are grouped by Activity Streams type. Case names start
with a capital letter: `Act::TentativelyAccept` stores `tentativelyAccept`.

| Activity type | Verbs |
| --- | --- |
| `Create` | `create`, `upload`, `draft`, `reply`, `deliver` |
| `Update` | `update`, `rename`, `amend`, `correct`, `supersede`, `complete`, `confirm`, `cancel`, `begin`, `end`, `pause`, `resume`, `extend`, `shorten`, `enable`, `disable`, `settle` |
| `Delete` | `delete`, `discard` |
| `Undo` | `undo`, `restore`, `reinstate`, `revert`, `void`, `withdraw` |
| `Add` | `add`, `attach`, `apply`, `record` |
| `Remove` | `remove`, `retire`, `archive`, `release`, `detach` |
| `Join` | `join`, `pair` |
| `Leave` | `leave` |
| `Offer` | `offer`, `send`, `propose`, `request` |
| `Invite` | `invite` |
| `Accept` | `accept`, `approve`, `agree`, `sign` |
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

For example, `Act::Approve` stores `approve` and serializes as
`"type": "Accept"` with `"sf:verb": "approve"`.
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
        Act::Create, Act::Update, Act::Approve, Act::Archive,
    ),
);
```

Register only the verbs your application records. Registering all 72 cases
produces a `verbs.dead` finding for each unused verb.

<span id="using-your-own-words"></span>

## Using Application Verbs

Register custom verbs as strings or in an enum implementing `FeedVerb`:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Storyfeed;

Storyfeed::verbs([
    'plate' => ActivityType::Create,
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
