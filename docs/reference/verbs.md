# Verb Vocabulary

`Storyfeed\Verb` is a backed enum of common verbs you can record with instead
of writing your own. Each case stores a plain English word as the verb, such as
`approve`, and serializes as an Activity Streams 2.0 activity type, such as
`Accept`, so you need no mapping of your own.

Verbs are still free-form strings in storage. An application can use its own
words, these cases, or both.

## The Vocabulary

Seventy-two verbs, grouped by the activity type each one maps to. The stored
verb is the value in the second column.

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

Every case is present tense: `send`, not `sent`. All twenty-eight Activity
Streams activity types are reachable.

## Recording With a Verb

A case records an activity the same way an application's own enum does.

```php
// where the fact happens: a controller, an action, a listener
use Storyfeed\Verb;

Verb::Approve->by($editor)
    ->object($photo)
    ->to($menu)
    ->publish();
```

The row stores `approve`, and the Activity Streams serializer emits
`"type": "Accept"` alongside `"sf:verb": "approve"`.

## Registering the Verbs You Use

`Storyfeed::verbs()` takes a map of verb to activity type. `Verb::only()`
builds that map for the cases an application actually records.

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Verb;

Storyfeed::verbs(Verb::only(
    Verb::Create, Verb::Update, Verb::Approve, Verb::Archive,
));
```

Register the cases you record, not the whole enum. Grammar coverage reports
every registered verb with no headline, so registering all seventy-two produces
a finding for each verb the application never uses.

## Using Your Own Words

A word the enum does not ship is registered as a string, or through your own
enum implementing `FeedVerb`.

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\ActivityStreams\ActivityType;

Storyfeed::verbs([
    'plate' => ActivityType::Create,
]);
```

## Mixing an Enum With the Shipped Cases

`Storyfeed::verbs()` merges by default, so both vocabularies register together.

```php
// app/Providers/AppServiceProvider.php, boot()
use App\Enums\KitchenActivity;
use Storyfeed\Verb;

Storyfeed::verbs(Verb::only(Verb::Create, Verb::Confirm));
Storyfeed::verbs(KitchenActivity::class);
```
