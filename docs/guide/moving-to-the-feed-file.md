# Moving to the Feed File

Move headlines, icons, nouns, and group headlines from service-provider
registries into `routes/feed.php` one verb at a time. Keep publishing calls
and stored activities as they are. This changes where you declare the feed,
not what the feed records.

## Inventory the Existing Registries

There is no command that exports existing registries as feed-file definitions.
`storyfeed:doctor --stubs` generates repairs implied by findings; it does not
export working definitions. `storyfeed:list -v` lists Story definitions only,
so a registry-only app can report “Nothing is defined yet” while its feed works.

Start with the provider source and inspect the effective registries in a
booted application. Run `php artisan tinker`, then:

```php
use Storyfeed\Facades\Storyfeed;

$before = [
    'grammar' => Storyfeed::registeredGrammar(),
    'aggregateGrammar' => Storyfeed::registeredAggregateGrammar(),
    'actorlessGrammar' => Storyfeed::registeredActorlessGrammar(),
    'icons' => Storyfeed::registeredIcons(),
    'nouns' => Storyfeed::registeredNouns(),
    'verbs' => Storyfeed::registeredVerbs(),
];

dump($before);
```

This lists effective keys and values, including defaults and compiled Story
definitions. It is an inventory, not runnable exported PHP. Keep the provider
source for closures, translation objects, conditional registrations, and calls
that replace a registry with `merge: false`.

Save representative feed payloads before editing: a single activity, an
anonymous activity, each group axis your feeds read, and an unmatched pair
that uses a wildcard. Use the same stored activities, query, locale, and user
when comparing the migrated output.

## Map Keys to Definitions

For a model with morph alias `document`, the mapping is:

| Registry entry | Feed-file declaration |
|---|---|
| `grammar['document.sent']` | `Story::for(Document::class)->verb('sent')->headline(...)` |
| `grammar['document.*']` | `Story::for(Document::class)->fallback()->headline(...)` |
| `grammar['*.document.sent']` | `Story::verb('document.sent')->headline(...)` — the verb itself contains the dot |
| `grammar['*.*']` | `Story::fallback()->headline(...)` |
| `actorlessGrammar['document.sent']` | `Story::for(Document::class)->verb('sent')->anonymousHeadline(...)` |
| `icons['document.sent']` | `->icon(...)` on that type and verb |
| `nouns['document']` | `Story::for(Document::class)->noun('document\|documents')` |
| `nouns['document.sent']` | `->noun('document\|documents')` on that type and verb |
| `nouns['*']` | `Story::fallback()->noun(...)` |
| `aggregateGrammar['repeat.document.sent']` | `Story::for(Document::class)->verb('sent')->grouped(fn (GroupBuilder $group) => $group->repeat(...))` for the type-qualified key |
| `aggregateGrammar['repeat.document.sent']`, when `document.sent` is the verb | `Story::verb('document.sent')->grouped(fn (GroupBuilder $group) => $group->repeat(...))` for the unqualified key |
| `aggregateGrammar['*.sent']` | `Story::verb('sent')->grouped(fn (GroupBuilder $group) => $group->any(...))` |
| `verbs(['sent' => ActivityType::Update])` | `Story::verb('sent')->type(ActivityType::Update)` |
| `verbs(DocumentActivity::class)` | Keep the enum registration in the provider, or bind each enum case with `Story::verb(DocumentActivity::Sent)` |

Do not split a dotted verb into a model alias and a shorter verb. Inspect the
verb values in your inventory. Group keys can look identical while meaning
an axis plus a dotted verb, or an axis plus a type and a verb.

Single-activity headlines, anonymous headlines, and icons resolve in this
order: `type.verb`, `type.*`, `*.verb`, `*.*`. Preserve each rung rather than
copying a wildcard headline onto every model. A type-qualified group headline
is used only when the axis pins the object type; otherwise the unqualified
axis-and-verb entry applies. See [Aggregation](/deeper/aggregation).

## Move One Verb

For a verb named `document.sent`, these provider registrations:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::grammar(['*.document.sent' => ':actor sent :object to :target']);
Storyfeed::actorlessGrammar(['*.document.sent' => ':object was sent to :target']);
Storyfeed::icons(['*.document.sent' => 'send']);
Storyfeed::aggregateGrammar(['repeat.document.sent' => ':actor sent :count documents']);
```

become:

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::verb('document.sent')
    ->headline(':actor sent :object to :target')
    ->anonymousHeadline(':object was sent to :target')
    ->icon('send')
    ->grouped(fn (GroupBuilder $group) => $group
        ->repeat(':actor sent :count documents'));
```

With Erica as actor, Order agreement as object, and Finance as target, the
single activity still reads “Erica sent Order agreement to Finance”. Three
repeated sends still read “Erica sent 3 documents”. An anonymous send still
reads “Order agreement was sent to Finance”.

Remove the corresponding old entries in the same edit. Leaving both declarations
can hide a missing migration behind an old value. Keep the original provider
in version control so you can restore it while diagnosing a difference.

## Keep Application Configuration in the Provider

Keep custom checks, named feed registrations, parties, axes, and middleware
aliases in the provider. They configure the application rather than one story.
Story definitions can attach middleware, but alias and group registration stays
global. Keep explicit verb-enum registration if it supplies vocabulary beyond
the definitions you are moving.

Group callbacks are another current exception: the aggregate registry accepts
closures receiving `GroupSlice`, but `GroupBuilder` and `Group::headline()`
accept strings only. Keep those callback entries in the provider; do not pass
a closure to `repeat()`. Preserve existing `FeedHeadline` translation objects
and singular headline callbacks through the corresponding headline methods.

Do not put raw `Storyfeed::grammar()` or other registry calls in the feed file.
`storyfeed:cache` refuses hand-written registry calls there because they would
stop running when the file is cached.

## Verify Each Move

Clear an existing manifest with `php artisan storyfeed:clear` before validating
changed definitions. Run `php artisan storyfeed:list -v` to inspect the new
keys, group headlines, source, and middleware. It cannot prove that the old
registries had the same behavior.

Repeat the registry inventory and compare the relevant keys and values.
Compare the saved payloads as well: headlines, anonymous wording, icons, group
counts, and wildcard behavior. Callback descriptions or registry-key equality
alone do not prove equivalent rendered output.

Run `php artisan storyfeed:doctor` for coverage gaps. Use `--stubs` only to repair
findings you have verified. Once the comparisons pass, rebuild the manifest
with `php artisan storyfeed:cache` if your deployment uses it.
