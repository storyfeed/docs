# Doctor Checks

## Introduction

Every check `storyfeed:doctor` runs, and every finding it reports.
[Diagnosing Your Feed](/deeper/diagnosing) covers running it and fixing what
it finds.

<a id="running-the-doctor"></a>
<a id="selecting-checks"></a>
<a id="json-output"></a>
<a id="exit-status"></a>
<a id="running-in-ci"></a>
<a id="continuous-integration"></a>

## Command Options

| Option | Does |
|---|---|
| `--list` | prints the check names `--only` accepts |
| `--only=` | runs the named checks; repeat it for several |
| `--json` | prints the report as JSON: `healthy`, `count`, `severity`, and each finding's `code`, `severity`, `message`, `subject` and `fix` |
| `--stubs` | prints only the definitions the findings imply, with their `use` lines. See [Generating Missing Definitions](#generating-definitions) |
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
| `removals` | recorded verbs that read like removals (`cancel`, `trash`) but are treated as being about their object. See [Deleted Models](#deleted-models) | info |
| `labels` | `Feedable` models whose label is guessed. See [Deleted Models](#deleted-models) | info |
| `inherited` | `Feedable` subclasses deleted through a parent that is not `Feedable`. See [Deleted Models](#deleted-models) | info |
| `surface` | `Feedable` models nothing publishes about, and ones the enforced morph map cannot name. See [Surface](#surface) | warning · info |
| `entities` | models in a feed role that cannot be resolved: no class, not a model, not `Feedable`, or the row is gone. See [Entities](#entities) | error · warning · info |
| `hydration` | `Feedable` models that load their live model in `feedMedia()`, and what a page pays for it. See [Hydration](#hydration) | info |
| `body` | the [body types](/deeper/body) stored, a body with no `$body` key, and a body type versioned on some rows but not others | warning · info |
| `role_constraints` | stored activities whose role types break the [declared constraints](/deeper/constraining-roles) | warning |
| `keep_latest` | several live activities on a [`keepLatest()`](/deeper/keeping-the-latest-activity) key, or superseded activities on a verb that declares none | warning · info |
| `retention` | activities past their verb's retention window, and busy verbs no window reaches. See [Retention](#retention) | warning · info |
| `actions` | Story class methods that take the request and threw when a job was dispatched, and methods that call `request()` instead of taking `Request`. See [Actions](#actions) | warning |
| `recording` | recording switched off (`storyfeed.recording.enabled`, or `stopRecording()` at boot), so every `publish()` saves nothing. An error outside `testing`, info under it | error · info |
| `tables` | missing package tables. Until `feed_tombstones` exists, deleted models leave no tombstone | error |
| `columns` | missing columns in the package tables. Writes that touch them throw | error |
| `manifest` | a [cached story manifest](/reference/commands#caching-definitions) older than your definitions, or definitions that no longer compile while the cache keeps serving them | error |
| `backlog` | activities whose entities have no label or link yet. Schedule `storyfeed:trickle` | warning |
| `grouping` | activities with no grouping rows, or grouping rows never curated. See [Grouping](#grouping) | warning |
| `participants` | activities `involving()` cannot find. `storyfeed:participants` backfills them | warning |
| `dangling` | rows left behind when activities were deleted by a query. They change nothing a feed shows | info |
| `claims` | composite members still held by a deleted composite. `storyfeed:curate --release` [releases them](/reference/commands#releasing-orphaned-composites) | info |
| `freshness` | nothing published for `doctor.stale_after` days | warning · info |
| `maintenance` | the last completed `storyfeed:curate` and `storyfeed:trickle` runs, and what they did | info |

<a id="interpreting-findings"></a>

## Findings

### Group Reachability

| Finding | Severity | Means |
|---|---|---|
| `aggregates.missing` | error | activities of a type and verb group, have no group headline, and a registered feed reads that kind of group. Its groups fall back to the single headline where that reads true, and otherwise arrive with no headline |
| `aggregates.latent` | info | the same, but no registered feed reads that kind of group. `--stubs` writes nothing for it, and `--fail-on=warning` ignores it |
| `aggregates.reachability_unknown` | info | no feeds are registered, or one threw while the doctor read it, so every gap reports as `aggregates.missing` |

Register your feeds so this check can tell a real gap from a latent one.

### Definitions

| Finding | Severity | Means |
|---|---|---|
| `verbs.undeclared` | warning | a recorded verb is not registered. Usually a typo; otherwise [register it](/basics/verbs) |
| `verbs.dead` | info | a registered verb is never recorded. Names the `file:line` that registered it |
| `grammar.unrecorded` | info | a headline is defined for a type and verb that is never recorded, while the verb is recorded on other types. Names the `file:line`. Usually a copy-paste slip in `routes/feed.php`, or a definition written ahead of traffic |

### Feed Coverage

| Finding | Severity | Means |
|---|---|---|
| `feeds.unclassified` | warning | no restricted feed includes or excludes the verb, so nobody decided who may see it |
| `feeds.unrestricted` | info | the same, but a feed declared [`unrestricted()`](#declaring-an-unrestricted-feed) carries the verb. Reported on every run |
| `feeds.unknown_verb` | warning; info until the app registers its own verbs | a feed names a verb that is neither registered nor recorded. A typo in `only()` drops the real verb from that feed |
| `feeds.none_restricted` | info | feeds are registered, and none restricts anything |
| `feeds.preset_failed` | warning | a feed threw while the doctor read it, so the verbs it decides are unchecked. A `define()` reading constructor state lands here |

The verbs checked are your registered verbs plus every recorded verb. A feed
with no `only()`, `except()` or `verb()` decides nothing. An app that never
calls `Storyfeed::feeds()` gets no findings. A finding that names a feed ends
with the file and line that declared it.

#### Declaring an Unrestricted Feed

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Storyfeed::feeds([
    'portal' => fn (FeedBuilder $feed) => $feed->unrestricted()->live(),
]);
```

`unrestricted()` declares a feed that carries every verb. It changes no query,
and a call site can still narrow it. A verb only this feed covers reports as
`feeds.unrestricted` at info instead of `feeds.unclassified` at warning. One
declaration cannot both filter and be `unrestricted()`, and `verb()` counts as
a filter.

### Parties

| Finding | Severity | Means |
|---|---|---|
| `parties.ignored` | warning | an actor named a party that [`Storyfeed::parties()`](/deeper/parties#declaring-parties) does not declare, so the activity kept its usual actor. Declare the name if it is real |
| `parties.undeclared_actor` | warning | a verb's `->actor()` names an undeclared party: it throws in `local` and `testing` and is ignored elsewhere |
| `parties.undeclared_list` | info | parties are in use and no list is declared, so any name becomes one |
| `parties.unused` | info | a party has no activities: a typo, or one created ahead of traffic |
| `parties.used` | info | a party, and how many activities it has |

### Deleted Models

| Finding | Severity | Means |
|---|---|---|
| `removals.unclassified` | info | a recorded verb reads like a removal, but its activities are treated as being about their object, so they become [redundant](/deeper/deleted-models#redundant-roles) when the object is deleted. If the verb records the removal, give it an Activity Streams 2.0 `Delete`, `Remove`, `Undo` or `Reject` type, or declare `->missing()` with no roles. If it is about its object, declare `->missing('object')`, which silences the finding |
| `labels.guessed` | info | the listed models' labels are guessed. Fine when the guess reads well; otherwise give each a label in `describeFeed()`, or in `toFeedUsing()` for a [registered class](/reference/feedable#models-you-don-t-own) |
| `inherited.parent_deletes` | info | a `Feedable` subclass, such as `FeedablePhoto extends Media`, is deleted through a parent that is not `Feedable`, so its own model events never fire. Says whether its tombstone is written at the delete (a class in the morph map, or registered with `Storyfeed::feedable()`) or waits for `storyfeed:trickle`. An update through the parent waits for the trickle either way |

A model's label is also what its tombstone keeps under `keepLabel()`.
[Deleted Models](/deeper/deleted-models) covers both.

### Surface

| Finding | Severity | Means |
|---|---|---|
| `surface.unwired` | warning | a `Feedable` model has never appeared on an activity, and no headline names its type. Something should publish about it, or the `Feedable` is left over |
| `surface.unaliased` | warning | a `Feedable` model has no alias in the enforced morph map, so publishing anything that names it throws `ClassMorphViolationException` |
| `surface.unassessable` | info | no activities are recorded, so `surface.unwired` cannot be judged |
| `surface.publisher` | info | a class that publishes to the feed |

`surface.unaliased` is usually a subclass of an aliased model. The finding
names the parent's alias:

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

To appear as a type of its own, give it an alias in
`Relation::enforceMorphMap()`. A model with no aliased parent gets only that
second fix.

### Entities

Each finding names the role, the alias, the class, how many activities carry
it, and example activity ids.

| Finding | Severity | Means |
|---|---|---|
| `entities.auth_model` | warning | the authentication model does not implement `Feedable`, so every activity published during a request has an actor with no label or link. Skipped when `actor_resolver` is set |
| `entities.unresolvable` | error | the alias resolves to no class: no morph map entry, and no class by that name |
| `entities.not_model` | error | the alias resolves to a class that is not an Eloquent model |
| `entities.unfeedable` | error | the alias resolves to a model without `Feedable`. Implement `Feedable`, then run `storyfeed:trickle` |
| `entities.missing` | warning | the model is `Feedable`, but the row is gone or hidden by a global scope. Checked on the 50 most recent affected activities per role and alias. `storyfeed:trickle --prune` removes the activities |
| `entities.opaque` | info | the model's table could not be queried |

The activities these findings name show without a label or a link. A row that
exists and has no label yet is reported by `backlog`.

### Hydration

Reports `Feedable` models whose `feedMedia()` loads the model, and the queries
that adds to a page.

| Finding | Severity | Means |
|---|---|---|
| `hydration.model` | info | the class loads its model in `feedMedia()`, and under which feeds: one query per class on every page it appears on. Says so when `hydration.enabled` is off and the call returns `null` instead |
| `hydration.page` | info | how many loading classes the 30 most recent activities carry, so how many queries that page adds |
| `hydration.opaque` | info | `feedMedia()` threw when called, so whether it loads its model is unknown |

### Role Constraints

| Finding | Severity | Means |
|---|---|---|
| `role_constraints.violated` | warning | stored activities have role types outside the [declared constraints](/deeper/constraining-roles). Empty roles and deleted models are skipped. The activities stay in the feed |

### Retention

| Finding | Severity | Means |
|---|---|---|
| `retention.backlog` | warning | a verb has activities more than a day past its [retention window](/deeper/retention). The next `storyfeed:prune` deletes them; `storyfeed:prune --pretend` shows the run first. Usually a window just declared or shortened, or a prune nothing schedules |
| `retention.unbounded` | info | a verb was recorded 10,000 times in the last 30 days and no window reaches it. A verb declared `->keepForever()` is never named |

### Actions

| Finding | Severity | Means |
|---|---|---|
| `actions.carry_failed` | warning | a [Story class method that takes the `Request`](/deeper/stories#using-the-request) threw when a job was dispatched. The job still ran, and published with the actor it would otherwise have had |
| `actions.request_helper` | warning | a Story class method reads the request through `request()` or the `Request` facade instead of taking `Illuminate\Http\Request $request`. It reads the request only when stories are compiled, never when an activity publishes. Take the `Request` as a parameter |

### Grouping

| Finding | Severity | Means |
|---|---|---|
| `grouping.ungrouped` | warning | activities have no grouping rows, so they can only show one by one. Run `storyfeed:curate --rehash` |
| `grouping.uncurated` | warning | activities have grouping rows that were never curated, so they cannot join the group they belong to. Run `storyfeed:curate` |

<span id="generating-definitions"></span>

## Generating Missing Definitions

`--stubs` writes a definition for each finding that implies one: a headline,
an icon, an anonymous headline, a group headline, or a `keepLatest()`
declaration.

| The Stub Is | When |
|---|---|
| live | the doctor can write the sentence: the verb in the past tense, over tokens that are true of every activity it covers |
| commented out, beneath the reason | it cannot: an icon, a verb whose past tense it cannot spell for certain (`ship`), a key that covers every verb, or a group that can hold several verbs. The finding stays until you write it |
| absent | `roles` findings, whose sentence needs rewriting, and `aggregates.latent`, which would show nowhere |

A group of one type gets its headline on that type; a group that can hold
several types gets it on the verb alone, over tokens that name no type. With
one user placing three orders, and several users placing an order for the same
customer:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::verb('place')->grouped(fn (GroupBuilder $group) => $group->actors(':actors placed :objects'));
Story::for(Order::class)->verb('place')->grouped(fn (GroupBuilder $group) => $group->repeat(':actor placed :objects'));
```

The `actors` stub names two lists. Before you keep it, rewrite it with one, as
[Aggregation](/deeper/aggregation#plural-lists-in-headlines) advises.

The output has no headings or counts, so it can be piped.
`// Nothing to author` means no finding implies a definition, not that there
were no findings. In `--json`, each fix's `definition` is the same line.
