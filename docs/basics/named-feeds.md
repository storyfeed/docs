# Named Feeds

A feed shown to a client and a feed shown to the team are not the same feed.
Declare each one once, by name, and enter it by that name. When you are done,
every surface reads exactly the verbs it should, and nothing else.

<script setup>
import { who, where, doc, note, job, activity } from '../.vitepress/theme/samples'

const team = [
  activity({ id: 'nf1', verb: 'approve', glyph: 'circle-check',
    published_at: '2026-08-14T14:40:00.000000Z',
    headline_template: ':actor approved :object',
    actor: who.lead, object: doc.report }),
  activity({ id: 'nf2', verb: 'comment', glyph: 'message-circle',
    published_at: '2026-08-14T14:35:00.000000Z',
    headline_template: ':actor commented on :target',
    actor: who.reviewer, object: note.second, target: doc.report }),
  activity({ id: 'nf3', verb: 'upload', glyph: 'file-up',
    published_at: '2026-08-14T14:30:00.000000Z',
    headline_template: ':actor uploaded :object to :target',
    actor: who.designer, object: doc.report, target: where.main }),
  activity({ id: 'nf4', verb: 'complete', glyph: 'square-check',
    published_at: '2026-08-14T14:25:00.000000Z',
    headline_template: ':actor completed :object',
    actor: who.lead, object: job.simplify }),
  activity({ id: 'nf5', verb: 'create', glyph: 'folder',
    published_at: '2026-08-12T09:00:00.000000Z',
    headline_template: ':actor created the project :object',
    actor: who.owner, object: where.main }),
]

const client = team.filter(node => ['upload', 'approve', 'complete'].includes(node.verb))
</script>

## Declaring a Feed

A feed is a closure over the builder, registered at boot:

```php
// AppServiceProvider::boot()
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Storyfeed::feeds([
    'client' => fn (FeedBuilder $feed) => $feed->only(['upload', 'approve', 'complete'])->log(),
    'team' => fn (FeedBuilder $feed) => $feed,
]);
```

Enter it by name, from the facade or from the model:

```php
Storyfeed::feed('team')->involving($project)->get();
```

<FeedStream :items="team" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

```php
$project->storyfeed('client')->get();
```

<FeedStream :items="client" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

An unknown name throws `UnknownFeed`. A typo does not fall back to the
unfiltered feed. The verb list binds; the mode does not: `->log()` in a
declaration is a default any call site may override.

## Verbs and Scope

A name carries the **verbs**. It does not carry the **scope**: which rows the
surface may read is still `involving()`, `context()` or `query()`, as on any
builder.

```php
Storyfeed::feed('client')->get();                       // every project in the system
Storyfeed::feed('client')->involving($project)->get();  // this project
```

::: danger The scope is the half with no symptom
The first line returns a complete, correct-looking client timeline built from
other people's projects. [Feed classes](#feed-classes) move the scope into the
declaration, so the unscoped line cannot be written.
:::

## `only()` and `except()`

Both work on any builder, with or without a name:

```php
Storyfeed::feed()->only(['upload', 'approve'])->get();
Storyfeed::feed()->only(['document.*', ActivityVerb::Approve])->get();
Storyfeed::feed()->except(['note'])->get();
```

| | |
|---|---|
| accepts | verb strings and enum cases, mixed in one list |
| `document.*` | a trailing `*` is a prefix wildcard |
| an unrecognised verb | never throws; a verb nobody records is a query matching nothing |
| `only([])` | throws |
| repeat calls | intersect: `only(A)` then `only(B)` is `A ∩ B` |

Intersection means a call site can only ever cut further:

```php
// still just uploads: the declared list is a floor
Storyfeed::feed('client')->only(['upload', 'note'])->get();
```

Excluded verbs leave the query the whole read is built from, so group counts
recompute inside the filter, and a group whose members are all excluded
produces no node.

## Feed Classes

A closure runs at boot, before any project exists, so it can carry verbs but
not a subject. A class takes its subject as a constructor argument:

```php
namespace App\Feeds;

use App\Models\Project;
use Storyfeed\Feed;
use Storyfeed\FeedBuilder;

class ClientFeed extends Feed
{
    public function __construct(protected Project $project) {}

    public function define(FeedBuilder $feed): void
    {
        $feed->only(['upload', 'approve', 'complete'])->log();
    }

    protected function scope(FeedBuilder $feed): void
    {
        $feed->involving($this->project);
    }
}
```

```php
ClientFeed::make($project)->get();
```

<FeedStream :items="client" :grouped="false">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedStream>

Generate one with `php artisan make:feed Client --subject=App\Models\Project`.

| Hook | Declares | May Read Constructor State |
|---|---|---|
| `define()` | what the feed is about: verbs, mode, limit | no |
| `scope()` | the values only a request supplies | yes |

`ClientFeed::make()` without its subject is an `ArgumentCountError`, and the
role `scope()` binds cannot be rebound at a call site:

```php
ClientFeed::make($project)->involving($other);                   // throws FeedMisconfigured
ClientFeed::make($project)->only(['upload'])->summary();         // fine: narrowing
```

A feed with no subject declares no constructor and no `scope()`:

```php
namespace App\Feeds;

class TeamFeed extends Feed
{
    public function define(FeedBuilder $feed): void
    {
        $feed->except(['note'])->summary();
    }
}

TeamFeed::make()->get();
```

Register classes and closures in one list:

```php
Storyfeed::feeds([
    'client' => ClientFeed::class,     // named explicitly
    TeamFeed::class,                   // name derived: 'team'
    'kitchen' => fn (FeedBuilder $feed) => $feed->only(['order.*'])->live(),
]);
```

`ClientFeed::make($project)` works with an empty registry; registering is what
lets the package inspect the feed.

## What a Feed Does Not Do

A feed is a query filter you route a surface through. It selects rows; it
never hides an activity, and the read path has no visibility layer underneath
it.

- It does not know **who is asking**. `ClientFeed::make($project)` is the same
  feed whichever client requests it. That *this* client may see *this* project
  is a policy question, in the controller where it always was.
- **It filters events, not fields.** An internal detail in a client-visible
  verb's `data` is still in the payload. What keeps it out is what you record.
- **The write path is untouched.** Recording an internal verb stays legal.
- **Composite parents are not special-cased.** A list admitting a story's
  member verbs but not its own verb drops the parent node, and the members
  read as solo items.
- **The [Activity Streams controller](/deeper/activity-streams) builds its own
  query** and is not filtered by a name.

Prefer `only()` for a client-facing surface: `except()` admits tomorrow's verb
unless someone adds it, and a wildcard admits a verb the day someone records
it.
