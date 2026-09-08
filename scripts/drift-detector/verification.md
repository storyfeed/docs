# Verification — 2026-09-05

Core: `b6347c13b749a6a078e867f46bd8d48be557c0be` (clean working tree). Main: `244a79e722e205efedd3458b1756bbf738b23149`. Contract-refresh: `52a7fa8346963d604abaea0f8b118a939c0e2917`. Contract-refresh is not merged into main; inspected read-only without waiting or modifying it.

19 tests passed, including pinned real-main drift, live contract-refresh, synthetic Noun removals, live replacement APIs, exit codes, and precision regressions. No docs pages were edited.

| Docs ref | Exit | STALE | MISSING | UNRESOLVED |
| --- | --- | --- | --- | --- |
| main | 1 | 17 | 124 | 336 |
| contract-refresh | 0 | 0 | 114 | 350 |

## Complete main stale output

```text
docs/basics/feedable-models.md:11: Storyfeed\FeedLink → FeedMedia
docs/basics/feedable-models.md:25: FeedLink → FeedMedia
docs/basics/feedable-models.md:25: toFeedLink → feedMedia
docs/basics/feedable-models.md:27: FeedLink::make → FeedMedia
docs/basics/feedable-models.md:63: toFeedLink → feedMedia
docs/basics/feedable-models.md:69: toFeedLink → feedMedia
docs/basics/feedable-models.md:74: FeedLink → FeedMedia
docs/basics/feedable-models.md:77: FeedLink::make → FeedMedia
docs/basics/feedable-models.md:78: FeedLink::modal → FeedMedia
docs/deeper/activity-streams.md:74: toFeedLink → feedMedia
docs/guide/quickstart.md:32: Storyfeed\FeedLink → FeedMedia
docs/guide/quickstart.md:46: FeedLink → FeedMedia
docs/guide/quickstart.md:46: toFeedLink → feedMedia
docs/guide/quickstart.md:48: FeedLink::make → FeedMedia
docs/guide/quickstart.md:54: toFeedLink → feedMedia
docs/guide/quickstart.md:58: toFeedLink → feedMedia
docs/reference/payload.md:118: toFeedLink → feedMedia
```

All 17 findings are the known removed contract: eight method references and nine class/use/static-call references across four pages. Contract-refresh has no stale findings.

## False-positive suppression rules

No path-specific exclusions or identifier ignore list were added to make main pass. Main intentionally fails. The one migration-specific detection rule and four replacement hints are documented in README.md.

- Application/framework names (`Document`, `Model`, `Route`, `App\…`, `Illuminate\…`) and conflicting bindings: UNRESOLVED; no claim that these belong to core.
- Eloquent scopes/inherited methods, trait members, facade magic and constants (`Activity::where`, `Storyfeed::feed`, `FeedImage::SOME_CONSTANT`): UNRESOLVED if not declared on the indexed class. No assumption that missing declaration means missing runtime method.
- Receiverless functions/methods and dynamic attributes (`route`, `env`, `->name`, unknown `->toFeedLink()`): UNRESOLVED. Current public method/property names can be recognized without asserting a receiver type.
- Application homonyms (`App\FeedLink`, locally declared `FeedLink`, `App\Noun`, application `toFeedLink` functions/static calls): local bindings win; remain UNRESOLVED. Static methods cannot fall through into the bare-method migration rule.
- Grouped imports and namespace prefixes (`Storyfeed\{FeedImage, FeedContext}`, `Storyfeed\Support`): UNRESOLVED; namespace prefixes are not missing classes.
- Config-like route/view/translation names (`storyfeed.party`, synthetic `storyfeed.example`): UNRESOLVED unless the exact occurrence is an explicit literal `config()` argument. The regression test caught `route("storyfeed.example")` being falsely stale when a separate config call appeared on the same line; matching the immediate call prefix fixed it.
- PHP comments, strings, ordinary prose, non-PHP fences and generated output are not taught class references. Tests cover `Storyfeed\NotReal` inside comments/strings and `FeedLink` inside a JavaScript fence.
- Public constructor-promoted properties and enum built-ins are indexed as existing; private/protected declarations and comments do not create fake public API.

The following exhaustive inventory records every candidate withheld from STALE in both verification runs, including its reason and all locations. These are not all proven false positives: some are deliberately unresolved potential drift. Valid existing APIs are resolved normally, not ignored.

## main: complete unresolved/suppression inventory


### Could be a route, view, or translation name rather than config

- `storyfeed.party` — `docs/deeper/parties.md:20`, `docs/reference/configuration.md:20`
- `storyfeed.php` — `docs/basics/feedable-models.md:148`, `docs/guide/installation.md:54`, `docs/reference/configuration.md:3`

### Grouped imports require binding expansion

- `$list = function (array $node, string $role) use ($entity, $overflow) {` — `docs/guide/quickstart.md:234`
- `$one = function (array $node, string $role, string $fallback) use ($entity) {` — `docs/guide/quickstart.md:218`

### Inherited, trait, dynamic member, or constant requires receiver resolution

- `ActivityType::Add` — `docs/basics/verbs.md:84`, `docs/deeper/activity-streams.md:69`
- `ActivityType::Create` — `docs/basics/verbs.md:85`
- `FeedBuilder::for` — `docs/guide/upgrading.md:91`
- `Storyfeed::feed` — `docs/basics/named-feeds.md:7`, `docs/basics/named-feeds.md:13`, `docs/basics/named-feeds.md:14`, `docs/basics/named-feeds.md:33`, `docs/basics/named-feeds.md:34`, `docs/basics/named-feeds.md:65`, `docs/basics/named-feeds.md:80`, `docs/basics/named-feeds.md:81`, `docs/basics/named-feeds.md:82`, `docs/basics/named-feeds.md:98`, `docs/basics/named-feeds.md:173`, `docs/basics/named-feeds.md:199`
- `Storyfeed::feeds` — `docs/basics/named-feeds.md:50`, `docs/basics/named-feeds.md:232`

### No unambiguous core class binding (application, framework, or ambiguous name)

