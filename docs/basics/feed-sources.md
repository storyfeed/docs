# Feed Sources

<script setup>
import { WORLD_ANCHOR, activity, entity, everything } from '../.vitepress/theme/world'

const day = 86_400_000
const at = (days, hours = 0) => new Date(WORLD_ANCHOR - days * day - hours * 3_600_000).toISOString().replace(/\.(\d{3})Z$/, '.$1000Z')
const party = (name, key) => entity('storyfeed.party', key, name, null, { data: { key, type: 'Service' } })
const storyfeed = party('Storyfeed', 'storyfeed')
const release = (version, over = {}) =>
  entity('release', version, version, `https://github.com/storyfeed/storyfeed/releases/tag/${version}`, over)
const ship = (id, version, published_at, over = {}) => activity({
  id, verb: 'ship', glyph: 'rocket', published_at,
  headline_template: ':actor shipped :object',
  actor: storyfeed, object: release(version, over), data: null,
})

const releases = [
  ship('4e96a044d0c2ce697e1051c891', 'v0.18.0', at(2, 3), {
    body: [{ $body: 'Storyfeed/Body/Prose', $v: 1, content: 'Feeds can read from sources other than the database.', mediaType: 'text/plain', verbatim: false, title: null }],
  }),
  ship('9e4fa6efad9aea89545d32b58c', 'v0.17.0', at(6)),
]

// A dateless entry has no verb, no icon and no date: its headline is its own.
const entry = (id, over) => activity({ id, verb: null, glyph: null, published_at: null, data: null, ...over })

const club = party('Hawkins Middle AV Club', 'hawkins-middle-av-club')
// The card's picture is the project's own `image`, from its feedMedia().
const project = (slug, name, tagline, photo) => entry(`project-${slug}`, {
  headline_template: `:object, ${tagline}`, actor: club,
  object: entity('project', slug, name, `/projects/${slug}`, {
    media: { image: { src: `/media/worlds/stranger-things/${photo}.jpg`, mediaType: 'image/jpeg', width: 960, height: 720, alt: name } },
    body: [{ $body: 'Storyfeed/Body/MediaObject', $v: 5, subject: name, content: tagline, image: 'image' }],
  }),
})
const showcase = [
  project('darkroom', 'Darkroom', 'the photo club\'s prints', 'darkroom'),
  project('paper-route', 'Paper Route', 'the school paper, delivered', 'newspapers'),
  project('high-score', 'High Score', 'the arcade leaderboard', 'arcade'),
]

const robin = everything().find((node) => node.actor?.label === 'Robin Buckley').actor
const talk = (slug, venue, days) => entry(`talk-${slug}`, {
  published_at: at(-days), headline_template: ':actor speaks at :object', actor: robin,
  object: entity('event', slug, venue, null),
})
const talks = [
  talk('library', 'Hawkins Public Library', 12),
  talk('language-fair', 'the Bloomington Language Fair', 40),
  talk('assembly', 'the Hawkins High assembly', -20),
]

const progress = ['j84', 'a-confirm', 'a-ready'].map((id) => everything().find((node) => node.id === id))
</script>

## Introduction

Compose and render any feed-shaped data you already have: a project showcase,
your talks, the steps an order went through. Storyfeed reads it into the same
payload as a recorded feed, ready for the same kits, and stores nothing.

A composed feed is built in PHP with `Storyfeed::compose()`. A **source**
reads the same kind of items from somewhere else, such as an array, a config
entry, or an API.

## Composing a Feed

Add an entry for each item with `add`. Each entry takes the methods you use to
record an activity:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

$feed = Storyfeed::compose()
    ->add(fn ($entry) => $entry
        ->by($order->customer)
        ->action('place', $order)
        ->publishedAt($order->placed_at))
    ->add(fn ($entry) => $entry
        ->headline('Opened the doors to the new kitchen')
        ->publishedAt($openedAt))
    ->get();
