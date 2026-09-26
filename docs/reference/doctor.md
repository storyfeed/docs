# Doctor Checks

## Introduction

See [Diagnosing Your Feed](/deeper/diagnosing) for running the doctor and
fixing findings.

<a id="running-the-doctor"></a>
<a id="selecting-checks"></a>
<a id="json-output"></a>
<a id="exit-status"></a>
<a id="running-in-ci"></a>
<a id="continuous-integration"></a>

## Command Options

| Option | Effect |
|---|---|
| `--list` | prints the check names `--only` accepts |
| `--only=` | runs the named checks; repeat it for several |
| `--json` | prints the report as JSON: `healthy`, `count`, `severity`, and each finding's `code`, `severity`, `message`, `subject` and `fix` |
| `--stubs` | prints only the suggested definitions, with their `use` lines. See [Generating Missing Definitions](#generating-definitions) |
| `--fail-on=` | `warning` exits non-zero on a warning or an error; `error` on an error alone. Without it, findings never change the exit status |

<span id="checks"></span>

## Available Checks

| Check | Finds | Severity |
|---|---|---|
| `grammar` | recorded type-and-verb pairs with no headline or no icon, verbs with no Activity Streams 2.0 type, and intransitive verbs recorded with an object | error · warning · info |
| `aggregates` | groups that formed, or could form, with no group headline. See [Group Reachability](#group-reachability) | error · info |
| `tokens` | group headlines that use a token which can differ between the group's members | warning · info |
| `axes` | grouping axes that can hold several verbs, where a group headline names one verb or none exists | warning |
| `roles` | headlines that name a role (`:object`, `:target`, `:context`, `:origin`, `:result`, `:instrument`) none of their activities carry, so the placeholder shows as text. `:actor` over activities that are all anonymous is info | error · info |
| `actorless` | anonymous activities whose verb has no anonymous headline | info |
| `reflexive` | activities naming the same entity as actor and object | info |
| `verbs` | recorded verbs you never registered, registered verbs never recorded, and headlines defined for a type the verb is never recorded on. See [Definitions](#definitions) | warning · info |
| `feeds` | verbs no restricted [named feed](/basics/named-feeds) includes or excludes. See [Feed Coverage](#feed-coverage) | warning · info |
| `parties` | party names used but not declared, and declared parties with no activities. See [Parties](#parties) | warning · info |
| `removals` | recorded verbs named like removals (`cancel`, `trash`) but are treated as being about their object. See [Deleted Models](#deleted-models) | info |
| `labels` | `Feedable` models whose label is guessed. See [Deleted Models](#deleted-models) | info |
| `inherited` | `Feedable` subclasses deleted through a parent that is not `Feedable`. See [Deleted Models](#deleted-models) | info |
| `surface` | `Feedable` models without recorded activities, and ones the enforced morph map cannot name. See [Surface](#surface) | warning · info |
| `entities` | models in a feed role that cannot be resolved: no class, not a model, not `Feedable`, or the model record is gone. See [Entities](#entities) | error · warning · info |
| `hydration` | `Feedable` models that load their live model in `feedMedia()`, and the additional queries per page. See [Hydration](#hydration) | info |
| `body` | the [body types](/deeper/body) stored, a body with no `$body` key, and a body type versioned on some records but not others | warning · info |
| `role_constraints` | stored activities whose role types break the [declared constraints](/deeper/constraining-roles) | warning |
| `keep_latest` | several live activities on a [`keepLatest()`](/deeper/keeping-the-latest-activity) key, or superseded activities on a verb that declares none | warning · info |
| `retention` | activities past their verb's retention window, and frequent verbs without a retention limit. See [Retention](#retention) | warning · info |
| `actions` | Story class methods that take the request and threw when a job was dispatched, and methods that call `request()` instead of taking `Request`. See [Actions](#actions) | warning |
| `recording` | recording switched off (`storyfeed.recording.enabled`, or `stopRecording()` at boot), so every `publish()` saves nothing. An error outside `testing`, info under it | error · info |
| `tables` | missing package tables. Until `feed_tombstones` exists, deleted models leave no tombstone | error |
| `columns` | missing columns in the package tables. Writes that touch them throw | error |
| `manifest` | a [cached story manifest](/reference/commands#caching-definitions) older than your definitions, or definitions that no longer compile while the cache keeps serving them | error |
| `backlog` | activities whose entities have no label or link yet. Schedule `storyfeed:trickle` | warning |
| `grouping` | activities with no grouping records, or grouping records without a selected display group. See [Grouping](#grouping) | warning |
| `participants` | activities `involving()` cannot find. `storyfeed:participants` backfills them | warning |
| `dangling` | records left behind when activities were deleted by a query. They change nothing a feed shows | info |
| `claims` | composite members still held by a deleted composite. `storyfeed:curate --release` [releases them](/reference/commands#releasing-orphaned-composites) | info |
| `freshness` | nothing published for `doctor.stale_after` days | warning · info |
| `maintenance` | the last completed `storyfeed:curate` and `storyfeed:trickle` runs, and what they did | info |

<a id="interpreting-findings"></a>

## Findings

### Group Reachability

| Finding | Severity | Meaning |
|---|---|---|
| `aggregates.missing` | error | a type-and-verb group has no headline and is used by a registered feed; Storyfeed falls back to the single-activity headline when valid, or returns no headline |
| `aggregates.latent` | info | a group has no headline but is unused by registered feeds; `--stubs` generates nothing and `--fail-on=warning` ignores it |
| `aggregates.reachability_unknown` | info | no feeds are registered, or a feed threw during inspection; all headline gaps are reported as `aggregates.missing` |

Register feeds so the check can distinguish missing headlines they use from
those they do not.

### Definitions

| Finding | Severity | Meaning |
|---|---|---|
| `verbs.undeclared` | warning | a recorded verb is not registered. Usually a typo; otherwise [register it](/basics/verbs) |
| `verbs.dead` | info | a registered verb is never recorded. Names the `file:line` that registered it |
| `grammar.unrecorded` | info | a headline is defined for a type and verb that is never recorded, while the verb is recorded on other types. Names the `file:line`. Usually a copy-paste slip in `routes/feed.php`, or a definition written ahead of traffic |

### Feed Coverage

| Finding | Severity | Meaning |
|---|---|---|
| `feeds.unclassified` | warning | no restricted feed explicitly includes or excludes the verb |
| `feeds.unrestricted` | info | only a feed declared [`unrestricted()`](#declaring-an-unrestricted-feed) includes the verb; reported on every run |
| `feeds.unknown_verb` | warning; info until the app registers its own verbs | a feed names a verb that is neither registered nor recorded; a typo in `only()` excludes the intended verb |
| `feeds.none_restricted` | info | feeds are registered but none filters verbs |
| `feeds.preset_failed` | warning | a feed threw during inspection, leaving its verb rules unchecked; this includes `define()` methods that access constructor values |

The check includes registered and recorded verbs. Feeds without `only()`,
`except()`, or `verb()` classify none. If your application never calls
`Storyfeed::feeds()`, the check reports no findings. Findings for a named feed
include its declaration's file and line.

#### Declaring an Unrestricted Feed

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Storyfeed::feeds([
    'portal' => fn (FeedBuilder $feed) => $feed->unrestricted()->live(),
]);
```

Call `unrestricted()` to declare that a feed includes every verb. This does
not change the query, and callers may still filter it. Verbs covered only by
that feed produce `feeds.unrestricted` (info) instead of `feeds.unclassified`
(warning). An unrestricted declaration cannot also use filters, including `verb()`.

### Parties

| Finding | Severity | Meaning |
|---|---|---|
| `parties.ignored` | warning | an actor named a party that [`Storyfeed::parties()`](/deeper/parties#declaring-parties) does not declare, so the activity kept its usual actor. Declare the name if it is real |
| `parties.undeclared_actor` | warning | a verb's `->actor()` names an undeclared party: it throws in `local` and `testing` and is ignored elsewhere |
| `parties.undeclared_list` | info | parties are in use and no list is declared, so any name becomes one |
| `parties.unused` | info | a party has no activities: a typo, or one created ahead of traffic |
| `parties.used` | info | a party, and how many activities it has |

### Deleted Models

| Finding | Severity | Meaning |
|---|---|---|
| `removals.unclassified` | info | a recorded verb is named like a removal, but its activities are treated as being about their object, so they become [redundant](/deeper/deleted-models#redundant-roles) when the object is deleted. If the verb records the removal, give it an Activity Streams 2.0 `Delete`, `Remove`, `Undo` or `Reject` type, or declare `->missing()` with no roles. If it is about its object, declare `->missing('object')`, which silences the finding |
| `labels.guessed` | info | the listed models' labels are guessed. Acceptable when the inferred label is suitable; otherwise give each a label in `describeFeed()`, or in `toFeedUsing()` for a [registered class](/reference/feedable#models-you-don-t-own) |
| `inherited.parent_deletes` | info | a `Feedable` subclass, such as `FeedablePhoto extends Media`, is deleted through a parent that is not `Feedable`, so its own model events are not dispatched. Reports whether its tombstone is written at the delete (a class in the morph map, or registered with `Storyfeed::feedable()`) or waits for `storyfeed:trickle`. An update through the parent waits for the trickle either way |

A model's label is also what its tombstone keeps under `keepLabel()`.
[Deleted Models](/deeper/deleted-models) covers both.

<a id="surface"></a>

### Feedable Models

| Finding | Severity | Meaning |
|---|---|---|
| `surface.unwired` | warning | a `Feedable` model has never appeared on an activity, and no headline names its type. Something should publish about it, or the `Feedable` is left over |
| `surface.unaliased` | warning | a `Feedable` model has no alias in the enforced morph map, so publishing anything that names it throws `ClassMorphViolationException` |
| `surface.unassessable` | info | no activities are recorded, so `surface.unwired` cannot be judged |
| `surface.publisher` | info | a class that publishes to the feed |

`surface.unaliased` often identifies a subclass of an aliased model and
includes the parent's alias:

```txt
[App\Models\PriorityOrder] implements Feedable, but the morph map is enforced
and has no alias for it, so publishing anything that names it throws
ClassMorphViolationException. It extends [App\Models\Order], stored as `order`:
return `order` from its getMorphClass() if it should appear as that, or give it
an alias of its own in Relation::enforceMorphMap().
```

To appear in the feed as its parent, return the parent's alias:

```php memo="app/Models/PriorityOrder.php"
<?php

namespace App\Models;

class PriorityOrder extends Order
{
    public function getMorphClass(): string
    {
        return 'order';
    }
}
```

To give the subclass its own type, add an alias to `Relation::enforceMorphMap()`.
This is required when no parent has an alias.

### Entities

Findings include the role, alias, class, affected activity count, and example
activity IDs.

| Finding | Severity | Meaning |
|---|---|---|
| `entities.auth_model` | warning | the authentication model does not implement `Feedable`, so every activity published during a request has an actor with no label or link. Skipped when `actor_resolver` is set |
| `entities.unresolvable` | error | the alias resolves to no class: no morph map entry, and no class by that name |
| `entities.not_model` | error | the alias resolves to a class that is not an Eloquent model |
| `entities.unfeedable` | error | the alias resolves to a model without `Feedable`. Implement `Feedable`, then run `storyfeed:trickle` |
| `entities.missing` | warning | the model is `Feedable`, but the row is gone or hidden by a global scope. Checked on the 50 most recent affected activities per role and alias. `storyfeed:trickle --prune` removes the activities |
| `entities.opaque` | info | the model's table could not be queried |

Affected entities display without labels or links. Existing entities whose
labels are not cached yet are reported by `backlog`.

### Hydration

The hydration check reports models loaded by `feedMedia()` and the additional
queries required per page.

| Finding | Severity | Meaning |
|---|---|---|
| `hydration.model` | info | a class loads its model in `feedMedia()` for the listed feeds, adding one query per class per page; also reports when `hydration.enabled` is off and the call returns `null` |
| `hydration.page` | info | distinct model classes loaded for the 30 most recent activities, and the resulting query count |
| `hydration.opaque` | info | `feedMedia()` threw, so model loading could not be checked |

### Role Constraints

| Finding | Severity | Meaning |
|---|---|---|
| `role_constraints.violated` | warning | stored activities have role types outside the [declared constraints](/deeper/constraining-roles). Empty roles and deleted models are skipped. The activities stay in the feed |

### Retention

| Finding | Severity | Meaning |
|---|---|---|
| `retention.backlog` | warning | activities are over a day past their [retention period](/deeper/retention); preview with `storyfeed:prune --pretend` before deleting them. Often caused by changed retention or an unscheduled pruning command |
| `retention.unbounded` | info | a verb recorded at least 10,000 times in 30 days has no retention limit; excludes verbs declaring `keepForever()` |

### Actions

| Finding | Severity | Meaning |
|---|---|---|
| `actions.carry_failed` | warning | a [Story class method that takes the `Request`](/deeper/stories#using-the-request) threw when a job was dispatched. The job still ran, and published with the actor it would otherwise have had |
| `actions.request_helper` | warning | a Story class method reads the request through `request()` or the `Request` facade instead of taking `Illuminate\Http\Request $request`. It accesses the request only when stories are compiled, never when an activity publishes. Take the `Request` as a parameter |

### Grouping

| Finding | Severity | Meaning |
|---|---|---|
| `grouping.ungrouped` | warning | activities have no grouping records and can only appear individually; run `storyfeed:curate --rehash` |
| `grouping.uncurated` | warning | activities have grouping records, but no group has been selected for display; run `storyfeed:curate` |

<span id="generating-definitions"></span>

## Generating Missing Definitions

Use `--stubs` to generate definitions suggested by findings: headlines, icons,
anonymous headlines, group headlines, and `keepLatest()` declarations.

| Stub | Condition |
|---|---|
| uncommented | the doctor can generate a past-tense headline using tokens shared by every activity |
| commented out with an explanation | the definition needs your input: an icon, an uncertain past tense such as `ship`, a key covering all verbs, or a group containing several verbs. The finding remains until you complete it |
| absent | `roles` findings require rewriting a headline; `aggregates.latent` headlines are unused by registered feeds |

Headlines for groups of one type are declared on that type. Groups containing
several types use verb-level headlines without a type-specific noun. For one
user placing three orders and several users ordering for the same customer:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::verb('place')->grouped(fn (GroupBuilder $group) => $group->actors(':actors placed :objects'));
Story::for(Order::class)->verb('place')->grouped(fn (GroupBuilder $group) => $group->repeat(':actor placed :objects'));
```

The `actors` stub contains two lists. Rewrite it to use one before adding it,
as described in [Aggregation](/deeper/aggregation#plural-lists-in-headlines).

Output omits headings and counts so it can be piped. `// Nothing to author`
means no definitions can be generated, even if findings exist. With `--json`,
each fix's `definition` contains the same generated line.
