# Feedable Models

<script setup>
import { who, where, orders, dishes, notes, photos, activity, group } from '../.vitepress/theme/samples'

const unlinked = { ...orders.first, url: null }
const at = '2026-08-14T14:30:00.000000Z'

const withSnapshot = [
  activity({ id: 'fm1', verb: 'place', glyph: 'shopping-bag', published_at: at,
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: unlinked, target: where.kitchen }),
]

const withLink = [
  activity({ id: 'fm2', verb: 'place', glyph: 'shopping-bag', published_at: at,
    headline_template: ':actor placed :object with :target',
    actor: who.regular, object: orders.first, target: where.kitchen }),
]

// A dish whose media carries a photo preview as well as its link.
const withImage = [
  activity({ id: 'fm6', verb: 'publish', glyph: 'chef-hat', published_at: '2026-08-14T09:00:00.000000Z',
    headline_template: ':actor put :object on the menu',
    actor: who.cook, object: { ...dishes.chickenCurry, media: photos.curry.media } }),
]

// The kitchen's own feed: orders placed with it, and the dish it put live.
const scoped = [
  group({ id: 'fm3', verb: 'place', axis: 'actors', count: 3, glyph: 'shopping-bag', published_at: at,
    headline_template: ':actors ordered from :target',
    actors: [who.regular, who.customer2, who.customer3], targets: [where.kitchen],
    objects: [orders.first, orders.second, orders.third],
    distinct: { actors: 3, objects: 3, targets: 1 } }),
  activity({ id: 'fm4', verb: 'ask', glyph: 'message-circle',
    published_at: '2026-08-14T14:28:00.000000Z',
    headline_template: ':actor asked about :target',
    actor: who.customer4, object: notes.spice, target: dishes.chickenCurry }),
  activity({ id: 'fm5', verb: 'publish', glyph: 'chef-hat',
    published_at: '2026-08-14T09:00:00.000000Z',
    headline_template: ':actor put :object on the menu',
    actor: who.cook, object: dishes.chickenCurry }),
]
</script>

## Introduction

A model that appears in an activity, as its actor, object, target or context,
implements `Feedable`. It gives the feed a label to print and a link to follow.

<a id="making-a-model-feedable"></a>

## Making Models Feedable

```php memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;
}
```

<FeedExample context :items="withSnapshot" />

That is a complete Feedable model. Its label is guessed, and it isn't a link.

The feed stores a snapshot of the model: its label, and anything else it is
given. The snapshot is taken when an activity is published, and refreshed every
time the model saves. The feed reads those stored values. A resolver can also request the current
model when it needs live values.

## Defining Entity Values

<a id="the-default-label"></a>

### Default Labels

A model that sets no label gets the first of these that it has:

| Guess | Example |
|---|---|
| its `name` attribute | `Chicken Curry` |
| its `title` attribute | `Spring Menu` |
| its registered noun and its key | `Dish #42` |
| its class name and its key | `Order #1042` |

### Custom Labels

To guess differently across the whole app, register a guesser in a service
provider. Returning `null` falls through to the list above:

```php memo="app/Providers/AppServiceProvider.php"
// boot()
use Illuminate\Database\Eloquent\Model;
use Storyfeed\Facades\Storyfeed;

Storyfeed::guessFeedLabelsUsing(
    fn (Model $model) => $model->getAttribute('reference'),
);
```

To change it for one model, write `guessFeedLabel()` on the model. To fall back
to Storyfeed's guess from inside it, alias the trait's method:

```php memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;

class Order extends Model implements Feedable
{
    use InteractsWithFeed {
        guessFeedLabel as guessedFeedLabel;
    }

    public function guessFeedLabel(): string
    {
        return $this->reference ?? $this->guessedFeedLabel();
    }
}
```

<a id="describing-the-snapshot"></a>

`describeFeed()` says what the snapshot holds:

```php memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function describeFeed(): void
    {
        $this->feedEntity()->label("Order #{$this->reference}");
    }
}
```

<FeedExample :items="withSnapshot" />

`$this->feedEntity()` is the entity the snapshot is written from. Each call
adds to it, and whatever it leaves unset stays empty, except the label, which
is guessed.

### Snapshot Data

Use `describeFeed()` to store values that a media resolver needs later:

```php memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    public function describeFeed(): void
    {
        $this->feedEntity()->label($this->name)->data([
            'mediaType' => $this->photo_mime,
            'width' => $this->photo_width,
            'height' => $this->photo_height,
        ]);
    }
}
```

