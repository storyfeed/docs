# Feedable API

<script setup>
import { scene } from '../.vitepress/theme/world'
const withLink = [scene.order]

</script>

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

<a id="writing-tofeed-by-hand"></a>

### Implementing the Feedable Contract

The `Feedable` interface defines the `toFeed` and `feedMedia` methods.
The `InteractsWithFeed` trait implements `feedMedia` using your registered
closure. You may implement the static method directly:

::: code-group

```php [Fluent Syntax] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedMedia;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label("Order #{$this->reference}");
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia // [!code highlight]
    {
        return FeedMedia::make()
            ->url(route('orders.show', $context->routeKey()));
    }
}
```

```php [Named Arguments] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedMedia;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: "Order #{$this->reference}",
        );
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia // [!code highlight]
    {
        return FeedMedia::make(
            url: route('orders.show', $context->routeKey()),
        );
    }
}
```

:::

<FeedExample :items="withLink" />

A method defined on the model takes precedence over the trait's implementation.

## InteractsWithFeed

| Method | Where | Runs | Use |
|---|---|---|---|
| `describeFeed(): void` | the model | when the snapshot is written | fill `$this->feedEntity()` |
| `$this->feedEntity()` | inside `describeFeed()` | when the snapshot is written | the `FeedEntity` the snapshot is written from |
| `static::feedMediaUsing(fn (FeedContext $context, FeedMedia $media) => …)` | `booted()` | when the feed is retrieved | the link and media |
| `guessFeedLabel(): string` | the model, to override | when no label is set | the default label |
| `updateFeedSnapshot()` | anywhere | when called | refresh the snapshot outside a save |
| `deleteFromFeed()` | anywhere | when called | soft-delete every activity involving the model |
| `forceDeleteFromFeed()` | anywhere | when called | permanently delete every activity involving the model, including soft-deleted ones, with their grouping and participant records |
| `storyfeed(?string $preset = null)` | anywhere | when called | the model's own feed |

A `feedMediaUsing()` closure receives a `FeedContext` and an empty `FeedMedia`.
Return a URL string, the populated `$media`, or `null` for no link. Registering
another closure replaces the first. Without a resolver, the model has no link.

<a id="describing-the-snapshot"></a>

### Describing the Snapshot with `describeFeed()`

Define snapshot values by modifying the entity returned by `$this->feedEntity()`:

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
            ->body( // [!code highlight]
                Prose::make($this->instructions),
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
            ->body( // [!code highlight]
                Prose::make(content: $this->instructions),
            );
    }
}
```

:::

This example adds a body while retaining the default label. You may also set
labels and data, or combine values from a parent model and its subclasses.
Unset fields remain empty except for the label. If you implement `toFeed`,
the trait does not call `describeFeed`.

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

### Custom Labels

To customize default labels across your application, register a callback in a
service provider. Return `null` to use the default rules:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Illuminate\Database\Eloquent\Model;
use Storyfeed\Facades\Storyfeed;

Storyfeed::guessFeedLabelsUsing(
    fn (Model $model) => $model->getAttribute('reference'), // [!code highlight]
);
```

To customize one model's default label, override its `guessFeedLabel` method.
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

To include a model from another package without modifying its class, register
it in a service provider:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedMedia;