- `A` — `docs/basics/named-feeds.md:91`, `docs/basics/named-feeds.md:159`
- `AND` — `docs/guide/upgrading.md:34`, `docs/guide/upgrading.md:52`
- `ActivityVerb` — `docs/basics/verbs.md:38`
- `ActivityVerb::Comment` — `docs/basics/recording.md:142`, `docs/basics/verbs.md:58`
- `ActivityVerb::Confirm` — `docs/basics/recording.md:143`
- `ActivityVerb::class` — `docs/basics/verbs.md:51`
- `AdminFeed` — `docs/basics/named-feeds.md:218`
- `AdminFeed::class` — `docs/basics/named-feeds.md:234`
- `AdminFeed::make` — `docs/basics/named-feeds.md:226`
- `Aiko` — `docs/basics/live-renderer.md:331`, `docs/basics/live-renderer.md:333`
- `Anatomy` — `docs/tone-lab.md:37`
- `App\Feeds` — `docs/basics/named-feeds.md:116`
- `App\Models\Document` — `docs/basics/stories.md:7`, `docs/guide/quickstart.md:81`
- `App\Models\Order` — `docs/basics/named-feeds.md:118`, `docs/basics/named-feeds.md:145`
- `ArgumentCountError` — `docs/basics/named-feeds.md:149`, `docs/basics/named-feeds.md:161`
- `ArrayAccess` — `docs/basics/reading.md:26`
- `Arrayable` — `docs/basics/reading.md:25`
- `AsFeedVerb` — `docs/basics/verbs.md:40`, `docs/basics/verbs.md:54`
- `B` — `docs/basics/named-feeds.md:91`
- `Both` — `docs/guide/quickstart.md:262`
- `Chronological` — `docs/basics/live-renderer.md:331`
- `Client::class` — `docs/deeper/testing.md:54`
- `Comment` — `docs/basics/verbs.md:43`, `docs/basics/verbs.md:85`
- `Composing` — `docs/guide/quickstart.md:264`
- `Conditionable` — `docs/basics/reading.md:183`
- `Confirm` — `docs/basics/verbs.md:44`
- `CursorPaginator` — `docs/deeper/activity-streams.md:35`
- `Customer` — `docs/basics/named-feeds.md:145`
- `CustomerFeed` — `docs/basics/named-feeds.md:122`, `docs/basics/named-feeds.md:206`
- `CustomerFeed::__construct` — `docs/basics/named-feeds.md:159`
- `CustomerFeed::class` — `docs/basics/named-feeds.md:233`
- `CustomerFeed::make` — `docs/basics/named-feeds.md:142`, `docs/basics/named-feeds.md:148`, `docs/basics/named-feeds.md:149`, `docs/basics/named-feeds.md:158`, `docs/basics/named-feeds.md:172`, `docs/basics/named-feeds.md:194`, `docs/basics/named-feeds.md:195`, `docs/basics/named-feeds.md:240`, `docs/basics/named-feeds.md:251`, `docs/guide/upgrading.md:69`, `docs/guide/upgrading.md:70`
- `Date` — `docs/.vitepress/theme/feed/README.md:51`
- `Deja` — `docs/basics/live-renderer.md:334`
- `Delivery` — `docs/deeper/events.md:12`
- `DeliveryConfirmed` — `docs/deeper/events.md:10`
- `DeliveryWasConfirmed::class` — `docs/deeper/events.md:16`, `docs/deeper/events.md:33`
- `Document` — `docs/basics/feedable-models.md:13`, `docs/deeper/composites.md:45`, `docs/guide/quickstart.md:34`
- `Document::class` — `docs/basics/feedable-models.md:138`, `docs/basics/stories.md:13`, `docs/guide/quickstart.md:67`, `docs/guide/quickstart.md:87`
- `DocumentWasUploaded` — `docs/basics/stories.md:11`, `docs/basics/stories.md:67`, `docs/guide/quickstart.md:85`, `docs/guide/quickstart.md:111`
- `DocumentWasUploaded::class` — `docs/basics/stories.md:45`, `docs/guide/quickstart.md:115`
- `EntityAvatar` — `docs/.vitepress/theme/feed/README.md:17`
- `EntityLink` — `docs/.vitepress/theme/feed/README.md:18`
- `Export` — `docs/basics/live-renderer.md:333`
- `FEED_LINK` — `docs/.vitepress/theme/feed/README.md:20`
- `FEED_NOW` — `docs/.vitepress/theme/feed/README.md:20`, `docs/.vitepress/theme/feed/README.md:51`, `docs/.vitepress/theme/feed/README.md:104`, `docs/.vitepress/theme/feed/README.md:107`
- `FeedGroup` — `docs/.vitepress/theme/feed/README.md:14`
- `FeedHeadline` — `docs/.vitepress/theme/feed/README.md:15`
- `FeedIcon` — `docs/.vitepress/theme/feed/README.md:16`, `docs/.vitepress/theme/feed/README.md:98`
- `FeedItem` — `docs/.vitepress/theme/feed/README.md:13`
- `FeedNode` — `docs/.vitepress/theme/feed/README.md:12`, `docs/basics/live-renderer.md:319`
- `FeedStream` — `docs/.vitepress/theme/feed/README.md:11`
- `GET` — `docs/.vitepress/theme/feed/README.md:40`, `docs/deeper/activity-streams.md:16`, `docs/deeper/activity-streams.md:23`, `docs/guide/upgrading.md:80`
- `GroupNode` — `docs/basics/live-renderer.md:72`
- `Illuminate\Database\Eloquent\Model` — `docs/basics/feedable-models.md:7`, `docs/guide/quickstart.md:28`
- `InteractsWithFeed` — `docs/basics/feedable-models.md:15`, `docs/basics/feedable-models.md:83`, `docs/guide/quickstart.md:36`
- `JsonSerializable` — `docs/basics/reading.md:25`
- `Kerning` — `docs/basics/live-renderer.md:334`
- `Marcus` — `docs/basics/live-renderer.md:330`, `docs/basics/live-renderer.md:331`
- `MemberJoined` — `docs/basics/stories.md:68`
- `MemberWasJoined` — `docs/basics/stories.md:68`
- `Migration` — `docs/basics/live-renderer.md:332`
- `Model` — `docs/basics/feedable-models.md:13`, `docs/deeper/composites.md:45`, `docs/guide/quickstart.md:34`
- `Name` — `docs/basics/named-feeds.md:273`
- `Nguyen` — `docs/basics/live-renderer.md:330`
- `NullStrategy` — `docs/reference/configuration.md:35`
- `OR` — `docs/guide/upgrading.md:34`
- `Object` — `docs/basics/stories.md:66`
- `Order` — `docs/basics/named-feeds.md:124`, `docs/basics/named-feeds.md:208`
- `OrderVerb::Paid` — `docs/basics/named-feeds.md:81`
- `OrderedCollection` — `docs/deeper/activity-streams.md:30`, `docs/deeper/activity-streams.md:62`, `docs/deeper/composites.md:36`
- `OrderedCollectionPage` — `docs/deeper/activity-streams.md:30`
- `Port` — `docs/basics/live-renderer.md:332`
- `Priya` — `docs/basics/live-renderer.md:329`, `docs/basics/live-renderer.md:330`, `docs/basics/live-renderer.md:331`
- `Project::class` — `docs/basics/feedable-models.md:139`, `docs/guide/quickstart.md:68`
- `Raman` — `docs/basics/live-renderer.md:329`, `docs/basics/live-renderer.md:330`, `docs/basics/live-renderer.md:331`
- `RefreshDatabase` — `docs/deeper/testing.md:65`
- `Relation::enforceMorphMap` — `docs/basics/feedable-models.md:137`, `docs/guide/quickstart.md:66`
- `Render` — `docs/guide/quickstart.md:263`
- `Responsable` — `docs/basics/reading.md:25`, `docs/guide/quickstart.md:159`
- `Restore` — `docs/basics/live-renderer.md:331`
- `Rewrite` — `docs/basics/live-renderer.md:329`
- `Rivera` — `docs/basics/live-renderer.md:332`
- `Route::get` — `docs/basics/reading.md:13`, `docs/guide/quickstart.md:162`
- `Sally` — `docs/basics/live-renderer.md:330`
- `Schedule::command` — `docs/basics/feedable-models.md:96`, `docs/deeper/composites.md:80`, `docs/guide/installation.md:69`, `docs/guide/installation.md:70`, `docs/guide/installation.md:71`, `docs/reference/commands.md:13`, `docs/reference/commands.md:14`, `docs/reference/commands.md:15`
- `Simplify` — `docs/basics/live-renderer.md:334`
- `Storyfeed` — `docs/guide/installation.md:17`
- `Storyfeed::activity` — `docs/basics/recording.md:18`, `docs/basics/recording.md:91`, `docs/basics/recording.md:102`, `docs/basics/recording.md:120`, `docs/basics/recording.md:121`, `docs/basics/recording.md:122`, `docs/basics/verbs.md:17`, `docs/deeper/composites.md:22`, `docs/deeper/context.md:19`, `docs/deeper/parties.md:35`, `docs/guide/quickstart.md:127`, `docs/guide/usage-examples.md:76`, `docs/guide/usage-examples.md:91`, `docs/guide/usage-examples.md:108`, `docs/guide/usage-examples.md:119`, `docs/guide/usage-examples.md:130`, `docs/guide/usage-examples.md:148`, `docs/guide/usage-examples.md:163`, `docs/guide/usage-examples.md:180`
- `Storyfeed::aggregateGrammar` — `docs/deeper/composites.md:98`, `docs/deeper/grammar.md:11`, `docs/deeper/grammar.md:65`
- `Storyfeed::as` — `docs/basics/recording.md:75`, `docs/deeper/parties.md:48`
- `Storyfeed::assertNotPublished` — `docs/deeper/testing.md:12`
- `Storyfeed::assertNothingPublished` — `docs/deeper/testing.md:13`
- `Storyfeed::assertPublished` — `docs/deeper/testing.md:10`
- `Storyfeed::assertPublishedCount` — `docs/deeper/testing.md:11`
- `Storyfeed::axes` — `docs/deeper/aggregation.md:66`, `docs/deeper/aggregation.md:83`
- `Storyfeed::collectables` — `docs/deeper/composites.md:52`
- `Storyfeed::fake` — `docs/deeper/testing.md:6`
- `Storyfeed::feed` — `docs/basics/feedable-models.md:116`, `docs/basics/reading.md:4`, `docs/basics/reading.md:13`, `docs/basics/reading.md:47`, `docs/basics/reading.md:159`, `docs/basics/reading.md:186`, `docs/guide/introduction.md:13`, `docs/guide/quickstart.md:146`, `docs/guide/quickstart.md:162`, `docs/guide/quickstart.md:180`, `docs/guide/quickstart.md:193`, `docs/guide/upgrading.md:95`, `docs/guide/upgrading.md:125`, `docs/guide/upgrading.md:126`, `docs/guide/upgrading.md:127`
- `Storyfeed::feeds` — `docs/reference/doctor.md:47`
- `Storyfeed::grammar` — `docs/deeper/composites.md:99`, `docs/deeper/grammar.md:7`, `docs/deeper/grammar.md:66`, `docs/deeper/grammar.md:100`
- `Storyfeed::icons` — `docs/deeper/grammar.md:86`
- `Storyfeed::party` — `docs/deeper/parties.md:25`, `docs/deeper/parties.md:37`
- `Storyfeed::record` — `docs/basics/recording.md:30`, `docs/basics/recording.md:76`, `docs/basics/recording.md:154`, `docs/deeper/parties.md:27`, `docs/deeper/parties.md:49`, `docs/guide/introduction.md:396`, `docs/guide/quickstart.md:137`
- `Storyfeed::stories` — `docs/basics/stories.md:44`, `docs/guide/quickstart.md:114`
- `Storyfeed::verbs` — `docs/basics/verbs.md:51`
- `Symbol` — `docs/.vitepress/theme/feed/README.md:105`
- `Tanaka` — `docs/basics/live-renderer.md:331`, `docs/basics/live-renderer.md:333`
- `Tom` — `docs/basics/live-renderer.md:332`
- `TypeError` — `docs/basics/named-feeds.md:149`
- `Upload` — `docs/basics/verbs.md:42`, `docs/basics/verbs.md:84`
- `User` — `docs/deeper/events.md:12`
- `User::class` — `docs/basics/feedable-models.md:144`, `docs/guide/quickstart.md:71`
- `Verb` — `docs/basics/named-feeds.md:272`
- `Verbed` — `docs/basics/stories.md:66`
- `Was` — `docs/basics/stories.md:66`
- `Webb` — `docs/basics/live-renderer.md:330`, `docs/basics/live-renderer.md:331`
- `Williams` — `docs/basics/live-renderer.md:334`
- `\Carbon\Carbon::parse` — `docs/guide/quickstart.md:272`

