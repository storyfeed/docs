# Your first feed

Four steps: describe a model to the feed, author a story, publish an activity,
render the page. The example is a document being uploaded to a project.

## 1. Make your models feedable

Anything that appears in the feed — as actor, object, target, or context —
implements `Feedable`. Two methods, and the split between them is the point:

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

- **`toFeed()`** is a *snapshot*, written when an activity is published and
  refreshed whenever the model is saved. This is why reading a feed never
  touches your domain tables, and why a busy feed does not turn into a
  polymorphic N+1.
- **`toFeedLink()`** is **static** and runs at *read* time from the cached data.
  Labels stay fast; URLs never go stale. Return `null` for things that aren't
  independently linkable.

`toFeedLink()` receives *exactly* what `toFeed()` put in `data` — nothing is
added for you, so put the key you'll need to build the URL in there yourself
(that's the `'id'` above). Throwing inside it is survivable: the failure is
reported and the entity arrives with `url: null` rather than breaking the feed.

`InteractsWithFeed` wires the model events that keep the snapshot fresh.

::: tip MORPH ALIASES ARE NOT OPTIONAL
The feed stores morph aliases, never class names, so your entities survive a
namespace refactor. Enforce a morph map in a service provider:

```php
Relation::enforceMorphMap([
    'document' => Document::class,
    'project' => Project::class,
    'user' => User::class,
]);
```
:::

## 2. Author a story

A **Story** is one class per meaningful activity type. It carries the verb, the
headline, the icon, and how the activity groups when several of them land
together:

```php
use App\Models\Document;
use App\Enums\ActivityVerb;
use Storyfeed\Grouping\Group;
use Storyfeed\Story;

class DocumentWasUploaded extends Story
{
    public string|array|null $objectType = Document::class;

    public string|FeedVerb|null $verb = ActivityVerb::Upload;

    public function headline(): string
    {
        return ':actor uploaded :object to :target';
    }

    public function icon(): ?string
    {
        return 'bi-file-earmark-arrow-up';
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

Generate one with `php artisan make:story DocumentWasUploaded`, then register it:

```php
Storyfeed::stories([
    DocumentWasUploaded::class,
]);
```

Two things about the headlines above are load-bearing:

- They are **templates**, not rendered strings. `:actor` and `:object` are
  substituted by the *renderer*, from entities that arrive with the payload — so
  a headline is translatable and a link is a link.
- A group headline may only use tokens that are **true of every member**. The
  `repeat` group above can say `:actor` because all its members share one actor;
  it must not say `:object`, because five different documents were uploaded.
  `storyfeed:doctor` fails you for that rather than letting the feed lie.

## 3. Publish an activity

```php
Storyfeed::record(
    ActivityVerb::Upload,
    object: $document,
    actor: $user,
    target: $project,
);
```

Or fluently, when you need to build one conditionally:

```php
Storyfeed::activity(ActivityVerb::Upload, $document)
    ->actor($user)
    ->for($project)
    ->publish();
```

Publish from wherever the fact becomes true — an action class, an observer, a
domain event listener. Storyfeed does not care, and there is no magic:
recording is an explicit call.

## 4. Read it back

```php
$page = Storyfeed::feed()
    ->context($project)   // optional: scope to one entity
    ->limit(20)
    ->get();
```

`$page` is the **payload envelope** — `payload_version`, `items`,
`next_cursor`, `sync_token` — and it is `Arrayable`, `JsonSerializable` and
`Responsable`, so a JSON API endpoint is one line:

```php
Route::get('/feed', fn () => Storyfeed::feed()->limit(20)->get());
```

Three read modes, differing only in how much they collapse:

| call | what you get |
|---|---|
| `->log()` | the atomic timeline — one node per activity, no groups |
| `->live()` | mechanical grouping over the active window |
| `->summary()` | the collapsed best-axis view (**the default**) |

Paginate by passing the previous `next_cursor` back to `->cursor()`. Cursors are
opaque: store them, compare them, never parse them.

::: warning AN EMPTY `items` ARRAY IS NOT THE END OF THE FEED
Only a **null `next_cursor`** means the feed is exhausted. A page can legally
come back with zero items and a live cursor. Follow the cursor while empty,
bounded to a handful of hops.
:::

## 5. Render it

Every item is self-describing, so a renderer needs no domain knowledge. Here is
the whole thing in Blade — the reference loop, deliberately plain:

```blade
@php
    // One entity → linked label. A null label means the snapshot hasn't been
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

    // A plural role → joined exemplars, with overflow from the distinct block.
    $list = function (array $node, string $role) use ($entity) {
        $shown = array_map(fn ($e) => $entity($e), $node['exemplars'][$role] ?? []);
        $total = $node['distinct'][$role] ?? count($shown);
        $more = $total - count($shown);

        return implode(', ', $shown).($more > 0 ? " and {$more} more" : '');
    };
@endphp

@foreach ($page['items'] as $node)
    <article>
        <i class="{{ $node['icon'] }}"></i>

        @if ($node['headline_template'])
            {!! strtr($node['headline_template'], [
                ':actor'    => $entity($node['actor'] ?? null, 'Someone'),
                ':object'   => $entity($node['object'] ?? null),
                ':target'   => $entity($node['target'] ?? null),
                ':context'  => $entity($node['context'] ?? null),
                ':actors'   => $list($node, 'actors'),
                ':objects'  => $list($node, 'objects'),
                ':targets'  => $list($node, 'targets'),
                ':contexts' => $list($node, 'contexts'),
                ':count'    => $node['count'] ?? 1,
            ]) !!}
        @elseif ($node['headline'])
            {{ $node['headline'] }}
        @else
            {{-- A group that cannot be summarized: say so, and show the members. --}}
            {{ $node['count'] }} activities
        @endif

        <time datetime="{{ $node['published_at'] }}">
            {{ \Carbon\Carbon::parse($node['published_at'])->diffForHumans() }}
        </time>
    </article>
@endforeach
```

The last branch matters more than its three lines suggest. When a group cannot
be honestly summarized, the server sends **no headline at all** rather than
synthesizing one — a null there is *information*, not a gap, and the right
treatment is an avatar stack plus a bare count, ideally expanded by default. Do
not fall back to composing `<actor> <verb> <object>` yourself: that recreates the
one-actor lie the server just refused to tell.

::: tip
This is intentionally the minimum. It skips i18n, avatars, expandable children,
relative-time locales and infinite scroll — all of which `storyfeed/ui` will
ship. The point of showing it is that the contract is renderable by hand, in any
stack, at any time.
:::

## Then run doctor

```bash
php artisan storyfeed:doctor
```

Doctor reads your registries *and* the traffic in your feed, and tells you what
is missing: a verb with no grammar, a group that would arrive unnamed, a model
appearing in the feed that nothing publishes about, a schema column that drifted.
It is the fastest way to find the parts of this guide you skipped.
