# Diagnosing Your Feed

## Introduction

The doctor checks your definitions, schema, and recorded activities and
reports how to fix gaps. In local and testing environments, an unregistered
verb throws `UnknownVerb` by default; a concrete Story definition registers
the verb and its headline. By default, publishing without a headline definition
throws `UnauthoredActivity` in local and testing environments. When
`storyfeed.grammar.strict` is disabled, the activity can publish with a null
headline; the doctor can find these gaps in already-recorded activities.

## Running the Doctor

```shell
php artisan storyfeed:doctor
```

For an order-placement activity recorded with strict grammar disabled and no
headline definition, the report shows:

```txt
No headline resolves for `order.place` — headlines will be null.
No icon resolves for `order.place`.
Note: verb `place` has no AS2.0 mapping — will serialize as base `Activity`.
2 finding(s) — see above.
Run with --stubs to print the registrations these imply.
```

The count excludes notes and acknowledged findings. With no active errors or
warnings and no acknowledgments, the command prints `Storyfeed looks healthy.`

Most checks query recorded activities, so use a database with traffic, such
as staging or a production copy. With no activities, configuration, schema,
and registry checks can still report findings; traffic-dependent checks have
nothing to inspect.

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
    "acknowledged_count": 0,
    "findings": [
        {
            "code": "grammar.missing",
            "severity": "error",
            "message": "No headline resolves for `order.place` — headlines will be null.",
            "subject": {
                "type": "order",
                "verb": "place"
            },
            "acknowledgment": null,
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
have `"fix": null`. `acknowledgment` is the written reason for an accepted
finding, or `null`. The code's first segment identifies the check; `subject`
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

### Reading Link Findings

`links.missing` is informational: every inspected entity of one type and role
had a null URL in that named feed's sampled page. Unlinked entities are
legitimate. The doctor reads up to 30 top-level items in each constructable
named feed's declared mode, including the entities returned in bounded group
samples and children. It cannot establish that a type is always unlinked or
count unsampled history. Another named feed may return different links.

`links.uninspectable` means a feed could not be read, for example because it
requires a subject. The doctor does not substitute an unscoped feed. Both
findings are notes, leave CI counts unchanged, and generate no fix. See
[Link Sampling](/reference/doctor#link-sampling) for the subject fields.

<a id="handling-deliberate-gaps"></a>

## Handling Deliberate Findings

To accept a deliberate finding, copy its exact code and complete typed
`subject` from `storyfeed:doctor --json` into `doctor.acknowledgments`, with a
written reason:

```php memo="config/storyfeed.php"
'doctor' => [
    'stale_after' => 30,
    'acknowledgments' => [
        [
            'code' => 'grammar.icon_missing',
            'subject' => ['type' => 'order', 'verb' => 'place'],
            'reason' => 'The order feed deliberately displays headlines without icons.',
        ],
    ],
],
```

Accepted findings stay visible with their reasons but no longer count toward
active problems, `--fail-on`, or generated stubs. See
[Acknowledgment Policy](/reference/doctor#acknowledgment-policy) for supported
codes, coverage limits and validation.

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
[`make:story --from-doctor`](/basics/stories#generating-from-doctor-findings).

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