### Property receiver or dynamic model attribute not proven

- `->delivery` — `docs/deeper/events.md:17`, `docs/deeper/events.md:31`, `docs/deeper/events.md:33`
- `->id` — `docs/basics/feedable-models.md:21`, `docs/guide/quickstart.md:42`
- `->order` — `docs/basics/named-feeds.md:136`, `docs/basics/named-feeds.md:185`
- `->project` — `docs/basics/reading.md:187`
- `->project_id` — `docs/basics/feedable-models.md:21`, `docs/guide/quickstart.md:42`
- `->status` — `docs/basics/feedable-models.md:159`
- `->user` — `docs/deeper/events.md:18`

### Receiver/function ownership not proven

- `__` — `docs/deeper/grammar.md:101`
- `and` — `docs/guide/upgrading.md:52`
- `app_path` — `docs/reference/configuration.md:80`
- `array_map` — `docs/guide/quickstart.md:235`
- `as` — `docs/basics/recording.md:72`
- `authorize` — `docs/basics/named-feeds.md:264`
- `curated` — `docs/guide/upgrading.md:127`
- `daily` — `docs/guide/installation.md:71`, `docs/reference/commands.md:15`
- `declares` — `docs/basics/named-feeds.md:159`
- `defineOptions` — `docs/basics/live-renderer.md:321`
- `diffForHumans` — `docs/guide/quickstart.md:272`
- `e` — `docs/guide/quickstart.md:206`, `docs/guide/quickstart.md:208`, `docs/guide/quickstart.md:211`
- `elseif` — `docs/guide/quickstart.md:259`, `docs/guide/quickstart.md:261`
- `entity` — `docs/guide/quickstart.md:219`, `docs/guide/quickstart.md:235`
- `everyFiveMinutes` — `docs/deeper/composites.md:80`, `docs/guide/installation.md:70`, `docs/reference/commands.md:14`
- `everyMinute` — `docs/basics/feedable-models.md:96`, `docs/guide/installation.md:69`, `docs/reference/commands.md:13`
- `flat` — `docs/guide/upgrading.md:125`
- `for` — `docs/basics/recording.md:21`, `docs/basics/recording.md:54`, `docs/guide/upgrading.md:95`, `docs/guide/upgrading.md:98`, `docs/guide/usage-examples.md:200`, `docs/reference/compatibility.md:39`
- `grouped` — `docs/guide/upgrading.md:126`
- `implode` — `docs/guide/quickstart.md:238`
- `inject` — `docs/.vitepress/theme/feed/README.md:107`
- `isInternal` — `docs/deeper/events.md:31`
- `leaks` — `docs/basics/rendering.md:118`
- `list` — `docs/guide/quickstart.md:252`, `docs/guide/quickstart.md:253`, `docs/guide/quickstart.md:254`, `docs/guide/quickstart.md:255`
- `max` — `docs/guide/quickstart.md:228`
- `now` — `docs/basics/reading.md:112`
- `offset` — `docs/basics/reading.md:126`
- `one` — `docs/basics/live-renderer.md:73`, `docs/guide/quickstart.md:248`, `docs/guide/quickstart.md:249`, `docs/guide/quickstart.md:250`, `docs/guide/quickstart.md:251`
- `orWhere` — `docs/basics/reading.md:139`
- `overflow` — `docs/guide/quickstart.md:236`, `docs/guide/quickstart.md:257`
- `provide` — `docs/.vitepress/theme/feed/README.md:51`, `docs/.vitepress/theme/feed/README.md:106`
- `route` — `docs/basics/feedable-models.md:27`, `docs/guide/quickstart.md:48`
- `scope` — `docs/basics/named-feeds.md:134`, `docs/basics/named-feeds.md:181`, `docs/basics/named-feeds.md:191`, `docs/basics/named-feeds.md:215`
- `static` — `docs/basics/named-feeds.md:147`
- `strtr` — `docs/guide/quickstart.md:247`
- `subWeek` — `docs/basics/reading.md:112`
- `when` — `docs/basics/reading.md:187`
- `where` — `docs/basics/reading.md:112`, `docs/basics/reading.md:139`
- `whereNot` — `docs/basics/reading.md:107`
## contract-refresh: complete unresolved/suppression inventory


