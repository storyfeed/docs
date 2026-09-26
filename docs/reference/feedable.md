# Feedable API

## Introduction

The `Feedable` API defines model snapshots and resolves current links and
media. See [Feedable Models](/basics/feedable-models) for setup.

<span id="the-contract"></span>

## The Feedable Contract

```php memo="vendor/storyfeed/storyfeed/src/Contracts/Feedable.php"
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

| Method | Runs At | Returns |
|---|---|---|
| `toFeed()` | publication and every model save | snapshot labels, data, and bodies |
| `feedMedia()` | feed retrieval, called statically with snapshot data | current links and media |

`InteractsWithFeed` implements both methods. You may use its defaults or
override either method on the model.

## InteractsWithFeed

| Method | Where | Runs | Use |
|---|---|---|---|
| `describeFeed(): void` | the model | when the snapshot is written | fill `$this->feedEntity()` |
| `$this->feedEntity()` | inside `describeFeed()` | when the snapshot is written | the `FeedEntity` the snapshot is written from |
| `static::feedMediaUsing(fn (FeedContext $context, FeedMedia $media) => …)` | `booted()` | when the feed is retrieved | the link and media |
| `feedMediaIcon()`, `feedMediaPreview()`, `feedMediaImage()` | `toFeed()` or `describeFeed()` | when building a body | a reference to the matching media slot, resolved when retrieved |
| `guessFeedLabel(): string` | the model, to override | when no label is set | the default label |
| `updateFeedSnapshot()` | anywhere | when called | refresh the snapshot outside a save |
| `deleteFromFeed()` | anywhere | when called | soft-delete every activity involving the model |
| `forceDeleteFromFeed()` | anywhere | when called | permanently delete every activity involving the model, including soft-deleted ones, with their grouping and participant records |
| `storyfeed(?string $preset = null)` | anywhere | when called | the model's own feed |

A `feedMediaUsing()` closure receives a `FeedContext` and an empty `FeedMedia`.
Return a URL string, the populated `$media`, or `null` for no link. Registering
another closure replaces the first. Without a resolver, the model has no link.

::: code-group

```php [Fluent Syntax] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Prose;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;

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
            fn (FeedContext $context) => route('orders.show', $context->routeKey()),
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
use Storyfeed\FeedContext;

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
            fn (FeedContext $context) => route('orders.show', $context->routeKey()),
        );
    }
}
```

:::

<span id="the-default-label"></span>

### Default Labels

Unset labels use the first available value:

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

Overriding `guessFeedLabel()` bypasses the application-wide guesser. To call
the trait's implementation from your override, alias it:
`use InteractsWithFeed { guessFeedLabel as guessedFeedLabel; }`.

### Snapshot Maintenance

`InteractsWithFeed` handles these model events while recording is enabled:

| Event | What happens |
|---|---|
| `saved` | the snapshot is refreshed |
| `deleted` | the model's activities are pointed at a tombstone, and its snapshot is deleted |
| `restored` | its activities are pointed back at the model, and the tombstone is deleted |
| `forceDeleted` | the tombstone becomes permanent |

Activities stay unless their verb declares `forgetWhenMissing()`.
`deleteFromFeed()` and `forceDeleteFromFeed()` explicitly remove activities.
[Deleted Models](/deeper/deleted-models) covers tombstones.

<span id="the-model-s-own-feed"></span>

### Reading the Model's Feed

`$model->storyfeed()` is shorthand for `Storyfeed::feed()->involving($model)`.
Pass a feed name to use a named feed: `$model->storyfeed('customer')`.

The global `storyfeed()` helper returns the manager, or a pending activity
when passed a verb. Inside a model, use `$this->storyfeed()` to retrieve that
model's feed.

<span id="models-you-don-t-own"></span>

## Registering External Models

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedMedia;

Storyfeed::feedable(Media::class)
    ->toFeedUsing(fn (Media $media, FeedEntity $entity) => $entity->label($media->name))
    ->feedMediaUsing(
        fn (FeedContext $context, FeedMedia $media) => $media->url(route('media.show', $context->key())),
    );
```

| Method | Receives | Returns |
|---|---|---|
| `Storyfeed::feedable($class)` | a model class | a registration to chain the methods below on |
| `->toFeedUsing(fn (Model $model, FeedEntity $entity) => …)` | the model and an empty `FeedEntity` | the entity, or nothing; an unset label is guessed |
| `->feedMediaUsing(fn (FeedContext $context, FeedMedia $media) => …)` | the `FeedContext` and an empty `FeedMedia` | a URL string, the `$media`, or `null` |

