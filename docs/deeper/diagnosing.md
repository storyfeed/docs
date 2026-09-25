# Diagnosing Your Feed

## Introduction

Some feed mistakes throw nothing. A recorded verb with no headline still
publishes, and its row arrives with a `null` headline. The doctor finds these
gaps by reading your definitions, your schema and the activities you have
recorded, and each finding says what to change.

## Running the Doctor

```shell
php artisan storyfeed:doctor
```

After one order is placed with no definition for it, the report reads:

```txt
No grammar entry resolves for `order.place` — headlines will be null.
No icon resolves for `order.place`.
Note: verb `place` has no AS2.0 mapping — will serialize as base `Activity`.
2 finding(s) — see above.
Run with --stubs to print the registrations these imply.
```

The count leaves out notes. A run with no errors or warnings prints
`Storyfeed looks healthy.`

Most checks read recorded activities, so run the doctor against a database
with real traffic in it, such as staging or a copy of production. With no
activities, only the configuration and schema checks have anything to report.

### Running Selected Checks

`--list` prints the check names, and `--only` runs the ones you name:

```shell
php artisan storyfeed:doctor --list
php artisan storyfeed:doctor --only=grammar --only=verbs
```

Every check is listed in [Doctor Checks](/reference/doctor#available-checks).

## Reading a Finding

Each finding has a code, a severity and a message. The text report prints the
message, coloured by severity. `--json` prints the whole report:

```shell
php artisan storyfeed:doctor --json
```

```json
{
    "healthy": false,
    "count": 2,
    "severity": "error",
    "findings": [
        {
            "code": "grammar.missing",
            "severity": "error",
            "message": "No grammar entry resolves for `order.place` — headlines will be null.",
            "subject": {
                "type": "order",
                "verb": "place"
            },
            "fix": {
                "registry": "grammar",
                "key": "order.place",
                "tokens": [":actor", ":object", ":target", ":context", ":origin", ":result", ":instrument"],
                "snippet": "Story::for(Order::class)->verb('place')->headline(':actor placed :object');",
                "definition": "Story::for(Order::class)->verb('place')->headline(':actor placed :object');"
            }
        }
    ]
}
```

The other two findings follow in the same shape; a finding with nothing to
generate has `"fix": null`. The code's first segment is the check that reported it, `subject` names what
the finding is about, and `definition` is the line `--stubs` prints.

| Severity | Means |
|---|---|
| `error` | the feed shows something wrong now, or a write will throw |
| `warning` | something is missing or inconsistent, and the feed still reads correctly |
| `info` | a note: worth knowing, and often nothing to change |

## Fixing Common Findings

| Finding | Means | Fix |
|---|---|---|
| `grammar.missing` | a recorded type and verb has no headline | write it in [`routes/feed.php`](/basics/the-feed-file), or print it with `--stubs` |
| `grammar.icon_missing` | a recorded type and verb has no icon | add [`->icon()`](/basics/the-feed-file#adding-an-icon) |
| `aggregates.missing` | activities group, and the group has no headline | add a [group headline](/deeper/aggregation), or print it with `--stubs` |
| `verbs.undeclared` | a recorded verb is not in your vocabulary, usually a typo | fix the call site, or [register the verb](/basics/verbs) |
| `feeds.unclassified` | no restricted [named feed](/basics/named-feeds) decides who sees a verb | add the verb to a feed's `only()` or `except()` |
| `surface.unaliased` | a `Feedable` model has no morph alias, so publishing about it throws | give it an alias, or return its parent's from `getMorphClass()` ([Surface](/reference/doctor#surface)) |
| `entities.unfeedable` | activities name a model that does not implement `Feedable` | implement [`Feedable`](/basics/feedable-models), then run `storyfeed:trickle` |
| `backlog.uncached` | entities are waiting for their labels and links | [schedule `storyfeed:trickle`](/reference/commands#scheduling-maintenance) |
| `tables.missing` | a package table does not exist | run the migrations |

Every other finding, with what it means, is in
[Doctor Checks](/reference/doctor#interpreting-findings).

## Generating Missing Definitions

`--stubs` prints the definitions the findings imply, ready to paste into
`routes/feed.php`:

```shell
php artisan storyfeed:doctor --stubs
```

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')->headline(':actor placed :object');
// order.place: an icon from your app's own set; doctor cannot choose one.
// Story::for(Order::class)->verb('place')->icon('…');
```

Read each stub before you keep it. A stub the doctor cannot finish, such as an
icon, is commented out beneath the reason, and the finding stays until you
write it. [Doctor Checks](/reference/doctor#generating-definitions) lists what
`--stubs` writes.

To write Story classes instead, run
[`make:story --from-doctor`](/deeper/stories#generating-from-doctor-findings).

## Running the Doctor in CI

Findings leave the exit status at `0`. `--fail-on` makes the command fail:

```shell
php artisan storyfeed:doctor --fail-on=warning # Fails on a warning or an error.
php artisan storyfeed:doctor --fail-on=error   # Fails on an error only.
```

The [coverage assertions](/deeper/testing#testing-headline-coverage) check
headlines inside your test suite, before any traffic exists. The doctor checks
what was actually recorded.