### Could be a route, view, or translation name rather than config

- `storyfeed.party` — `docs/deeper/parties.md:20`, `docs/reference/configuration.md:20`
- `storyfeed.php` — `docs/basics/feedable-models.md:267`, `docs/guide/installation.md:54`, `docs/reference/configuration.md:3`

### Grouped imports require binding expansion

- `$list = function (array $node, string $role) use ($entity, $overflow) {` — `docs/guide/quickstart.md:237`
- `$one = function (array $node, string $role, string $fallback) use ($entity) {` — `docs/guide/quickstart.md:221`

### Inherited, trait, dynamic member, or constant requires receiver resolution

- `ActivityType::Add` — `docs/basics/verbs.md:84`, `docs/deeper/activity-streams.md:73`
- `ActivityType::Create` — `docs/basics/verbs.md:85`
- `FeedBuilder::for` — `docs/guide/upgrading.md:91`
- `Storyfeed::feed` — `docs/basics/named-feeds.md:7`, `docs/basics/named-feeds.md:13`, `docs/basics/named-feeds.md:14`, `docs/basics/named-feeds.md:33`, `docs/basics/named-feeds.md:34`, `docs/basics/named-feeds.md:65`, `docs/basics/named-feeds.md:80`, `docs/basics/named-feeds.md:81`, `docs/basics/named-feeds.md:82`, `docs/basics/named-feeds.md:98`, `docs/basics/named-feeds.md:173`, `docs/basics/named-feeds.md:199`
- `Storyfeed::feeds` — `docs/basics/named-feeds.md:50`, `docs/basics/named-feeds.md:232`

### No unambiguous core class binding (application, framework, or ambiguous name)