```

`get` returns the same collection of items as any read. `cursorPaginate` and
`simplePaginate` page a composed feed, and `only`, `except`, role filters and
`limit` narrow it.

An entry accepts the role methods (`by`, `on`, `to`, `in`, `at`, and the
others), `action` or `verb`, `data`, `body`, `startsAt`, `endsAt` and
`publishedAt`. A model in a role is read through its `toFeed` method, so it
must be [Feedable](/basics/feedable-models).

The closure receives a `Storyfeed\Sources\Entry`. If your app has its own
`Entry` class, import Storyfeed's under another name:
`use Storyfeed\Sources\Entry as FeedEntry;`.

### Writing Headlines

Give an entry its own headline with `headline`. Replacements work as they do
for Laravel's `__` helper:

```php memo="A controller, or wherever the feed is read"
$feed = Storyfeed::compose()
    ->add(fn ($entry) => $entry
        ->headline(':actor shipped :object (:version)', [
            'actor' => $team,
            'object' => $release,
            'version' => 'v0.20',
        ]))
    ->get();
```

A key that names a role, such as `actor` or `object`, sets that role, so the
name renders linked and the actor's face sits on the rail. Any other key is
replaced in the text, as `:version`, `:Version` or `:VERSION`. A model under a
key that is not a role throws an `InvalidArgumentException`.

A headline that names an empty role throws too, unless the token sits in an
optional segment: `':actor shipped[ to :target]'` drops the segment when the
entry has no target.

An entry's own headline wins over the feed file's. An entry with a verb and no
headline reads the verb's headline from your [feed file](/basics/the-feed-file).
The verb is optional: an entry with only a headline has no verb or icon.

### Adding Many Entries

`addMany` adds an entry for each item in a collection, as Eloquent's
`createMany` creates a model for each:

```php memo="A controller, or wherever the feed is read"
$feed = Storyfeed::compose()
    ->addMany($releases, fn (Release $release, $entry) => $entry
        ->by('Storyfeed')
        ->action('ship', $release)
        ->publishedAt($release->shipped_at))
    ->get();
```

### Keeping Your Order

A composed feed reads newest first. `inOrder` keeps the entries in the order
you added them, and its cursor pages by position:

```php memo="A controller, or wherever the feed is read"
$feed = Storyfeed::compose()
    ->addMany($projects->sortBy('position'), fn ($project, $entry) => $entry
        ->headline(':object', ['object' => $project]))
    ->inOrder()
    ->get();
```

A feed kept in order never groups, so reading it with `live` throws an
`InvalidArgumentException`.

### Dateless Entries

An entry without `publishedAt` is dateless. Its node has `published_at: null`,
and the kits draw it with no time. Without `inOrder`, dateless entries follow
the dated ones, in the order you added them.

Entries dated in the future are shown.

### Grouping a Composed Feed

A composed feed reads as Log, whatever `grouping.default` says, so each entry
keeps its own headline. Call `live` to group its dated entries with the same
axes and burst windows as stored activities. A dateless or verbless entry is
never grouped.

### Running Without Tables

A composed feed needs no tables, migrations, snapshots, trickle, cache or
queue. It reads no database: model roles are read through `toFeed` when the
feed is read. An app that only composes feeds can skip Storyfeed's migrations.

## Composing Common Feeds

### Showcasing Projects

A showcase has no dates. Its order is yours, such as a `position` column. The
card's picture is the project's `image` from its
[`feedMedia`](/basics/feed-media):

```php memo="app/Http/Controllers/HomeController.php"
use App\Models\Project;
use Storyfeed\Body\MediaObject;
use Storyfeed\Facades\Storyfeed;

$projects = Project::orderBy('position')->get();

$showcase = Storyfeed::compose()
    ->addMany($projects, fn (Project $project, $entry) => $entry
        ->by('Hawkins Middle AV Club')
        ->headline(':object, :tagline', [
            'object' => $project,
            'tagline' => $project->tagline,
        ])
        ->body(MediaObject::make(
            subject: $project->name,
            content: $project->tagline,
            image: $project->feedMediaImage(),
        )))
    ->inOrder()
    ->get();
```

<FeedExample :items="showcase" />

### Listing Talks

Upcoming talks read soonest first, then past talks most recent first. Order
the two halves yourself and keep the order:

```php memo="app/Http/Controllers/TalkController.php"
use App\Models\Talk;
use Storyfeed\Facades\Storyfeed;

[$upcoming, $past] = Talk::all()
    ->partition(fn (Talk $talk) => $talk->starts_at->isFuture());

$ordered = [
    ...$upcoming->sortBy('starts_at'),
    ...$past->sortByDesc('starts_at'),
];

