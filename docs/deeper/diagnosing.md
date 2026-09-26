# Diagnosing Your Feed

## Introduction

Some configuration errors do not throw an exception. An activity without a
headline definition still publishes, but its headline is `null`. The doctor
checks your definitions, schema, and recorded activities for these gaps and
reports how to fix them.

## Running the Doctor

```shell
php artisan storyfeed:doctor
```

After you publish an order without a headline definition, the report shows:

```txt
No headline resolves for `order.place` — headlines will be null.
No icon resolves for `order.place`.
Note: verb `place` has no AS2.0 mapping — will serialize as base `Activity`.
2 finding(s) — see above.
Run with --stubs to print the registrations these imply.
```

The count excludes notes. If no errors or warnings are found, the command
prints `Storyfeed looks healthy.`

Most checks query recorded activities, so use a database with traffic, such
as staging or a production copy. With no activities, only configuration and
schema checks can report findings.

### Running Selected Checks

`--list` prints the check names, and `--only` runs the ones you name:

```shell
php artisan storyfeed:doctor --list
php artisan storyfeed:doctor --only=grammar --only=verbs
```

Every check is listed in [Doctor Checks](/reference/doctor#available-checks).

## Reading a Finding

Each finding includes a code, severity, and message. The text report colours
messages by severity. Use `--json` to return the full report:

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
            "message": "No headline resolves for `order.place` — headlines will be null.",
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

The other findings use the same structure. Findings without a generated fix
have `"fix": null`. The code's first segment identifies the check; `subject`
identifies what it checked. `definition` contains the line printed by `--stubs`.

| Severity | Meaning |
|---|---|
| `error` | the feed displays incorrect content, or publication will throw |
| `warning` | something is missing or inconsistent, but the feed still displays correctly |
| `info` | additional information that may not require a change |

## Fixing Common Findings

| Finding | Means | Fix |
|---|---|---|
| `grammar.missing` | a recorded type and verb has no headline | write it in [`routes/feed.php`](/basics/the-feed-file), or print it with `--stubs` |
| `grammar.icon_missing` | a recorded type and verb has no icon | add [`->icon()`](/basics/the-feed-file#adding-an-icon) |
| `aggregates.missing` | activities group, and the group has no headline | add a [group headline](/deeper/aggregation), or print it with `--stubs` |
| `verbs.undeclared` | a recorded verb is not in your vocabulary, usually a typo | fix the call site, or [register the verb](/basics/verbs) |
| `feeds.unclassified` | no restricted [named feed](/basics/named-feeds) includes or excludes a verb | add the verb to a feed's `only()` or `except()` |
| `surface.unaliased` | a `Feedable` model has no morph alias, so publishing about it throws | give it an alias, or return its parent's from `getMorphClass()` ([Surface](/reference/doctor#feedable-models)) |
| `entities.unfeedable` | activities name a model that does not implement `Feedable` | implement [`Feedable`](/basics/feedable-models), then run `storyfeed:trickle` |
| `backlog.uncached` | entities have uncached labels and links | [schedule `storyfeed:trickle`](/reference/commands#scheduling-maintenance) |
| `tables.missing` | a package table does not exist | run the migrations |

See [Doctor Checks](/reference/doctor#interpreting-findings) for all findings.

## Generating Missing Definitions

Use `--stubs` to print suggested definitions for `routes/feed.php`:

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

Review each stub before adding it. Incomplete stubs, such as icons, are
commented out with an explanation. The finding remains until you supply the
missing definition. See [Doctor Checks](/reference/doctor#generating-definitions)
for the definitions `--stubs` generates.

To write Story classes instead, run
[`make:story --from-doctor`](/deeper/stories#generating-from-doctor-findings).

## Running the Doctor in CI

By default, findings leave the exit status at `0`. Use `--fail-on` to fail
the command at a chosen severity:

```shell
php artisan storyfeed:doctor --fail-on=warning # Fails on a warning or an error.
php artisan storyfeed:doctor --fail-on=error   # Fails on an error only.
```

[Coverage assertions](/deeper/testing#testing-headline-coverage) check
headlines in your test suite before traffic exists. The doctor checks
recorded activities.
