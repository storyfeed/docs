# Feedable API

## Introduction

Everything a `Feedable` model can put on the feed, and everything it can read
back at render time. [Feedable Models](/basics/feedable-models) shows the
common path.

<span id="the-contract"></span>

## The Feedable Contract

```php memo="src/Contracts/Feedable.php"
<?php

namespace Storyfeed\Contracts;

use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedMedia;

interface Feedable
{
    public function toFeed(): FeedEntity;

    public static function feedMedia(FeedContext $context): ?FeedMedia;
}
```

| Method | Runs At | Produces |
|---|---|---|
| `toFeed()` | publish time, and again on every save | the snapshot: label, data, bodies |
| `feedMedia()` | read time, statically, from the snapshot | links and media, fresh on every read |

`InteractsWithFeed` writes both methods, so a model with the trait and no feed
code is complete. A `toFeed()` or `feedMedia()` written on the model takes
precedence over the trait's.

## InteractsWithFeed

| Method | Where | Runs | Use |
|---|---|---|---|
| `describeFeed(): void` | the model | when the snapshot is written | fill `$this->feedEntity()` |
| `$this->feedEntity()` | inside `describeFeed()` | when the snapshot is written | the `FeedEntity` the snapshot is written from |
| `static::feedMediaUsing(fn ($context, $media) => …)` | `booted()` | when the feed is read | the link and media |
| `guessFeedLabel(): string` | the model, to override | when no label is set | the default label |
| `updateFeedSnapshot()` | anywhere | when called | refresh the snapshot outside a save |
| `deleteFromFeed()` | anywhere | when called | soft-delete every activity involving the model |
| `forceDeleteFromFeed()` | anywhere | when called | permanently delete every activity involving the model, including soft-deleted ones, with their grouping and participant rows |
| `storyfeed(?string $feed = null)` | anywhere | when called | the model's own feed |

A `feedMediaUsing()` closure receives the `FeedContext` and an empty
`FeedMedia`, and returns a URL string, the `$media` it filled, or `null` for no
link. Registering again replaces the closure. A model that registers none is
not a link.

::: code-group

```php [Fluent Syntax] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Prose;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function describeFeed(): void
    {
        $this->feedEntity()
            ->label("Order #{$this->reference}")
            ->body(Prose::make($this->instructions));
    }

    protected static function booted(): void
    {
        static::feedMediaUsing(
            fn ($context) => route('orders.show', $context->routeKey()),
        );
    }
}
```

```php [Named Arguments] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Prose;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function describeFeed(): void
    {
        $this->feedEntity()
            ->label("Order #{$this->reference}")
            ->body(Prose::make(content: $this->instructions));
    }

    protected static function booted(): void
    {
        static::feedMediaUsing(
            fn ($context) => route('orders.show', $context->routeKey()),
        );
    }
}
```

:::

<span id="the-default-label"></span>

### Default Labels

A label left unset is guessed, first match wins:

| Guess | Example |
|---|---|
| the app-wide guesser, when it returns a string | whatever it returns |
| a `name` attribute | `Chicken Curry` |
| a `title` attribute | `Spring Menu` |
| the registered noun and the key | `Dish #42` |
| the class name as words and the key | `Menu Item #42` |

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Illuminate\Database\Eloquent\Model;
use Storyfeed\Facades\Storyfeed;

// null falls through
Storyfeed::guessFeedLabelsUsing(
    fn (Model $model) => $model->getAttribute('reference'),
);
```

A model that writes its own `guessFeedLabel()` is not asked by the app-wide
guesser. To reach the trait's guess from inside it, alias it:
`use InteractsWithFeed { guessFeedLabel as guessedFeedLabel; }`.

### Snapshot Maintenance

`InteractsWithFeed` listens to the model's events. None of them runs while
recording is disabled.

| Event | What happens |
|---|---|
| `saved` | the snapshot is refreshed |
| `deleted` | the model's activities are pointed at a tombstone, and its snapshot is deleted |
| `restored` | its activities are pointed back at the model, and the tombstone is deleted |
| `forceDeleted` | the tombstone becomes permanent |

Activities stay unless their verb declares `forgetWhenMissing()`.
`deleteFromFeed()` and `forceDeleteFromFeed()` explicitly remove activities.
[Deleted Models](/deeper/deleted-models) covers tombstones.

Entities recorded before they had a snapshot (imports, backfills) are
snapshotted by [`storyfeed:trickle`](/reference/commands). Until then they
render with `label: null` and `url: null`, and your frontend can choose a placeholder. Activities are never hidden by the read path.

<span id="the-model-s-own-feed"></span>

### Reading the Model's Feed

`$model->storyfeed()` is `Storyfeed::feed()->involving($model)` with the
argument filled in, and takes an optional feed name:
`$model->storyfeed('customer')`. Both read `feed_participants`.

The `storyfeed()` helper function is different: it returns the manager, or a
pending activity when given a verb. Inside a model, `storyfeed()` is the helper
and `$this->storyfeed()` is the model's feed.

<span id="models-you-don-t-own"></span>

## Registering External Models

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Storyfeed\Facades\Storyfeed;

Storyfeed::feedable(Media::class)
    ->toFeedUsing(fn (Media $media, $entity) => $entity->label($media->name))
    ->feedMediaUsing(
        fn ($context, $media) => $media->url(route('media.show', $context->key())),
    );
```