$talks = Storyfeed::compose()
    ->addMany($ordered, fn (Talk $talk, $entry) => $entry
        ->headline(':actor speaks at :object', [
            'actor' => $talk->speaker,
            'object' => $talk->event,
        ])
        ->publishedAt($talk->starts_at))
    ->inOrder()
    ->get();
```

<FeedExample :items="talks" />

### Showing a Record's Progress

An order's page can show the steps it went through, oldest first, from the
timestamps it already has. Nothing is recorded, so the steps never reach the
shop's main feed:

```php memo="app/Http/Controllers/OrderController.php" at="show()"
use Storyfeed\Facades\Storyfeed;

return view('orders.show', [
    'order' => $order,
    'progress' => Storyfeed::compose()
        ->add(fn ($entry) => $entry
            ->by($order->customer)
            ->action('place', $order)
            ->to($order->shop)
            ->publishedAt($order->placed_at))
        ->add(fn ($entry) => $entry
            ->by($order->confirmedBy)
            ->action('confirm', $order)
            ->publishedAt($order->confirmed_at))
        ->add(fn ($entry) => $entry
            ->by($order->confirmedBy)
            ->action('ready', $order)
            ->publishedAt($order->ready_at))
        ->inOrder()
        ->get(),
]);
```

```blade memo="resources/views/orders/show.blade.php"
<x-storyfeed::feed :page="$progress" />
```

The headlines come from the verbs in your feed file.

<FeedExample :items="progress" />

<a id="reading-static-content"></a>

## Reading an Array

The `ArraySource` reads items you pass in as arrays:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Sources\ArraySource;

$json = file_get_contents(resource_path('releases.json'));

$releases = collect(json_decode($json, true))
    ->map(fn (array $release) => [
        'verb' => 'ship',
        'actor' => 'Storyfeed',
        'object' => [
            'type' => 'release',
            'label' => $release['version'],
            'url' => $release['url'],
        ],
        'published_at' => $release['published_at'],
        'body' => $release['summary'],
    ]);

Storyfeed::feed()->source(new ArraySource($releases))->get();
```

Give the verb a headline in your feed file, as you would for a model:

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;

Story::for('release')
    ->verb('ship')
    ->headline(':actor shipped :object')
    ->icon('rocket');
```

<FeedExample :items="releases" />

The feed applies its headlines, bodies, Live and Log modes, `only()` and
`except()`, role filters, limits and cursors to these items, as it does to
stored activities. Unlike a composed feed, a source hides items dated in the
future, as the database hides scheduled activities.

To keep the items in the order given, pass `inOrder: true`:

```php memo="A controller, or wherever the feed is read"
Storyfeed::feed()
    ->source(new ArraySource($projects, inOrder: true))
    ->get();
```

<a id="items"></a>
## Defining Items

Each item is an array with these keys:

| Key | Value |
|---|---|
| `verb` | the verb, as a string or a verb enum |
| `headline` | the item's own headline, with role tokens filled from its roles |
| `published_at` | a date or date string; an item without one is dateless |
| `actor`, `object`, `target`, `context`, `origin`, `result`, `instrument`, `location`, `generator` | a role (see below) |
| `starts_at`, `ends_at` | the time range the activity describes |
| `data` | an array, carried as the activity's `data` |
| `body` | the object's body: a string, a body, or a list of bodies; an item with a `body` needs an `object` |
| `id` | the activity's payload `id`; derived from the item when absent |

Any other key throws an `InvalidArgumentException`.

A role may be any of these:

| Role Value | Example | In the Payload |
|---|---|---|
| a Feedable model | `$project` | the model's entity, from its `toFeed()` |
| a party name | `'Storyfeed'` | a party entity, `type: "storyfeed.party"` |
| an entity with no model | `['type' => 'release', 'label' => 'v0.18.0', 'url' => '…']` | an entity with that `type` and `label`, linked to the `url` |

An entity array may also carry an `id`, which defaults to its label, plus
`data` and a `body`.

It may also carry `media`, the pictures a model would give from its
`feedMedia()`: an `icon`, an `image` or a `preview`, each a URL or an array
with `src`, `alt`, `width` and `height`. An entity with an `icon` draws it as
its avatar:

```php memo="A controller, or wherever the feed is read"
$entry->by([
    'type' => 'product',
    'label' => 'InvoiceJam',
    'media' => ['icon' => 'https://teylabs.com/marks/invoicejam.svg'],
])->headline(':actor sends invoices');
```

An `Image` or `MediaObject` body that names a slot the entity doesn't declare,
such as `preview`, throws an `InvalidArgumentException` rather than drawing
nothing. Declare the picture in `media`, or give the body its own image.

To build items in PHP rather than as arrays, use `Entry::make()`, which takes
the same values as named arguments:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Sources\Entry;

Entry::make(
    verb: 'ship',
    publishedAt: $release['published_at'],
    actor: 'Storyfeed',
    object: [
        'type' => 'release',
        'label' => $release['version'],
        'url' => $release['url'],
    ],
    body: $release['summary'],
);
```