The feed stores these values in the entity snapshot. [Images](#images) shows how a resolver uses them.

## Resolving Links and Images

<a id="the-link"></a>

### Links

A link is resolved when the feed is read. Register a resolver in `booted()` to build it from the stored snapshot:

```php memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    protected static function booted(): void
    {
        static::feedMediaUsing(
            fn ($context) => route('orders.show', $context->routeKey()),
        );
    }

    public function describeFeed(): void
    {
        $this->feedEntity()->label("Order #{$this->reference}");
    }
}
```

<FeedExample :items="withLink" />

`$context` carries the snapshot. `$context->routeKey()` is the model's route
key, the id or slug `route()` expects. A string is the URL; `null` is no link.
The URL is built on every read, so a changed route never leaves a stale link.

<a id="a-link-per-feed"></a>

### Links for Named Feeds

`$context->feed()` is the name the feed was
[registered](/basics/named-feeds) under, so one snapshot can link somewhere
different on each surface, or nowhere:

```php memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    protected static function booted(): void
    {
        static::feedMediaUsing(fn ($context) => match ($context->feed()) {
            'kitchen' => route('kitchen.ticket', $context->routeKey()),
            'customer' => route('orders.status', $context->routeKey()),
            // an ad-hoc feed reports no name; without this arm the match throws
            default => null,
        });
    }
}
```

On the `kitchen` feed:

<FeedExample :items="withLink" />

On a feed with no name:

<FeedExample :items="withSnapshot" />

The name comes from the feed's registration, not from the request, so a link
resolves the same way in a queued job, the console and a test.

### Images

The media resolver can fill a preview as well as a link. This model uses the stored image dimensions on the customer feed:

<a id="a-complete-model"></a>

::: code-group
```php [Fluent Syntax] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedImage;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    protected static function booted(): void
    {
        static::feedMediaUsing(fn ($context, $media) => match ($context->feed()) {
            'kitchen' => route('kitchen.menu.edit', $context->routeKey()),
            'customer' => $media
                ->url(route('menu.show', $context->routeKey()))
                ->preview(FeedImage::make()
                    ->src(route('menu.photo', $context->routeKey()))
                    ->mediaType($context->data('mediaType'))
                    ->width($context->data('width'))
                    ->height($context->data('height'))
                    ->alt($context->label())
                ),
            default => null,
        });
    }

    public function describeFeed(): void
    {
        $this->feedEntity()
            ->label($this->name)
            ->data([
                // the intrinsic facts a thumbnail needs,
                // stored once, read on every render
                'mediaType' => $this->photo_mime,
                'width' => $this->photo_width,
                'height' => $this->photo_height,
            ]);
    }
}
```

```php [Named Arguments] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedImage;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    protected static function booted(): void
    {
        static::feedMediaUsing(fn ($context, $media) => match ($context->feed()) {
            'kitchen' => route('kitchen.menu.edit', $context->routeKey()),
            'customer' => $media
                ->url(route('menu.show', $context->routeKey()))
                ->preview(FeedImage::make(
                    src: route('menu.photo', $context->routeKey()),
                    mediaType: $context->data('mediaType'),
                    width: $context->data('width'),
                    height: $context->data('height'),
                    alt: $context->label(),
                )
                ),
            default => null,
        });
    }

    public function describeFeed(): void
    {
        $this->feedEntity()
            ->label($this->name)
            ->data([
                // the intrinsic facts a thumbnail needs,
                // stored once, read on every render
                'mediaType' => $this->photo_mime,
                'width' => $this->photo_width,
                'height' => $this->photo_height,
            ]);
    }
}
```
:::

<FeedExample :items="withImage" />

`$context->data()` reads a snapshot value and returns `null` for a missing key. `preview()` supplies an image; `url()` supplies the link. See [Feedable API](/reference/feedable) for all media slots.

<a id="writing-tofeed-by-hand"></a>

## Implementing the Feedable Contract

`toFeed()` and `feedMedia()` are the two methods of the `Feedable` contract.
`InteractsWithFeed` writes them from `describeFeed()` and `feedMediaUsing()`.
A model can write them itself instead:

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

    public static function feedMedia(FeedContext $context): ?FeedMedia
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

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make(
            url: route('orders.show', $context->routeKey()),
        );
    }
}
```

:::

<FeedExample :items="withLink" />

A method the model writes takes precedence over the trait's.

<a id="models-you-don-t-own"></a>

## Registering External Models

A model from another package can't implement `Feedable`. Register it in a
service provider instead:

```php memo="app/Providers/AppServiceProvider.php"
// boot()
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Storyfeed\Facades\Storyfeed;

Storyfeed::feedable(Media::class)
    ->toFeedUsing(fn (Media $photo, $entity) => $entity
        ->label($photo->name)
        ->data(['mediaType' => $photo->mime_type])
    )
    ->feedMediaUsing(fn ($context, $media) => $media
        ->url(route('photos.show', $context->routeKey()))
    );
```

The model is then feedable everywhere a `Feedable` is: its snapshot refreshes
on save, and its deletes reach the feed, including deletes the other package
makes itself. Both closures are optional; with neither, the label is guessed.

Register the exact class the package creates, because a model's events fire
under its own class name. A class that already implements `Feedable` can't
also be registered.

<a id="the-model-s-own-feed"></a>

## Reading a Model's Feed

`InteractsWithFeed` also gives the model a feed of everything it took part in:

```php
// a controller, or wherever the feed is read
$kitchen->storyfeed()->get();
```

<FeedExample :items="scoped">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedExample>

It is the same builder as `Storyfeed::feed()->involving($kitchen)->get()`.

<a id="morph-aliases"></a>

## Defining Morph Aliases

Storyfeed stores morph aliases, never class names, so entities survive a
namespace change. Enforce a map:

```php memo="app/Providers/AppServiceProvider.php"
// boot()
use App\Models\Kitchen;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\Relation;

Relation::enforceMorphMap([
    'order' => Order::class,
    'menu_item' => MenuItem::class,
    'kitchen' => Kitchen::class,
    // Aliases are permanent: an activity whose alias no longer resolves still
    // shows, with a placeholder. Renaming a key means keeping the old one
    // pointed somewhere.
    'user' => User::class,
]);
```

::: headless
:::