Storyfeed::feedable(Media::class)
    ->toFeedUsing(
        fn (Media $photo, FeedEntity $entity) => $entity
            ->label($photo->name)
            ->data(['mediaType' => $photo->mime_type]), // [!code highlight]
    )
    ->feedMediaUsing(
        fn (FeedContext $context, FeedMedia $media) => $media
            ->url(route('photos.show', $context->routeKey())),
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

## `ActivityContext`

The closures passed to `headline()`, `anonymousHeadline()` and
`missingHeadline()` receive a `Storyfeed\ActivityContext`. It provides the
activity's data, verb, publication time and roles. It does not expose the
`Activity` model. The context is immutable.

### Activity and Roles

| Method | Returns |
|---|---|
| `verb()` | the recorded verb as a string |
| `publishedAt()` | the publication time as a `Carbon\CarbonImmutable`, or `null` |
| `actor()` | the actor's `FeedContext`, or `null` |
| `object()` | the object's `FeedContext`, or `null` |
| `target()` | the target's `FeedContext`, or `null` |
| `context()` | the context role's `FeedContext`, or `null` |
| `origin()` | the origin's `FeedContext`, or `null` |
| `result()` | the result's `FeedContext`, or `null` |
| `instrument()` | the instrument's `FeedContext`, or `null` |

For example, `$activity->actor()?->label()` returns the actor's cached label.
An empty role returns `null`. A role whose snapshot is missing still provides
its recorded type and key, with a `null` label and empty data. Role contexts
use the same feed name and model hydration as `feedMedia()` contexts.

### Activity Data

`ActivityContext` uses Laravel's `InteractsWithData` trait. It offers the same
typed helpers as [Laravel's request](https://laravel.com/docs/13.x/requests#retrieving-input),
applied to the activity's `data`. Keys support dot notation.

| Method | Returns or behaviour |
|---|---|
| `get($key, $default = null)` | one value, or the default, as on Laravel's `Fluent` |
| `all($keys = null)` | all data, or selected keys; missing selected keys have `null` values |
| `boolean($key = null, $default = false)` | a boolean |
| `string($key, $default = null)` | an `Illuminate\Support\Stringable` |
| `str($key, $default = null)` | an alias for `string()` |
| `integer($key, $default = 0)` | an integer |
| `float($key, $default = 0.0)` | a float |
| `date($key, $format = null, $tz = null)` | a Carbon date, or `null` for an empty value; invalid formats may throw |
| `enum($key, $enumClass, $default = null)` | a backed enum case, or the default |
| `enums($key, $enumClass)` | an array of valid backed enum cases |
| `array($key = null)` | data as an array, or selected keys when given an array of keys |
| `collect($key = null)` | data as a collection, or selected keys when given an array of keys |
| `exists($key)` | an alias for `has()` |
| `has($key)` | whether all given keys exist, including values of `null` |
| `hasAny($keys)` | whether any given key exists |
| `filled($key)` | whether all given values are non-empty |
| `isNotFilled($key)` | whether all given values are empty |
| `anyFilled($keys)` | whether any given value is non-empty |
| `missing($key)` | whether any given key is absent |
| `whenHas($key, $callback, $default = null)` | calls the callback when the key exists |
| `whenFilled($key, $callback, $default = null)` | calls the callback when the value is non-empty |
| `whenMissing($key, $callback, $default = null)` | calls the callback when the key is absent |
| `only($keys)` | selected data, omitting absent keys |
| `except($keys)` | all data except the given keys |

Additional helpers follow the installed Laravel version. Laravel 13 also
provides `clamp($key, $min, $max, $default = 0)` for a bounded number,
`interval($key, $unit = null)` for a Carbon interval, and
`whenEnum($key, $enumClass, $callback, $default = null)` for a valid enum case.

The conditional helpers return the callback's result or the context, using
Laravel's behaviour. Unknown methods throw an error; the context does not
support macros or dynamic property access.

## `FeedLink`

A `FeedLink` contains a label and an `href`. Bodies accept it wherever
a piece of text may link to a page.

```php
use Storyfeed\FeedLink;

FeedLink::make($label, $url);
FeedLink::make()->label($label)->href($url);
```

| Method | Effect |
|---|---|
| `make($label, $href)` | create a link with its label and destination |
| `label(string $label)` | set the text to display |
| `href($href)` | set the destination URL |

| Body | Fields That Accept `FeedLink` |
|---|---|
| `ItemList` | each entry in `items` (also accepts strings), and `more` |
| `MediaObject` | `subject` and `footnote` (both also accept strings) |

The `href` is stored as written and may become stale if its destination changes
or a signed URL expires. A plain string remains unlinked.

The label names the thing being linked to; it is not an instruction such as
“Open the conversation”. See [Links in Bodies](/basics/activity-content#links-in-bodies)
for examples.


## `FeedMedia`

Every argument `FeedMedia::make()` takes has a method of the same name.

::: code-group

```php [Fluent Syntax]
FeedMedia::make()->url($url)->attributes(['target' => '_blank']);
// replaces the snapshot label on the item
FeedMedia::make()->url($url)->label($label);
// hint the renderer to open as a modal
FeedMedia::make()->url($url)->modal();
FeedMedia::make()->url($url)->preview($thumb)->icon($avatar);
```

```php [Named Arguments]
FeedMedia::make(url: $url, attributes: ['target' => '_blank']);
// replaces the snapshot label on the item
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
| `files()` | `FeedResource`s, for a PDF or other non-image resource; each call appends | `entity.media.files` |
| `body()` | a body, a list, or a closure called when the body is resolved; each call appends | `entity.body`, after the stored bodies |

### Modal Links

See [Linking to the Model](/basics/feed-media#linking-to-the-model) for URL,
modal, and attribute examples.

### Storing Snapshot Data

Use the `data` method in `toFeed` to store values with the snapshot, such as
an image's media type and dimensions:

<a id="a-complete-model"></a>

::: code-group

```php [Fluent Syntax] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label($this->name)
            ->data([ // [!code highlight]
                'mediaType' => $this->photo_mime,
                'width' => $this->photo_width,
                'height' => $this->photo_height,
            ]);
    }
}
```

```php [Named Arguments] memo="app/Models/MenuItem.php" at="toFeed()"
use Storyfeed\FeedEntity;

return FeedEntity::make(
    label: $this->name,
    data: [ // [!code highlight]
        'mediaType' => $this->photo_mime,
        'width' => $this->photo_width,
        'height' => $this->photo_height,
    ],
);
```

:::

These values are stored when the snapshot is written. A media resolver can
retrieve them through `$context->data('mediaType')`; a missing key returns `null`.

<a id="images"></a>

### Showing Image Previews

See [Showing Pictures](/basics/feed-media#showing-pictures). A picture appears
only when a body names its slot; the entity URL is only a link destination.

### Image Slots

See [Feed Media](/basics/feed-media#showing-pictures) for the three slots and
their Activity Streams meanings.

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

[Installation](/guide/installation#defining-morph-aliases) covers enforcing the
map.