Both closures are optional. Storyfeed treats the registered class as Feedable:
saves refresh snapshots, and deletion and restoration update its activities.
Register the exact instantiated class; parent registrations do not apply to
subclasses. Classes implementing `Feedable` cannot also be registered.

## `FeedEntity`

`FeedEntity::make()` starts empty. Each argument has a matching method that
updates and returns the entity.

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
| `data()` | array or `Arrayable`, merged; or a key and a value | `entity.data`, available to `feedMedia()` |
| `body()` | a body, a string, or a list; each call appends | `entity.body` |
| `content()` | `?string` | authored text, for comments and posts |
| `mediaType()` | `?string` | the encoding of `content` |
| `attributedTo()` | `?string` | the author's IRI |
| `tombstone()` | `Closure(PendingTombstone)` | not on the payload: what the model's tombstone keeps |

`FeedEntity` supports `when()` and `unless()` through `Conditionable`.
See [Activity Content](/basics/activity-content#built-in-body-types) for body types.

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
| `keepLabel(bool $keep = true)` | the tombstone keeps the model's label, for display in its activities |

`keepLabel()` applies only to model-event deletions. Tombstones created by
`storyfeed:trickle` or `Storyfeed::tombstone()` omit labels. Use the verb's
`forgetWhenMissing()` setting to delete affected activities.
See [Deleted Models](/deeper/deleted-models).

## `FeedContext`

`feedMedia()` receives a `FeedContext` for each entity with a snapshot,
including sampled group entities that may not display as links. Resolvers
should not write data or query the database except through `model()`.

| Accessor | Returns |
|---|---|
| `$context->type()` | the morph alias, as stored on the activity |
| `$context->key()` | the entity's key, as `getKey()` returns it |
| `$context->routeKey()` | the entity's route key, as `getRouteKey()` returned it when the snapshot was written; `key()` when no route key is stored |
| `$context->label()` | the cached label |
| `$context->data()` | the `data` array the snapshot holds |
| `$context->data('mediaType')` | one value from it, by dot path (`'photo.width'`); a missing key returns `null`, or as the second argument |
| `$context->feed()` | the registered name of the feed being retrieved, or `null` on an ad-hoc feed and in the Activity Streams serializer |
| `$context->model()` | the current model, or `null` |

If the resolver throws, Storyfeed reports the exception and returns
`url: null` and `media: null` for that entity. The rest of the feed still renders.

<span id="context-model"></span>

### Loading the Model

```php
$document = $context->model(with: ['project'], withTrashed: true);
```

`model()` loads all entities of a class with one query per page. It returns
`null` for missing or soft-deleted models, or when `storyfeed.hydration.enabled`
is `false`. Handle `null` in your resolver.

| Argument | Effect |
|---|---|
| `with: ['project']` | eager loads the relation for all loaded models; nested access without it is an N+1 |
| `withCount: ['comments']` | loads relationship counts for all loaded models |
| `withTrashed: true` | includes soft-deleted records, on models that soft-delete |

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
| `body()` | a body, a list, or a closure called when the body is resolved; each call appends | `entity.body`, after the stored bodies |

### Image Slots

The slots are Activity Streams 2.0 property names:

| Slot | Content |
|---|---|
| `icon` | small, square icon image, about 32×32, such as an avatar or logo |
| `preview` | resource thumbnail for a compact feed |
| `image` | larger image representing a non-image resource |
| `url` | `FeedImage` instead of a string when the resource itself is an image |

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
            ->preview(
                FeedImage::make()
                    // resolved here, at read time
                    ->src(route('documents.thumbnail', $context->routeKey()))
                    // the intrinsic facts come from the snapshot
                    ->mediaType($context->data('mediaType'))
                    ->width($context->data('width'))
                    ->height($context->data('height'))
                    ->alt($context->label()),
            );
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
| `width`, `height` | `?int`; zero or negative values return `null` |
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

A `Component` body appears in `entity.body` with its `name` and `props`.
Your frontend maps the name to a component. See
[Custom Body Types](/deeper/body#drawing-your-own-component).

## Morph Aliases

Aliases come from the application's morph map. The `morph_map` configuration
in `config/storyfeed.php` is merged into it. Storyfeed's own aliases resolve
without an application mapping.

Activities with unresolved role aliases remain in the payload without a
label or link for that role. `storyfeed:trickle` counts them as unresolved
and soft-deletes them only with `storyfeed.trickle.prune` or `--prune`.

[Feedable Models](/basics/feedable-models#morph-aliases) covers enforcing the
map.
