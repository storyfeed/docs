# Doctor

## Introduction

Doctor checks your definitions, schema and recorded activities. Findings name
the affected definitions or rows and describe the action you can take.

## Running the Doctor

```shell
php artisan storyfeed:doctor
```

### Selecting Checks

List the check names, then select one or more with `--only`:

```shell
php artisan storyfeed:doctor --list
php artisan storyfeed:doctor --only=grammar --only=verbs
```

### JSON Output

Use `--json` to read the report from a script:

```shell
php artisan storyfeed:doctor --json
```

### Exit Status

Findings do not change the exit status by default. Use `--fail-on=warning`
to fail on warnings and errors, or `--fail-on=error` for errors alone:

```shell
php artisan storyfeed:doctor --fail-on=warning
```

<span id="checks"></span>

## Available Checks

| Check | Asks | Reports |
|---|---|---|
| `grammar` | does every verb/type pair in the feed have a headline? | error · warning · info |
| `aggregates` | does every group that formed — or *could* form — have aggregate grammar? | error · info |
| `tokens` | does any aggregate template use a token its axis doesn't pin? | warning · info |
| `axes` | does a grouping recipe omit `v`? Its groups may span several verbs, so no per-verb aggregate key is true of one. Answered from the registry, before any group forms | warning |
| `verbs` | verbs recorded but unregistered (typos), or registered but never recorded (dead vocabulary, with the `file:line` that defined it), and type-and-verb pairs defined but never recorded. See [Definitions](#definitions) | warning · info |
| `removals` | recorded verbs that read like removals (`cancel`, `void_payment`, `trash`) but are treated as being about their object. See [Deleted Models](#deleted-models) | info |
| `labels` | `Feedable` models labelled by guesswork: no `describeFeed()`, `toFeed()`, `guessFeedLabel()` or `toFeedUsing()`. See [Deleted Models](#deleted-models) | info |
| `surface` | models that appear in the feed but that nothing publishes about, and `Feedable` models the enforced morph map cannot name. See [Surface](#surface) | warning · info |
| `feeds` | is every verb decided — named in the allowlist or denylist of at least one restricted [named feed](/basics/named-feeds)? | warning · info |
| `parties` | party names an actor took that `Storyfeed::parties()` does not declare, and party rows with no activities. See [Parties](#parties) | warning · info |
| `participants` | activities missing from the index `involving()` reads | warning |
| `tables` | are the package tables present, `feed_tombstones` included? Until it exists, deleted models leave no tombstone | error |
| `columns` | are write-path columns present? (catches missing write-path columns) | error |
| `recording` | is anything being written? `storyfeed.recording.enabled` off, or `stopRecording()` at boot, makes every `publish()` return an unsaved row — an error outside `testing`, info under it | error · info |
| `roles` | does a singular template name a role (`:object`, `:target`, `:context`, `:origin`, `:result`, `:instrument`) that none of its activities carry? The placeholder renders as content. `:actor` over all-anonymous rows is info | error · info |
| `role_constraints` | do live stored rows satisfy the allowed role types? Null roles and tombstones are skipped | warning |
| `grouping` | activities with no grouping row that today's axes would group — an import that ran `storyfeed:rebuild` before `storyfeed:trickle` | warning |
| `entities` | a model filling a feed role that cannot be resolved: no class, not a model, not `Feedable`, or the row is gone. See [Entities](#entities) | error · warning · info |
| `hydration` | which `Feedable` models load their live model in `feedMedia()`, and what a page pays for it. See [Hydration](#hydration) | info |
| `shapes` | snapshot fingerprints that no longer match current output (DTO drift) | warning · info |
| `hashes` | grouping hash lengths consistent with the current axis recipes | warning |
| `backlog` | activities still awaiting snapshots — is the trickle keeping up? | warning |
| `manifest` | is the cached story manifest stale relative to your code? | error |
| `freshness` | has the feed stopped receiving new activity? (`doctor.stale_after`) — catches a forgotten feed, not a broken one | warning · info |
| `body` | which [body types](/deeper/body) are actually stored, and the two ways one can be malformed quietly: a map with no `$body` key, and a body type versioned on some rows but not others | warning · info |
| `dangling` | grouping and participant rows whose activity no longer exists, trashed included. Activities have no database cascade, so a bulk hard-delete leaves these behind | info |
| `claims` | composite members still claimed by a parent that no longer exists (`claims.parent_gone`), so the composite still renders from them. [`storyfeed:curate --release`](/reference/commands#releasing-orphaned-composites) ends it. A trashed parent is not counted | info |
| `inherited` | `Feedable` subclasses deleted through a parent class that is not `Feedable`. See [Deleted Models](#deleted-models) | info |
| `retention` | rows past their verb's retention window, and busy verbs no window reaches. See [Retention](#retention) | warning · info |
| `keep_latest` | multiple live rows on a declared key (`keep_latest.split`, warning), or superseded rows on an undeclared verb (`keep_latest.undeclared`, info); declarations with `within:` are excluded from the split check | warning · info |
| `actions` | Story class methods that take the request and threw when a job was dispatched, and methods that read `request()` without taking `Request`. See [Actions](#actions) | warning |

## Interpreting Findings

### Feed Coverage

The `feeds` check reports five findings:

| Finding | Severity | Means |
|---|---|---|
| `feeds.unclassified` | warning | a verb is named by no restricted feed, so nobody decided who may see it. Names no feed — it is the absence of one |
| `feeds.unrestricted` | info | a verb is named by no restricted feed, and some feed declared [`unrestricted()`](#declaring-an-unrestricted-feed). Reported on every run; the declaration does not decide the verb, it lowers the severity |
| `feeds.unknown_verb` | warning; info until the app registers its own verbs | a feed names a verb that is neither registered nor recorded. Usually a typo, and a typo in an allowlist drops the real verb from that feed |
| `feeds.none_restricted` | info | feeds are registered, but none restricts anything |
| `feeds.preset_failed` | warning | a preset threw while doctor inspected it, so the verbs it decides are unchecked. A `define()` reading constructor state lands here |

The verbs checked are your registered verbs plus the verbs in
`feed_activities`. An open feed (none of `only()`, `except()` or `verb()`)
classifies nothing. An app that never calls `Storyfeed::feeds()` gets no
findings. A finding that names a feed ends with the file and line that declared
it.

#### Declaring an Unrestricted Feed

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Storyfeed::feeds([
    'portal' => fn (FeedBuilder $feed) => $feed->unrestricted()->summary(),
]);
```

`unrestricted()` declares a feed that carries every verb. It changes no query,
and a call site can still narrow it. A verb covered only by this feed reports
as `feeds.unrestricted` at info instead of `feeds.unclassified` at warning.

```php
// a controller, reading the feed
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed('portal')->only(['place', 'ready'])->get();
```

One feed declaration cannot both filter and be `unrestricted()`, and `verb()`
counts as a filter.

#### Group Reachability

| Finding | Severity | Means |
|---|---|---|
| `aggregates.missing` | error | a pair clusters, has no aggregate grammar, and a registered feed's mode reads that axis. Its groups fall back to the singular headline where its tokens are safe, and otherwise arrive with no headline |
| `aggregates.latent` | info | the same pair, but no registered feed reads the axis. No fix stub, because the grammar would render nowhere. A call site can still override a feed's mode and read the axis, and `--fail-on=warning` does not trip on it |
| `aggregates.reachability_unknown` | info | no feeds are registered, or one threw while being inspected. Every pair is then reported as `aggregates.missing`, at error |

Register your feeds so this check can tell a real gap from a latent one.

### Definitions

| Finding | Severity | Means |
|---|---|---|
| `verbs.dead` | info | a verb is declared but never recorded. Names the `file:line` that defined it |
| `grammar.unrecorded` | info | a type-and-verb pair is defined but never recorded, while the verb is recorded on other types. Names the `file:line`. Usually a copy-paste slip in `routes/feed.php`, or a definition written ahead of traffic |

### Deleted Models

| Finding | Severity | Means |
|---|---|---|
| `removals.unclassified` | info | a recorded verb reads like a removal, but an activity with it is redundant once its object is deleted, as for any verb about its object. If the verb records the removal, give it an Activity Streams 2.0 `Delete`, `Remove`, `Undo` or `Reject` type, or declare `->missing()` with no roles. If it is about its object, declare `->missing('object')`, which silences the finding |
| `labels.guessed` | info | the listed models are labelled by guesswork. Fine when the guess reads well in a feed; otherwise give each a label in `describeFeed()`, or in `toFeedUsing()` for a [registered class](/reference/feedable#models-you-don-t-own) |
| `inherited.parent_deletes` | info | a `Feedable` subclass, such as `FeedablePhoto extends Media`, is deleted through a parent that is not `Feedable`, so its own model events never fire. Names the class, its alias and the parents, and says whether Storyfeed hears the parent's deletes for it (it does for a class in the morph map or registered with `Storyfeed::feedable()`) or its tombstones wait for `storyfeed:trickle`. Updates are not heard through the parent either way: a subclass updated as its parent keeps its snapshot until the trickle runs |

The label matters beyond the feed: it is what a tombstone keeps when its model
asks for `keepLabel()`. [Deleted Models](/deeper/deleted-models) covers both.

### Parties

| Finding | Severity | Means |
|---|---|---|
| `parties.ignored` | warning | an actor named a party that [`Storyfeed::parties()`](/deeper/parties#declaring-parties) does not declare, so it was ignored and the activity kept the actor it would otherwise have had. Declare the name if it is real |
| `parties.undeclared_actor` | warning | a verb's own `->actor()` names a party the list does not declare: it throws in `local` and `testing` and is ignored elsewhere |
| `parties.undeclared_list` | info | parties are in use and no list is declared, so any name given to `Storyfeed::actor()` or a verb's `->actor()` becomes one |
| `parties.unused` | info | a party has no activities: a typo, or one created ahead of traffic |
| `parties.used` | info | a party, and how many activities it has |

### Retention

| Finding | Severity | Means |
|---|---|---|
| `retention.backlog` | warning | a verb has rows more than a day past its [retention window](/deeper/retention). The next `storyfeed:prune` deletes them, with the snapshots and tombstones only they referred to. Usually a window just declared or shortened, or a prune nothing schedules; `storyfeed:prune --pretend` shows the run first |
| `retention.unbounded` | info | a verb was recorded 10,000 times in the last 30 days and no window reaches it, so its rows are kept for the life of the table. A verb that says `->keepForever()` is never named |

### Actions

| Finding | Severity | Means |
|---|---|---|
| `role_constraints.violated` | warning | live stored rows have role types outside the [declared constraints](/deeper/constraining-roles); null roles and tombstones are skipped. The rows remain in the feed |
| `actions.carry_failed` | warning | a [Story class method that takes the `Request`](/deeper/stories#using-the-request) threw when a job was dispatched, where it runs to carry its actor to the worker. The dispatch went ahead, and the job published with the actor it would otherwise have had |
| `actions.request_helper` | warning | a Story class method reads the request through `request()` or the `Request` facade without taking `Illuminate\Http\Request $request`. It runs only when stories compile, never at a publish or in a queued job. Take the `Request` as a parameter instead. Found by reading the source, so it only ever warns |

### Surface

| Finding | Severity | Means |
|---|---|---|
| `surface.unwired` | warning | a `Feedable` model has never appeared in any role on any activity, and no headline names its type. Something should be publishing about it, or the `Feedable` is left over |
| `surface.unaliased` | warning | a `Feedable` model has no alias in the enforced morph map, so publishing anything that names it throws `ClassMorphViolationException`. Reported with or without recorded activities |
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

The `entities` check resolves every morph alias recorded in the actor, object,
target and context roles. Each finding names the role, the alias, the class,
how many activities carry it, and example activity ids.

| Finding | Severity | Means |
|---|---|---|
| `entities.auth_model` | warning | the authentication model does not implement `Feedable`. The actor role is filled from the authenticated user, so every request-time publish carries an actor that never resolves. Needs no traffic; skipped when `actor_resolver` is set |
| `entities.unresolvable` | warning | the alias resolves to no class: no morph map entry, and no class by that name |
| `entities.not_model` | warning | the alias resolves to a class that is not an Eloquent model, so it can never be snapshotted |
| `entities.unfeedable` | warning | the alias resolves to a model without `Feedable`, so it is never snapshotted. Implement `Feedable`, then run `storyfeed:trickle` |
| `entities.missing` | warning | the model is `Feedable`, but the row is gone or hidden by a global scope. Sampled from the 50 most recent uncached rows per role and alias, never a scan. `storyfeed:trickle --prune` retires the activities |
| `entities.opaque` | info | the model's table could not be queried, so nothing can be said about its rows |

The rows these findings name render without a label or a link, and the trickle
counts them as unresolved on every run. A row that exists but is not yet cached
is reported by `backlog`.

### Hydration

The `hydration` check calls each `Feedable` model's `feedMedia()` with a
context whose model loader is switched off, once per registered feed and once
with no feed. A resolver that asks for `$context->model()` is recorded, and no
query runs. Candidates are the `Feedable` models under `discovery.paths` plus
any class filling a role in recorded activities.

| Finding | Severity | Means |
|---|---|---|
| `hydration.model` | info | the class loads its model in `feedMedia()`, and under which feeds: one query per class on every page it appears on, batched across the page. Says so when `hydration.enabled` is off and the call answers `null` instead |
| `hydration.page` | info | how many hydrating classes the 30 most recent activities carry, so how many queries that page pays on top of its own |
| `hydration.opaque` | info | `feedMedia()` threw when probed with the class's latest snapshot, so whether it hydrates cannot be said |

The check is silent when no resolver hydrates. A class the morph map cannot
name is skipped; `surface` reports it as `surface.unaliased`. It probes with the newest
snapshot for the alias, so a resolver that hydrates only under an unregistered
feed name, or only for an older snapshot shape, is not seen. A class with no
snapshot that throws on an empty one is not reported.

<span id="generating-definitions"></span>

## Generating Missing Definitions

```bash
# routes/feed.php definitions, with their use lines
php artisan storyfeed:doctor --stubs

# a Story class per type and verb with no headline
php artisan make:story --from-doctor
```

`--stubs` prints the definitions the findings imply, ready for
`routes/feed.php`. After one order is placed with no definition:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')->headline(':actor placed :object');
// order.place: an icon from your app's own set; doctor cannot choose one.
// Story::for(Order::class)->verb('place')->icon('…');
```

With that headline written, one user places three orders, and several users
place an order for the same customer:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

// order.place: an icon from your app's own set; doctor cannot choose one.
// Story::for(Order::class)->verb('place')->icon('…');
Story::verb('place')->grouped(fn (GroupBuilder $group) => $group->actors(':actors placed :objects'));
Story::for(Order::class)->verb('place')->grouped(fn (GroupBuilder $group) => $group->repeat(':actor placed :objects'));
```

A group of one type, as a `repeat` group is, gets its headline on that type,
where a [Story class](/deeper/stories) files it: the finding names the key
`repeat.order.place`. A group that can hold several types, as an `actors`
group can, gets its headline on the verb alone, over tokens that name no type.

Each is a headline, an icon, an actorless verb, or a group headline. Where
doctor can write the sentence, the stub is live: the verb in the past tense,
over tokens that are safe for that headline. Where it cannot, the stub is
commented out beneath the reason and the safe tokens, and doctor keeps
reporting the gap until you write it: an icon, a verb whose past tense it
cannot spell for certain (`ship`), a key that covers every verb, or a group
whose axis does not pin the verb.
Every stub comes from what was recorded: pairs that occurred, axes the compiled
recipes apply, tokens that are pinned. `roles` and `aggregates.latent` emit no
stub; the first needs its sentence rewritten, the second would render nowhere.

The `--json` report carries each fix's `definition`. The output has no headings
or counts, so it can be piped. `// Nothing to
author` means no finding named a registry edit, not that there were no
findings.

`make:story --from-doctor` writes a Story class for each type and verb with no
headline instead. See
[Generating from Doctor Findings](/deeper/stories#generating-from-doctor-findings).

<span id="continuous-integration"></span>

## Running in CI

```bash
php artisan storyfeed:doctor --json --fail-on=warning   # or --fail-on=error
```

The [coverage assertions](/deeper/testing#coverage-assertions) fail fast in the
suite; doctor reports against real traffic.

<span id="empty-feeds"></span>

## Checking Empty Feeds

With no activities, traffic-dependent checks have nothing to inspect.
Configuration and declaration checks can still report findings, such as
missing tables or an unaliased model.