| Method | Receives | Returns |
|---|---|---|
| `Storyfeed::feedable($class)` | a model class | a `FeedableRegistration` |
| `->toFeedUsing(fn ($model, $entity) => …)` | the model and an empty `FeedEntity` | the entity, or nothing; an unset label is guessed |
| `->feedMediaUsing(fn ($context, $media) => …)` | the `FeedContext` and an empty `FeedMedia` | a URL string, the `$media`, or `null` |

Both closures are optional. The registered class is `Feedable` everywhere
Storyfeed checks: its saves refresh its snapshot, and its deletes, force
deletes and restores reach the feed. Registration is by exact class, so
register the class that is instantiated, not a parent. A class that implements
`Feedable` can't also be registered.

## `FeedEntity`

`FeedEntity::make()` starts empty. Every argument it takes has a method of the
same name, and each method changes the entity and returns it.

::: code-group

```php [Fluent Syntax]
FeedEntity::make()
    ->label("Order #{$this->reference}")
    ->data(['total' => $this->total])
    ->body(Prose::make($this->instructions));
```

```php [Named Arguments]
FeedEntity::make(
    label: "Order #{$this->reference}",
    data: ['total' => $this->total],
    body: Prose::make(content: $this->instructions),
);
```

:::

| Method | Type | On the Payload |
|---|---|---|
| `label()` | `?string` | `entity.label` |
| `data()` | array or `Arrayable`, merged; or a key and a value | `entity.data`, what `feedMedia()` reads back |
| `body()` | a body, a string, or a list; each call appends | `entity.body` |
| `content()` | `?string` | authored text, for comments and posts |
| `mediaType()` | `?string` | the encoding of `content` |
| `attributedTo()` | `?string` | the author's IRI |
| `tombstone()` | `Closure(PendingTombstone)` | not on the payload: what the model's tombstone keeps |