- `A` — `docs/basics/named-feeds.md:91`, `docs/basics/named-feeds.md:159`
- `AND` — `docs/guide/upgrading.md:34`, `docs/guide/upgrading.md:52`
- `ActivityVerb` — `docs/basics/verbs.md:38`
- `ActivityVerb::Comment` — `docs/basics/recording.md:144`, `docs/basics/verbs.md:58`
- `ActivityVerb::Confirm` — `docs/basics/recording.md:145`
- `ActivityVerb::class` — `docs/basics/verbs.md:51`
- `AdminFeed` — `docs/basics/named-feeds.md:218`
- `AdminFeed::class` — `docs/basics/named-feeds.md:234`
- `AdminFeed::make` — `docs/basics/named-feeds.md:226`
- `AdminFeed::name` — `docs/basics/feedable-models.md:131`
- `Aiko` — `docs/basics/live-renderer.md:331`, `docs/basics/live-renderer.md:333`
- `Anatomy` — `docs/tone-lab.md:37`
- `App\Feeds` — `docs/basics/named-feeds.md:116`
- `App\Models\Document` — `docs/basics/stories.md:7`, `docs/guide/quickstart.md:83`
- `App\Models\Order` — `docs/basics/named-feeds.md:118`, `docs/basics/named-feeds.md:145`
- `ArgumentCountError` — `docs/basics/named-feeds.md:149`, `docs/basics/named-feeds.md:161`
- `ArrayAccess` — `docs/basics/reading.md:26`
- `Arrayable` — `docs/basics/reading.md:25`
- `AsFeedVerb` — `docs/basics/verbs.md:40`, `docs/basics/verbs.md:54`
- `B` — `docs/basics/named-feeds.md:91`
- `BackedEnum` — `docs/basics/stories.md:16`, `docs/guide/quickstart.md:92`
- `Both` — `docs/guide/quickstart.md:265`
- `Chronological` — `docs/basics/live-renderer.md:331`
- `Client::class` — `docs/deeper/testing.md:54`
- `Comment` — `docs/basics/verbs.md:43`, `docs/basics/verbs.md:85`
- `Composing` — `docs/guide/quickstart.md:267`
- `Conditionable` — `docs/basics/reading.md:183`
- `Confirm` — `docs/basics/verbs.md:44`
- `CursorPaginator` — `docs/deeper/activity-streams.md:35`
- `Customer` — `docs/basics/named-feeds.md:145`
- `CustomerFeed` — `docs/basics/named-feeds.md:122`, `docs/basics/named-feeds.md:206`
- `CustomerFeed::__construct` — `docs/basics/named-feeds.md:159`
- `CustomerFeed::class` — `docs/basics/named-feeds.md:233`
- `CustomerFeed::make` — `docs/basics/named-feeds.md:142`, `docs/basics/named-feeds.md:148`, `docs/basics/named-feeds.md:149`, `docs/basics/named-feeds.md:158`, `docs/basics/named-feeds.md:172`, `docs/basics/named-feeds.md:194`, `docs/basics/named-feeds.md:195`, `docs/basics/named-feeds.md:240`, `docs/basics/named-feeds.md:251`, `docs/guide/upgrading.md:69`, `docs/guide/upgrading.md:70`
- `Date` — `docs/.vitepress/theme/feed/README.md:51`
- `Deja` — `docs/basics/live-renderer.md:334`
- `Delivery` — `docs/deeper/events.md:12`
- `DeliveryConfirmed` — `docs/deeper/events.md:10`
- `DeliveryWasConfirmed::class` — `docs/deeper/events.md:16`, `docs/deeper/events.md:33`
- `Document` — `docs/basics/feedable-models.md:14`, `docs/deeper/composites.md:45`, `docs/guide/quickstart.md:35`
- `Document::class` — `docs/basics/feedable-models.md:257`, `docs/basics/stories.md:14`, `docs/guide/quickstart.md:69`, `docs/guide/quickstart.md:90`
- `DocumentWasUploaded` — `docs/basics/stories.md:12`, `docs/basics/stories.md:68`, `docs/guide/quickstart.md:88`, `docs/guide/quickstart.md:114`
- `DocumentWasUploaded::class` — `docs/basics/stories.md:46`, `docs/guide/quickstart.md:118`
- `EntityAvatar` — `docs/.vitepress/theme/feed/README.md:17`
- `EntityLink` — `docs/.vitepress/theme/feed/README.md:18`
- `Export` — `docs/basics/live-renderer.md:333`
- `FEED_LINK` — `docs/.vitepress/theme/feed/README.md:20`
- `FEED_NOW` — `docs/.vitepress/theme/feed/README.md:20`, `docs/.vitepress/theme/feed/README.md:51`, `docs/.vitepress/theme/feed/README.md:104`, `docs/.vitepress/theme/feed/README.md:107`
- `FeedGroup` — `docs/.vitepress/theme/feed/README.md:14`
- `FeedHeadline` — `docs/.vitepress/theme/feed/README.md:15`
- `FeedIcon` — `docs/.vitepress/theme/feed/README.md:16`, `docs/.vitepress/theme/feed/README.md:98`
- `FeedItem` — `docs/.vitepress/theme/feed/README.md:13`
- `FeedNode` — `docs/.vitepress/theme/feed/README.md:12`, `docs/basics/live-renderer.md:319`
- `FeedStream` — `docs/.vitepress/theme/feed/README.md:11`
- `GET` — `docs/.vitepress/theme/feed/README.md:40`, `docs/deeper/activity-streams.md:16`, `docs/deeper/activity-streams.md:23`, `docs/guide/upgrading.md:80`
- `GroupNode` — `docs/basics/live-renderer.md:72`
- `Illuminate\Database\Eloquent\Model` — `docs/basics/feedable-models.md:7`, `docs/guide/quickstart.md:28`
- `InteractsWithFeed` — `docs/basics/feedable-models.md:16`, `docs/basics/feedable-models.md:70`, `docs/basics/feedable-models.md:202`, `docs/guide/quickstart.md:37`, `docs/guide/quickstart.md:60`
- `JsonSerializable` — `docs/basics/reading.md:25`
- `Kerning` — `docs/basics/live-renderer.md:334`
- `Link` — `docs/deeper/activity-streams.md:64`, `docs/deeper/activity-streams.md:65`
- `Marcus` — `docs/basics/live-renderer.md:330`, `docs/basics/live-renderer.md:331`
- `MemberJoined` — `docs/basics/stories.md:69`
- `MemberWasJoined` — `docs/basics/stories.md:69`
- `Migration` — `docs/basics/live-renderer.md:332`
- `Model` — `docs/basics/feedable-models.md:14`, `docs/deeper/composites.md:45`, `docs/guide/quickstart.md:35`
- `Name` — `docs/basics/named-feeds.md:273`
- `Nguyen` — `docs/basics/live-renderer.md:330`
- `NullStrategy` — `docs/reference/configuration.md:35`
- `OR` — `docs/guide/upgrading.md:34`
- `Object` — `docs/basics/stories.md:67`
- `Order` — `docs/basics/named-feeds.md:124`, `docs/basics/named-feeds.md:208`
- `OrderVerb::Paid` — `docs/basics/named-feeds.md:81`
- `OrderedCollection` — `docs/deeper/activity-streams.md:30`, `docs/deeper/activity-streams.md:62`, `docs/deeper/composites.md:36`
- `OrderedCollectionPage` — `docs/deeper/activity-streams.md:30`
- `Port` — `docs/basics/live-renderer.md:332`
- `Priya` — `docs/basics/live-renderer.md:329`, `docs/basics/live-renderer.md:330`, `docs/basics/live-renderer.md:331`
- `Project` — `docs/guide/quickstart.md:60`
- `Project::class` — `docs/basics/feedable-models.md:258`, `docs/guide/quickstart.md:70`
- `Raman` — `docs/basics/live-renderer.md:329`, `docs/basics/live-renderer.md:330`, `docs/basics/live-renderer.md:331`
- `RefreshDatabase` — `docs/deeper/testing.md:65`
- `Relation::enforceMorphMap` — `docs/basics/feedable-models.md:256`, `docs/guide/quickstart.md:68`
- `Render` — `docs/guide/quickstart.md:266`
- `Responsable` — `docs/basics/reading.md:25`, `docs/guide/quickstart.md:162`
- `Restore` — `docs/basics/live-renderer.md:331`
- `Rewrite` — `docs/basics/live-renderer.md:329`
- `Rivera` — `docs/basics/live-renderer.md:332`
- `Route::get` — `docs/basics/reading.md:13`, `docs/guide/quickstart.md:165`
- `Sally` — `docs/basics/live-renderer.md:330`
- `Schedule::command` — `docs/basics/feedable-models.md:215`, `docs/deeper/composites.md:80`, `docs/guide/installation.md:69`, `docs/guide/installation.md:70`, `docs/guide/installation.md:71`, `docs/reference/commands.md:13`, `docs/reference/commands.md:14`, `docs/reference/commands.md:15`
- `Simplify` — `docs/basics/live-renderer.md:334`
- `Storyfeed` — `docs/guide/installation.md:17`
- `Storyfeed::activity` — `docs/basics/recording.md:18`, `docs/basics/recording.md:91`, `docs/basics/recording.md:102`, `docs/basics/recording.md:122`, `docs/basics/recording.md:123`, `docs/basics/recording.md:124`, `docs/basics/verbs.md:17`, `docs/deeper/composites.md:22`, `docs/deeper/context.md:19`, `docs/deeper/parties.md:35`, `docs/guide/quickstart.md:130`, `docs/guide/usage-examples.md:76`, `docs/guide/usage-examples.md:91`, `docs/guide/usage-examples.md:108`, `docs/guide/usage-examples.md:119`, `docs/guide/usage-examples.md:130`, `docs/guide/usage-examples.md:148`, `docs/guide/usage-examples.md:163`, `docs/guide/usage-examples.md:180`
- `Storyfeed::aggregateGrammar` — `docs/deeper/composites.md:98`, `docs/deeper/grammar.md:11`, `docs/deeper/grammar.md:65`
- `Storyfeed::as` — `docs/basics/recording.md:75`, `docs/deeper/parties.md:48`
- `Storyfeed::assertNotPublished` — `docs/deeper/testing.md:12`
- `Storyfeed::assertNothingPublished` — `docs/deeper/testing.md:13`
- `Storyfeed::assertPublished` — `docs/deeper/testing.md:10`
- `Storyfeed::assertPublishedCount` — `docs/deeper/testing.md:11`
- `Storyfeed::axes` — `docs/deeper/aggregation.md:66`, `docs/deeper/aggregation.md:83`
- `Storyfeed::collectables` — `docs/deeper/composites.md:52`
- `Storyfeed::fake` — `docs/deeper/testing.md:6`
- `Storyfeed::feed` — `docs/basics/feedable-models.md:235`, `docs/basics/reading.md:4`, `docs/basics/reading.md:13`, `docs/basics/reading.md:47`, `docs/basics/reading.md:159`, `docs/basics/reading.md:186`, `docs/guide/introduction.md:13`, `docs/guide/quickstart.md:149`, `docs/guide/quickstart.md:165`, `docs/guide/quickstart.md:183`, `docs/guide/quickstart.md:196`, `docs/guide/upgrading.md:95`, `docs/guide/upgrading.md:125`, `docs/guide/upgrading.md:126`, `docs/guide/upgrading.md:127`
- `Storyfeed::feeds` — `docs/reference/doctor.md:47`
- `Storyfeed::grammar` — `docs/deeper/composites.md:99`, `docs/deeper/grammar.md:7`, `docs/deeper/grammar.md:66`, `docs/deeper/grammar.md:100`
- `Storyfeed::icons` — `docs/deeper/grammar.md:86`
- `Storyfeed::party` — `docs/deeper/parties.md:25`, `docs/deeper/parties.md:37`
- `Storyfeed::record` — `docs/basics/recording.md:30`, `docs/basics/recording.md:76`, `docs/basics/recording.md:156`, `docs/deeper/parties.md:27`, `docs/deeper/parties.md:49`, `docs/guide/introduction.md:396`, `docs/guide/quickstart.md:140`
- `Storyfeed::stories` — `docs/basics/stories.md:45`, `docs/guide/quickstart.md:117`
- `Storyfeed::verbs` — `docs/basics/verbs.md:51`
- `Symbol` — `docs/.vitepress/theme/feed/README.md:105`
- `Tanaka` — `docs/basics/live-renderer.md:331`, `docs/basics/live-renderer.md:333`
- `Tom` — `docs/basics/live-renderer.md:332`
- `TypeError` — `docs/basics/named-feeds.md:149`
- `Upload` — `docs/basics/verbs.md:42`, `docs/basics/verbs.md:84`
- `User` — `docs/deeper/events.md:12`, `docs/guide/quickstart.md:60`
- `User::class` — `docs/basics/feedable-models.md:263`, `docs/guide/quickstart.md:73`
- `Verb` — `docs/basics/named-feeds.md:272`
- `Verbed` — `docs/basics/stories.md:67`
- `Was` — `docs/basics/stories.md:67`
- `Webb` — `docs/basics/live-renderer.md:330`, `docs/basics/live-renderer.md:331`
- `Williams` — `docs/basics/live-renderer.md:334`
- `\Carbon\Carbon::parse` — `docs/guide/quickstart.md:275`

