# Your first feed

Five steps: make a model feedable, author a story, publish an activity, read
the feed, render it. The example is a document being uploaded to a project.

<script setup>
import { member, project, document, activity } from '../.vitepress/theme/samples'

// The same names the snippets use, so the rendered result is this page's example
// and not a different one.
const published = activity({
  id: 'q1', verb: 'upload', icon: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :object to :target',
  actor: member('6', 'Ines Duarte'),
  object: document('88', 'annual-report-v3.fig'),
  target: project('4', 'Password Crackdown'),
})
</script>


## 1. Make your models feedable

Anything that appears in the feed — actor, object, target, or context —
implements `Feedable`:

```php
use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;

class Document extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->name,
            data: ['id' => $this->id, 'project_id' => $this->project_id],
        );
    }

    public static function toFeedLink(array $data): ?FeedLink
    {
        return FeedLink::make(url: route('documents.show', $data['id']));
    }
}
```

`toFeed()` is a snapshot, written at publish time and refreshed on save.
`toFeedLink()` is static and runs at read time from that snapshot, so labels stay
fast and URLs never go stale.

::: tip
`toFeedLink()` receives exactly what `toFeed()` put in `data` — include the key
you need to build the URL. Throwing inside it is safe: the failure is reported
and the entity degrades to `url: null`.
:::

Storyfeed stores morph aliases, never class names, so enforce a morph map:

```php
Relation::enforceMorphMap([
    'document' => Document::class,
    'project' => Project::class,
    // Aliases are permanent: an activity whose role alias stops resolving is
    // treated as an orphan and deleted by the scheduled trickle.
    'user' => User::class,
]);
```

## 2. Author a story

One class per meaningful activity type — the verb, the headline, the icon, and
how it groups:

```php
use App\Models\Document;
use Storyfeed\Grouping\Group;
use Storyfeed\Story;

class DocumentWasUploaded extends Story
{
    public string|array|null $objectType = Document::class;

    public string|FeedVerb|null $verb = 'upload';

    public function headline(): string
    {
        return ':actor uploaded :object to :target';
    }

    public function icon(): ?string
    {
        return 'file-up';
    }

    public function groups(): array
    {
        return [
            Group::byActors()->headline(':actors uploaded :count files to :target'),
            Group::repeat()->headline(':actor uploaded :count files to :target'),
        ];
    }
}
```

Generate one with `php artisan make:story DocumentWasUploaded`, then register:

```php
Storyfeed::stories([
    DocumentWasUploaded::class,
]);
```

Headlines are **templates**, substituted by the renderer — translatable, and a
label can stay a link. A group headline may only use tokens true of *every*
member: `repeat` can say `:actor` (one actor, many uploads) but not `:object`.
`storyfeed:doctor` reports templates that would lie.

## 3. Publish an activity

```php
Storyfeed::activity()
    ->actor($user)
    ->verb('upload', $document)
    ->to($project)
    ->publish();
```

Or in one line:

```php
Storyfeed::record('upload', $document, actor: $user, target: $project);
```

Call it wherever the fact becomes true — an action, an observer, an event
listener.

## 4. Read it back

```php
$page = Storyfeed::feed()
    ->involving($project)
    ->limit(20)
    ->get();
```

<FeedStream :items="[published]" :grouped="false" />

That is the activity from step 3, read back. `involving()` matches the project in
any role, so it finds this one whether the project was the target, the context or
the object — including the activity that created the project itself.

`$page` is the payload envelope — `payload_version`, `items`, `next_cursor`,
`sync_token` — and is `Responsable`, so an API endpoint is one line:

```php
Route::get('/feed', fn () => Storyfeed::feed()->limit(20)->get());
```

Three read modes:

| call | returns |
|---|---|
| `->log()` | the atomic timeline, one node per activity |
| `->live()` | mechanical grouping over the active window |
| `->summary()` | the collapsed best-axis view — **the default** |

