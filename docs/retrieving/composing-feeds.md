# Composing Feeds

<script setup>
import { WORLD_ANCHOR, activity, entity, everything } from '../.vitepress/theme/world'

const day = 86_400_000
const at = (days, hours = 0) => new Date(WORLD_ANCHOR - days * day - hours * 3_600_000).toISOString().replace(/\.(\d{3})Z$/, '.$1000Z')
const party = (name, key) => entity('storyfeed.party', key, name, null, { data: { key, type: 'Service' } })

// A dateless entry has no verb, no icon and no date: its headline is its own.
const entry = (id, over) => activity({ id, verb: null, glyph: null, published_at: null, data: null, ...over })

const club = party('Hawkins Middle AV Club', 'hawkins-middle-av-club')
// The card's picture is the project's own `image`, from its feedMedia().
const project = (slug, name, tagline, photo) => entry(`project-${slug}`, {
  headline_template: `:object, ${tagline}`, actor: club,
  object: entity('project', slug, name, `/projects/${slug}`, {
    data: { photo },
    media: { image: { src: `/media/worlds/stranger-things/${photo}.jpg`, mediaType: null, width: null, height: null, alt: name } },
    body: [{ $body: 'Storyfeed/Body/MediaObject', $v: 5, subject: name, content: tagline, image: 'image' }],
  }),
})
const showcase = [
  project('darkroom', 'Darkroom', 'the photo club\'s prints', 'darkroom'),
  project('paper-route', 'Paper Route', 'the school paper, delivered', 'newspapers'),
  project('high-score', 'High Score', 'the arcade leaderboard', 'arcade'),
]
// Rendered from the headline alone: no body.
const listed = showcase.map((node) => ({ ...node, headline_template: ':object', object: { ...node.object, body: null } }))

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

A composed feed is built in PHP with `Storyfeed::compose()`. To read the same
kind of items from an array, a config entry or an API, use a
[feed source](/retrieving/feed-sources).

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

A role also takes a party name, such as `'Storyfeed'`, or an entity with no
model, as an array. See [Defining Items](/retrieving/feed-sources#items) for the
array's keys.

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

<span id="running-without-tables"></span>

A composed feed doesn't read the activity tables.

<span id="showcasing-projects"></span>

## Composing From Feedable Models

A [Feedable](/basics/feedable-models) model in an entry's role gives its label
from `toFeed()` and its link and pictures from
[`feedMedia()`](/basics/feed-media), each time the composed feed is read. Your
models stay the entities; the feed is composed from them. A renamed project
shows its new name the next time the page loads.

::: code-group

```php [Fluent Syntax] memo="app/Models/Project.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

class Project extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->name,
            data: ['photo' => $this->photo],
        );
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make()
            ->url(route('projects.show', $context->routeKey()))
            ->image(
                FeedImage::make()
                    ->src(asset("media/{$context->data('photo')}.jpg"))
                    ->alt($context->label())
            );
    }
}
```

```php [Named Arguments] memo="app/Models/Project.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

class Project extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->name,
            data: ['photo' => $this->photo],
        );
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make(
            url: route('projects.show', $context->routeKey()),
            image: FeedImage::make(
                src: asset("media/{$context->data('photo')}.jpg"),
                alt: $context->label(),
            ),
        );
    }
}
```

:::

`feedMedia()` reads what it needs from the entity's `data`, as here. In a
composed feed, `$context->model()` looks the model up again in the database.

A showcase has no dates. Its order is yours, such as a `position` column. The
card's picture is the project's `image`:

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

## Composing Common Feeds

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

<span id="rendering-a-payload-you-build-yourself"></span>

## Rendering a Composed Feed

A composed feed renders like any other. Hand it to the Blade kit:

```php memo="routes/web.php"
use App\Models\Project;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/projects', fn () => view('projects', [
    'page' => Storyfeed::compose()
        ->addMany(Project::orderBy('position')->get(), fn (Project $project, $entry) => $entry
            ->by('Hawkins Middle AV Club')
            ->headline(':object', ['object' => $project]))
        ->inOrder()
        ->get(),
]));
```

```blade memo="resources/views/projects.blade.php"
<x-storyfeed::feed :page="$page" />
```

<FeedExample :items="listed" />

A composed feed can't answer `involving()`, `query()` or `members()`, which
need stored history. See [Source Limitations](/retrieving/feed-sources#source-limitations).