### Property receiver or dynamic model attribute not proven

- `->delivery` — `docs/deeper/events.md:17`, `docs/deeper/events.md:31`, `docs/deeper/events.md:33`
- `->id` — `docs/basics/feedable-models.md:22`, `docs/guide/quickstart.md:43`
- `->order` — `docs/basics/named-feeds.md:136`, `docs/basics/named-feeds.md:185`
- `->project` — `docs/basics/reading.md:187`
- `->project_id` — `docs/basics/feedable-models.md:22`, `docs/guide/quickstart.md:43`
- `->status` — `docs/basics/feedable-models.md:278`
- `->user` — `docs/deeper/events.md:18`

### Receiver/function ownership not proven

- `__` — `docs/deeper/grammar.md:101`
- `and` — `docs/guide/upgrading.md:52`
- `app_path` — `docs/reference/configuration.md:80`
- `array_map` — `docs/guide/quickstart.md:238`
- `as` — `docs/basics/recording.md:72`
- `authorize` — `docs/basics/named-feeds.md:264`
- `curated` — `docs/guide/upgrading.md:127`
- `daily` — `docs/guide/installation.md:71`, `docs/reference/commands.md:15`
- `declares` — `docs/basics/named-feeds.md:159`
- `defineOptions` — `docs/basics/live-renderer.md:321`
- `diffForHumans` — `docs/guide/quickstart.md:275`
- `e` — `docs/guide/quickstart.md:209`, `docs/guide/quickstart.md:211`, `docs/guide/quickstart.md:214`
- `elseif` — `docs/guide/quickstart.md:262`, `docs/guide/quickstart.md:264`
- `entity` — `docs/guide/quickstart.md:222`, `docs/guide/quickstart.md:238`
- `everyFiveMinutes` — `docs/deeper/composites.md:80`, `docs/guide/installation.md:70`, `docs/reference/commands.md:14`
- `everyMinute` — `docs/basics/feedable-models.md:215`, `docs/guide/installation.md:69`, `docs/reference/commands.md:13`
- `flat` — `docs/guide/upgrading.md:125`
- `for` — `docs/basics/recording.md:21`, `docs/basics/recording.md:54`, `docs/guide/upgrading.md:95`, `docs/guide/upgrading.md:98`, `docs/guide/usage-examples.md:200`, `docs/reference/compatibility.md:39`
- `grouped` — `docs/guide/upgrading.md:126`
- `implode` — `docs/guide/quickstart.md:241`
- `inject` — `docs/.vitepress/theme/feed/README.md:107`
- `isInternal` — `docs/deeper/events.md:31`
- `leaks` — `docs/basics/rendering.md:118`
- `list` — `docs/guide/quickstart.md:255`, `docs/guide/quickstart.md:256`, `docs/guide/quickstart.md:257`, `docs/guide/quickstart.md:258`
- `max` — `docs/guide/quickstart.md:231`
- `now` — `docs/basics/reading.md:112`
- `offset` — `docs/basics/reading.md:126`
- `one` — `docs/basics/live-renderer.md:73`, `docs/guide/quickstart.md:251`, `docs/guide/quickstart.md:252`, `docs/guide/quickstart.md:253`, `docs/guide/quickstart.md:254`
- `orWhere` — `docs/basics/reading.md:139`
- `overflow` — `docs/guide/quickstart.md:239`, `docs/guide/quickstart.md:260`
- `provide` — `docs/.vitepress/theme/feed/README.md:51`, `docs/.vitepress/theme/feed/README.md:106`
- `route` — `docs/basics/feedable-models.md:29`, `docs/basics/feedable-models.md:120`, `docs/basics/feedable-models.md:123`, `docs/basics/feedable-models.md:150`, `docs/basics/feedable-models.md:173`, `docs/basics/feedable-models.md:176`, `docs/guide/quickstart.md:50`
- `scope` — `docs/basics/named-feeds.md:134`, `docs/basics/named-feeds.md:181`, `docs/basics/named-feeds.md:191`, `docs/basics/named-feeds.md:215`
- `static` — `docs/basics/named-feeds.md:147`
- `strtr` — `docs/guide/quickstart.md:250`
- `subWeek` — `docs/basics/reading.md:112`
- `when` — `docs/basics/reading.md:187`
- `where` — `docs/basics/reading.md:112`, `docs/basics/reading.md:139`
- `whereNot` — `docs/basics/reading.md:107`