Paginate by handing `next_cursor` back:

```php
// Cursors are opaque — store them, don't parse them.
// End of feed is next_cursor === null. An empty items array is NOT the end:
// a page can lose every node to a rewrite and still carry a usable cursor,
// so follow it while empty, bounded to a few hops.
$page = Storyfeed::feed()->cursor($cursor)->get();
```

## 5. Render it

Every item is self-describing, so this is the whole renderer, in plain Blade:

```blade
@php
    // One entity → a linked label. A null label means the snapshot isn't
    // written yet; the activity still renders, degraded.
    $entity = function (?array $e, string $fallback = 'Something') {
        if ($e === null) {
            return e($fallback);
        }
        $label = e($e['label'] ?? $fallback);

        return $e['url']
            ? '<a href="'.e($e['url']).'">'.$label.'</a>'
            : $label;
    };

    // A singular token. Activity nodes carry roles directly; GROUP NODES DO
    // NOT — a group's pinned roles live in `exemplars`, as a list of exactly
    // one. Reading $node['actor'] on a group would silently render "Someone".
    $one = function (array $node, string $role, string $fallback) use ($entity) {
        return $entity(
            $node['exemplars'][$role.'s'][0] ?? $node[$role] ?? null,
            $fallback,
        );
    };

    // How many members a role has BEYOND the exemplars named. Exemplars are
    // capped at 3, so this is distinct minus however many were shown — never
    // "minus one".
    $overflow = fn (array $node, string $role) => max(
        ($node['distinct'][$role] ?? 0) - count($node['exemplars'][$role] ?? []),
        0,
    );

    // A plural token: joined exemplars, with the overflow appended.
    $list = function (array $node, string $role) use ($entity, $overflow) {
        $shown = array_map(fn ($e) => $entity($e), $node['exemplars'][$role] ?? []);
        $more = $overflow($node, $role);

        return implode(', ', $shown).($more > 0 ? " and {$more} more" : '');
    };
@endphp

@foreach ($page['items'] as $node)
    <article>
        <i class="{{ $node['icon'] }}"></i>

        @if ($node['headline_template'])
            {!! strtr($node['headline_template'], [
                ':actor'    => $one($node, 'actor', 'Someone'),
                ':object'   => $one($node, 'object', 'Something'),
                ':target'   => $one($node, 'target', 'Something'),
                ':context'  => $one($node, 'context', 'Something'),
                ':actors'   => $list($node, 'actors'),
                ':objects'  => $list($node, 'objects'),
                ':targets'  => $list($node, 'targets'),
                ':contexts' => $list($node, 'contexts'),
                ':count'    => $node['count'] ?? 1,
                ':others'   => $overflow($node, 'actors').' others',
            ]) !!}
        @elseif ($node['headline'])
            {{ $node['headline'] }}
        @elseif ($node['kind'] === 'group')
            {{-- Both headline fields null: the server could not summarise this
                 group honestly. Render the count, ideally with the members
                 visible. Composing actor + verb + object here would name one
                 actor over a many-actor group. --}}
            {{ $node['count'] }} activities
        @else
            {{ $node['verb'] }}
        @endif

        <time datetime="{{ $node['published_at'] }}">
            {{ \Carbon\Carbon::parse($node['published_at'])->diffForHumans() }}
        </time>
    </article>
@endforeach
```

The comments on `$one`, `$overflow` and the group branch are the parts to keep
when you adapt this. [Rendering](/basics/rendering) covers the token rules in
full.

A feed that polls or accumulates pages also needs
[reconciliation](/basics/rendering#reconciling-updates) — without it, a
regrouped node duplicates activities on the next poll.

## Check your work

```bash
php artisan storyfeed:doctor
```

Doctor reads your registries and your actual traffic: a verb with no grammar, a
group that would arrive unnamed, a model in the feed that nothing publishes
about.