## Naming Sources

Name a source in `config/storyfeed.php`, as you name a filesystem disk. The
`array` driver reads the items listed under `items`, and `in_order` keeps
their order:

```php memo="config/storyfeed.php"
'sources' => [
    'database' => ['driver' => 'database'],

    'releases' => [
        'driver' => 'array',
        'items' => json_decode(
            file_get_contents(resource_path('releases.json')),
            true,
        ),
    ],
],
```

Pass the name to `source`:

```php memo="A controller, or wherever the feed is read"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->source('releases')->live()->get();
```

The `database` source is the default. A feed that never calls `source` reads
the database.

## Writing a Custom Driver

A driver is a class that implements `Storyfeed\Contracts\FeedSource`. Its
`items` method returns the source's items, as arrays, `Entry` instances or
`Storyfeed\Models\Activity` models.
This driver reads a repository's releases from GitHub:

```php memo="app/Sources/GitHubSource.php"
<?php

namespace App\Sources;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Storyfeed\Contracts\FeedSource;
use Storyfeed\Sources\Entry;

class GitHubSource implements FeedSource
{
    public function __construct(protected array $config) {}

    public function items(): iterable
    {
        $repo = $this->config['repo'];

        $releases = Cache::remember(
            "github.releases.{$repo}",
            3600,
            fn () => Http::withToken($this->config['token'])
                ->get("https://api.github.com/repos/{$repo}/releases")
                ->throw()
                ->json(),
        );

        foreach ($releases as $release) {
            yield Entry::make(
                verb: 'ship',
                publishedAt: $release['published_at'],
                actor: $release['author']['login'],
                object: [
                    'type' => 'release',
                    'label' => $release['name'] ?: $release['tag_name'],
                    'url' => $release['html_url'],
                ],
                body: $release['body'],
            );
        }
    }
}
```

Register the driver with `Storyfeed::extend` in a service provider's `boot`
method. The closure receives the application and the source's configuration:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use App\Sources\GitHubSource;
use Storyfeed\Facades\Storyfeed;

Storyfeed::extend('github', fn ($app, array $config) => (
    new GitHubSource($config)
));
```

Then name a source that uses it:

```php memo="config/storyfeed.php"
'sources' => [
    'releases' => [
        'driver' => 'github',
        'repo' => 'storyfeed/storyfeed',
        'token' => env('GITHUB_TOKEN'),
    ],
],
```

`Storyfeed::source('releases')` returns the source. It is built the first
time it is used and reused after that.

<a id="what-other-sources-do-not-support"></a>
## Source Limitations

A composed feed or a source other than the database reads its items in
memory. These need stored history, so they behave differently:

| Call or Key | On a Composed Feed or Another Source |
|---|---|
| `involving()`, `involvingDirectly()`, `involvingType()` | throws `FeedMisconfigured` |
| `query()` | throws `FeedMisconfigured` |
| `members()` | throws `FeedMisconfigured` |
| `sync_token` | always `null` on a paginated page |

Filter by role instead: `actor()`, `object()`, `target()`, `context()`,
`origin()`, `result()`, `instrument()`, `location()`, `generator()` and their
`*Type()` forms all work, and `actor('Storyfeed')` matches the items whose
actor is that party name.

Live groups are worked out from all of the items each time the feed is read,
with the same axes, thresholds and burst windows as stored activities.

<a id="rendering-a-payload-you-build-yourself"></a>

## Rendering a Composed Feed

A composed feed or a source's page renders like any other. Hand it to the
Blade kit:

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/releases', fn () => view('releases', [
    'page' => Storyfeed::feed()->source('releases')->log()->get(),
]));
```

```blade memo="resources/views/releases.blade.php"
<x-storyfeed::feed :page="$page" />
```

<FeedExample :items="releases" />