## Complete main missing list

- `storyfeed.actor_resolver` — Unreleased
- `storyfeed.hydration` — Unreleased
- `storyfeed.hydration.enabled` — Unreleased
- `storyfeed.recording` — Unreleased
- `storyfeed.recording.enabled` — Unreleased
- `storyfeed.replace` — Unreleased
- `storyfeed.replace.delete` — Unreleased
- `Storyfeed\ActivityStreams\Extension\ExtensionTerm` — Unreleased
- `Storyfeed\ActivityStreams\Property` — Unreleased
- `Storyfeed\Concerns\InteractsWithFeed::feedMedia` — Unreleased
- `Storyfeed\Contracts\Feedable::feedMedia` — Unreleased
- `Storyfeed\Diagnostics\Checks\AggregateCoverage` — Unreleased
- `Storyfeed\Diagnostics\Checks\AggregateTokens` — Unreleased
- `Storyfeed\Diagnostics\Fix` — Unreleased
- `Storyfeed\Diagnostics\Reachability` — Unreleased
- `Storyfeed\Events\ActivityPublished` — Unreleased
- `Storyfeed\FeedBuilder::declaredMode` — Unreleased
- `Storyfeed\FeedBuilder::declaredVerbFilter` — Unreleased
- `Storyfeed\FeedBuilder::unrestricted` — Unreleased
- `Storyfeed\FeedContext` — Unreleased
- `Storyfeed\FeedImage` — Unreleased
- `Storyfeed\FeedMedia` — Unreleased
- `Storyfeed\FeedNoun` — Unreleased
- `Storyfeed\Models\Party` — Unreleased
- `Storyfeed\Models\Party::feedMedia` — Unreleased
- `Storyfeed\Payload\NodePresenter` — Unreleased
- `Storyfeed\Payload\NodePresenter::forFeed` — Unreleased
- `Storyfeed\Payload\NodePresenter::forPage` — Unreleased
- `Storyfeed\StoryfeedManager::isRecording` — Unreleased
- `Storyfeed\StoryfeedManager::resolveActorUsing` — Unreleased
- `Storyfeed\StoryfeedManager::startRecording` — Unreleased
- `Storyfeed\StoryfeedManager::stopRecording` — Unreleased
- `Storyfeed\StoryfeedManager::withoutRecording` — Unreleased
- `Storyfeed\Support\LinkResolver` — Unreleased
- `Storyfeed\Support\ModelHydrator` — Unreleased
- `Storyfeed\Support\ModelHydrator::requested` — Unreleased
- `Storyfeed\Support\VerbFilter` — Unreleased
- `Storyfeed\Testing\RecordsStories` — Unreleased
- `Storyfeed\Testing\WithoutRecording` — Unreleased
- `Storyfeed\Actions\AssignToBatch` — public class backstop
- `Storyfeed\Actions\BundleComposites` — public class backstop
- `Storyfeed\Actions\CloseBatches` — public class backstop
- `Storyfeed\Actions\CompileStories` — public class backstop
- `Storyfeed\Actions\CurateCluster` — public class backstop
- `Storyfeed\Actions\PruneActivities` — public class backstop
- `Storyfeed\Actions\RebuildSnapshots` — public class backstop
- `Storyfeed\Actions\ReleaseComposite` — public class backstop
- `Storyfeed\Actions\SnapshotEntity` — public class backstop
- `Storyfeed\Actions\SyncParticipants` — public class backstop
- `Storyfeed\Actions\TrickleSnapshots` — public class backstop
- `Storyfeed\Actions\WriteGroupings` — public class backstop
- `Storyfeed\ActivityStreams\Concerns\IsVocabularyTerm` — public class backstop
- `Storyfeed\ActivityStreams\CoreType` — public class backstop
- `Storyfeed\ActivityStreams\ObjectType` — public class backstop
- `Storyfeed\ActivityStreams\VocabularyTerm` — public class backstop
- `Storyfeed\Console\BundleCommand` — public class backstop
- `Storyfeed\Console\CacheCommand` — public class backstop
- `Storyfeed\Console\ClearCommand` — public class backstop
- `Storyfeed\Console\CloseBatchesCommand` — public class backstop
- `Storyfeed\Console\CurateCommand` — public class backstop
- `Storyfeed\Console\DemoCommand` — public class backstop
- `Storyfeed\Console\DoctorCommand` — public class backstop
- `Storyfeed\Console\FeedMakeCommand` — public class backstop
- `Storyfeed\Console\ParticipantsCommand` — public class backstop
- `Storyfeed\Console\PruneCommand` — public class backstop
- `Storyfeed\Console\RebuildCommand` — public class backstop
- `Storyfeed\Console\StoriesCommand` — public class backstop
- `Storyfeed\Console\StoryMakeCommand` — public class backstop
- `Storyfeed\Console\TrickleCommand` — public class backstop
- `Storyfeed\Console\VerbsCommand` — public class backstop
- `Storyfeed\Contracts\DiagnosticCheck` — public class backstop
- `Storyfeed\Contracts\GroupingStrategy` — public class backstop
- `Storyfeed\Contracts\HasFeedShapeVersion` — public class backstop
- `Storyfeed\Demo\Beat` — public class backstop
- `Storyfeed\Demo\Cast` — public class backstop
- `Storyfeed\Demo\DemoSeeder` — public class backstop
- `Storyfeed\Demo\Screenplay` — public class backstop
- `Storyfeed\Demo\Vocabulary` — public class backstop
- `Storyfeed\Diagnostics\Checks\Backlog` — public class backstop
- `Storyfeed\Diagnostics\Checks\Columns` — public class backstop
- `Storyfeed\Diagnostics\Checks\Entities` — public class backstop
- `Storyfeed\Diagnostics\Checks\FeedCoverage` — public class backstop
- `Storyfeed\Diagnostics\Checks\FeedStale` — public class backstop
- `Storyfeed\Diagnostics\Checks\HashLengths` — public class backstop
- `Storyfeed\Diagnostics\Checks\Hydration` — public class backstop
- `Storyfeed\Diagnostics\Checks\ManifestStale` — public class backstop
- `Storyfeed\Diagnostics\Checks\Participants` — public class backstop
- `Storyfeed\Diagnostics\Checks\SingularTokens` — public class backstop
- `Storyfeed\Diagnostics\Checks\SnapshotShapes` — public class backstop
- `Storyfeed\Diagnostics\Checks\Ungrouped` — public class backstop
- `Storyfeed\Diagnostics\Checks\UnwiredSurface` — public class backstop
- `Storyfeed\Diagnostics\Checks\VerbDrift` — public class backstop
- `Storyfeed\Diagnostics\Finding` — public class backstop
- `Storyfeed\Diagnostics\Report` — public class backstop
- `Storyfeed\Diagnostics\Severity` — public class backstop
- `Storyfeed\Events\ActivityDeleted` — public class backstop
- `Storyfeed\Exceptions\IncompleteActivity` — public class backstop
- `Storyfeed\Exceptions\StoryMisconfigured` — public class backstop
- `Storyfeed\Exceptions\UnauthoredActivity` — public class backstop
- `Storyfeed\Exceptions\UnknownStory` — public class backstop
- `Storyfeed\Exceptions\UnknownVerb` — public class backstop
- `Storyfeed\FeedCandidate` — public class backstop
- `Storyfeed\FeedDefinition` — public class backstop
- `Storyfeed\Grouping\Field` — public class backstop
- `Storyfeed\Http\ActivityStreamsController` — public class backstop
- `Storyfeed\Listeners\PublishFeedActivity` — public class backstop
- `Storyfeed\Models\Meta` — public class backstop
- `Storyfeed\Models\Snapshot` — public class backstop
- `Storyfeed\Payload\GroupSlice` — public class backstop
- `Storyfeed\PendingActivity` — public class backstop
- `Storyfeed\PHPStan\FeedMakeArityRule` — public class backstop
- `Storyfeed\Serialization\ActivitySerializer` — public class backstop
- `Storyfeed\Serialization\Reader` — public class backstop
- `Storyfeed\StoryDefinition` — public class backstop
- `Storyfeed\StoryfeedManager` — public class backstop
- `Storyfeed\StoryfeedServiceProvider` — public class backstop
- `Storyfeed\Support\MorphResolver` — public class backstop
- `Storyfeed\Support\ShapeSignature` — public class backstop
- `Storyfeed\Support\StoryManifest` — public class backstop
- `Storyfeed\Support\StoryName` — public class backstop
- `Storyfeed\Support\SurfaceScanner` — public class backstop
- `Storyfeed\Support\SyncToken` — public class backstop
- `Storyfeed\Testing\FeedAudience` — public class backstop
- `Storyfeed\Testing\StoryfeedFake` — public class backstop