`FeedEntity` is `Conditionable`, so `->when()` and `->unless()` work in a
chain. Body types are listed in [Activity Body Content](/deeper/body#existing-body-types).

Payload shape: [entity object](/reference/payload#entity-object).

### `PendingTombstone`

```php memo="app/Models/Order.php" at="describeFeed()"
use Storyfeed\PendingTombstone;

$this->feedEntity()
    ->label("Order #{$this->reference}")
    ->tombstone(fn (PendingTombstone $tombstone) => $tombstone->keepLabel());
```

| Method | Effect |
|---|---|
| `keepLabel(bool $keep = true)` | the tombstone keeps the model's label, so its activities go on naming it |

It applies when a model event reports the delete. A tombstone made by the
trickle or by `Storyfeed::tombstone()` keeps no label. Deleting a model's
activities with it is the verb's decision, `->forgetWhenMissing()`.
[Deleted Models](/deeper/deleted-models) covers the whole lifecycle.

## `FeedContext`

`feedMedia()` receives a `FeedContext`. The resolver runs for every entity with
a snapshot on a page, including sampled group entities that are never drawn as links,
so it should make no writes and no queries except `model()`.

| Accessor | Returns |
|---|---|
| `$context->type()` | the morph alias, as stored on the activity |
| `$context->key()` | the entity's key, as `getKey()` returns it |
| `$context->routeKey()` | the entity's route key, as `getRouteKey()` returned it when the snapshot was written; `key()` when no route key is stored |
| `$context->label()` | the cached label |
| `$context->data()` | the `data` array the snapshot holds |
| `$context->data('mediaType')` | one value from it, by dot path (`'photo.width'`); a missing key reads as `null`, or as the second argument |
| `$context->feed()` | the registered name of the feed being read, or `null` on an ad-hoc feed and in the Activity Streams serializer |
| `$context->model()` | the live model, or `null` |

If the resolver throws, the exception is reported and the entity gets
`url: null` and `media: null`; the rest of the feed renders.

<span id="context-model"></span>

### Loading the Model

```php
$document = $context->model(with: ['project'], withTrashed: true);
```

One query per class per page, however many entities ask. It returns `null` when
the row is gone, soft-deleted, or `storyfeed.hydration.enabled` is `false`, so
the resolver must handle `null`.

| Argument | Effect |
|---|---|
| `with: ['project']` | eager loads the relation across the whole batch; nested access without it is an N+1 |
| `withCount: ['comments']` | loads relationship counts with the model batch |
| `withTrashed: true` | includes soft-deleted rows, on models that soft-delete |

## `FeedMedia`

Every argument `FeedMedia::make()` takes has a method of the same name.

::: code-group

```php [Fluent Syntax]
FeedMedia::make()->url($url)->attributes(['target' => '_blank']);
// replaces the snapshot label on the node
FeedMedia::make()->url($url)->label($label);
// hint the renderer to open as a modal
FeedMedia::make()->url($url)->modal();
FeedMedia::make()->url($url)->preview($thumb)->icon($avatar);
```

```php [Named Arguments]
FeedMedia::make(url: $url, attributes: ['target' => '_blank']);
// replaces the snapshot label on the node
FeedMedia::make(url: $url, label: $label);
// hint the renderer to open as a modal
FeedMedia::make(url: $url, modal: true);
FeedMedia::make(url: $url, preview: $thumb, icon: $avatar);
```

:::

| Method | Type | On the Payload |
|---|---|---|
| `url()` | string, or a `FeedImage` when the resource is an image | `entity.url` |
| `label()` | string | replaces `entity.label` |
| `attributes()` | array, merged; or a key and a value | `entity.attributes` |
| `modal()` | bool, default `true` | `entity.modal` |
| `icon()`, `preview()`, `image()` | `FeedImage`, or a bare src string | `entity.media` |
| `attachments()` | `FeedResource`s, for a PDF or other non-image resource; each call appends | `entity.media.attachments` |
| `body()` | a body, a list, or a closure called only when the body is read; each call appends | `entity.body`, after the stored bodies |

### Image Slots

The slots are Activity Streams 2.0 property names:

| Slot | Holds |
|---|---|
| `icon` | small and representational, about 32×32 and square: an avatar, a logo |
| `preview` | a preview of the resource: the thumbnail a dense feed paints |
| `image` | a larger visual representation of a non-image resource: a hero shot |
| `url` | a `FeedImage` in place of a string when the resource itself is an image |

::: code-group

```php [Fluent Syntax] memo="app/Models/Document.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

class Document extends Model implements Feedable
{
    use InteractsWithFeed;

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make()
            ->url(route('documents.show', $context->routeKey()))
            ->preview(FeedImage::make()
                // resolved here, at read time
                ->src(route('documents.thumbnail', $context->routeKey()))
                // the intrinsic facts come from the snapshot
                ->mediaType($context->data('mediaType'))
                ->width($context->data('width'))
                ->height($context->data('height'))
                ->alt($context->label()));
    }
}
```

```php [Named Arguments] memo="app/Models/Document.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

class Document extends Model implements Feedable
{
    use InteractsWithFeed;

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make(
            url: route('documents.show', $context->routeKey()),
            preview: FeedImage::make(
                // resolved here, at read time
                src: route('documents.thumbnail', $context->routeKey()),
                // the intrinsic facts come from the snapshot
                mediaType: $context->data('mediaType'),
                width: $context->data('width'),
                height: $context->data('height'),
                alt: $context->label(),
            ),
        );
    }
}
```

:::

Each argument below also has a method of the same name.

| `FeedImage::make()` | Type |
|---|---|
| `src` | string, required when the image is used |
| `mediaType` | `?string` |
| `width`, `height` | `?int`; a zero or negative value reads as `null` |
| `alt` | `?string` |

| `FeedResource::make()` | Type |
|---|---|
| `href` | string, required when the resource is used |
| `mediaType` | `?string` |
| `name` | `?string` |
| `type` | string, default `Document` |

Payload shape: [entity media](/reference/payload#entity-media).

<span id="rich-rendering"></span>

### Rich Content

::: code-group

```php [Fluent Syntax]
use Storyfeed\Body\Component;

FeedEntity::make()
    ->label($this->name)
    ->body(Component::make()->name('Resource')->props(['status' => $this->status]));
```

```php [Named Arguments]
use Storyfeed\Body\Component;

FeedEntity::make(
    label: $this->name,
    body: Component::make(name: 'Resource', props: ['status' => $this->status]),
);
```

:::

The payload carries the `Component` body in `entity.body`, with its `name`
and `props`; what your frontend draws for the name is yours.
[Activity Body Content](/deeper/body#drawing-your-own-component) covers it.

## Morph Aliases

Aliases are read from the app's morph map, or from `morph_map` in
`config/storyfeed.php`, which merges into it at boot. The package's own aliases
resolve whether or not the app's map registers them.

An activity whose role alias no longer resolves still appears in the payload with no resolved label or link. The trickle counts it as unresolved, and soft-deletes it only with
`storyfeed.trickle.prune` or `storyfeed:trickle --prune`.

[Feedable Models](/basics/feedable-models#morph-aliases) covers enforcing the
map.
