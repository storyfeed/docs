# Feedable Models

<script setup>
import { scene, role, liveOf } from '../.vitepress/theme/world'

// The same recorded fact, with and without a URL supplied by the model.
const withSnapshot = [{ ...scene.order, object: { ...scene.order.object, url: null } }]
const withLink = [scene.order]
// The MenuItem supplies a preview image: the item, with its photo.
const product = scene.basics.activityContent.product
const withImage = [{ ...product, object: { ...product.object, body: null,
  media: scene.basics.activityContent.photo.object.media } }]
// A photo whose link opens in place.
const openInPlace = [{ ...scene.basics.activityContent.photo,
  object: { ...scene.basics.activityContent.photo.object, modal: true } }]
const scoped = liveOf(scene.basics.namedFeeds.shop)
</script>

## Introduction

A model that appears in the feed implements `Feedable`. It gives the feed a
label to print and a link to follow.

<a id="making-a-model-feedable"></a>

## Making Models Feedable

::: code-group
```php [Fluent Syntax] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()->label("Order #{$this->reference}");
    }
}
```

```php [Named Arguments] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: "Order #{$this->reference}",
        );
    }
}
```
:::

<FeedExample :items="withSnapshot" />

`toFeed()` returns the entity the feed stores for the model: here, its label.
`InteractsWithFeed` supplies the rest of the `Feedable` contract. The order
isn't a link yet.

The feed stores a copy of the label, updated whenever the model saves.

<a id="morph-aliases"></a>

### Defining Morph Aliases

Storyfeed stores morph aliases, never class names, so entities survive a
namespace change. Enforce a map:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\Relation;

Relation::enforceMorphMap([
    'order' => Order::class,
    'menu_item' => MenuItem::class,
    'shop' => Shop::class,
    'user' => User::class,
]);
```

Keep an alias in the map once activities use it. An activity whose alias no
longer resolves shows a placeholder in place of the model.

## Defining Entity Values

<a id="the-default-label"></a>

### Default Labels

A model can leave `toFeed()` out. The trait alone is a complete Feedable model:

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

<FeedExample :items="withSnapshot" />

Its label is guessed, from the first of these that it has:

| Guess | Example |
|---|---|
| its `name` attribute | {{ role.product.label }} |
| its `title` attribute | `Spring Menu` |
| its class name and its key | `Order #1042` |

A model that writes `toFeed()` sets its own label, and nothing is guessed.

### Custom Labels

To guess differently across the whole app, register a guesser in a service
provider. Returning `null` falls through to the list above:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Illuminate\Database\Eloquent\Model;
use Storyfeed\Facades\Storyfeed;

Storyfeed::guessFeedLabelsUsing(
    fn (Model $model) => $model->getAttribute('reference'),
);
```

To change it for one model, write `guessFeedLabel()` on the model.
[Feedable API](/reference/feedable#default-labels) lists every guess, and how
to fall back to Storyfeed's guess from inside your own.

<a id="describing-the-snapshot"></a>

### Describing the Snapshot with `describeFeed()`

`describeFeed()` is the other way to write the snapshot. Instead of returning a
new entity, the model adds to the one the trait builds, through
`$this->feedEntity()`:

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

Each call adds to the same entity. Whatever it leaves unset stays empty, except
the label, which is guessed. Prefer it when a model should keep its guessed
label while adding data or a body, or when a parent model and its subclasses
each add a part. A model that writes `toFeed()` itself never calls
`describeFeed()`.

## Resolving Links and Images

<a id="the-link"></a>

### Links

A link is resolved when the feed is read. Register a resolver in `booted()` to build it from the stored snapshot:

::: code-group
```php [Fluent Syntax] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    protected static function booted(): void
    {
        static::feedMediaUsing(
            fn ($context) => route('orders.show', $context->routeKey()),
        );
    }

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()->label("Order #{$this->reference}");
    }
}
```

```php [Named Arguments] memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Order extends Model implements Feedable
{
    use InteractsWithFeed;

    protected static function booted(): void
    {
        static::feedMediaUsing(
            fn ($context) => route('orders.show', $context->routeKey()),
        );
    }

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: "Order #{$this->reference}",
        );
    }
}
```
:::

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
            'shop' => route('shop.ticket', $context->routeKey()),
            'customer' => route('orders.status', $context->routeKey()),
            // an ad-hoc feed reports no name; without this arm the match throws
            default => null,
        });
    }
}
```

On the `shop` feed:

<FeedExample :items="withLink" />

On a feed with no name:

<FeedExample :items="withSnapshot" />

### Images

The media resolver can fill a preview as well as a link. `data()` stores the
values it needs with the snapshot, here the photo's type and size:

<a id="a-complete-model"></a>

::: code-group
```php [Fluent Syntax] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;
use Storyfeed\FeedImage;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    protected static function booted(): void
    {
        static::feedMediaUsing(fn ($context, $media) => $media
            ->url(route('menu.show', $context->routeKey()))
            ->preview(FeedImage::make()
                ->src(route('menu.photo', $context->routeKey()))
                ->mediaType($context->data('mediaType'))
                ->width($context->data('width'))
                ->height($context->data('height'))
                ->alt($context->label())
            )
        );
    }

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
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
use Storyfeed\FeedEntity;
use Storyfeed\FeedImage;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    protected static function booted(): void
    {
        static::feedMediaUsing(fn ($context, $media) => $media
            ->url(route('menu.show', $context->routeKey()))
            ->preview(FeedImage::make(
                src: route('menu.photo', $context->routeKey()),
                mediaType: $context->data('mediaType'),
                width: $context->data('width'),
                height: $context->data('height'),
                alt: $context->label(),
            ))
        );
    }

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->name,
            data: [
                // the intrinsic facts a thumbnail needs,
                // stored once, read on every render
                'mediaType' => $this->photo_mime,
                'width' => $this->photo_width,
                'height' => $this->photo_height,
            ],
        );
    }
}
```
:::

<FeedExample :items="withImage" />

`$context->data()` reads a snapshot value and returns `null` for a missing key. `preview()` supplies an image; `url()` supplies the link. See [Feedable API](/reference/feedable) for all media slots.

<a id="modal-links"></a>

### Modal Links

Some entities are better opened than navigated to, like a photograph or a
document preview. `modal()` on the media marks the link, and the entity
carries `modal: true`:

::: code-group

```php [Fluent Syntax] memo="app/Models/Photo.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;

class Photo extends Model implements Feedable
{
    use InteractsWithFeed;

    protected static function booted(): void
    {
        static::feedMediaUsing(fn ($context, $media) => $media
            ->url(route('photos.show', $context->routeKey()))
            ->modal()
        );
    }
}
```

```php [Named Arguments] memo="app/Models/Photo.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedMedia;

class Photo extends Model implements Feedable
{
    use InteractsWithFeed;

    protected static function booted(): void
    {
        static::feedMediaUsing(fn ($context) => FeedMedia::make(
            url: route('photos.show', $context->routeKey()),
            modal: true,
        ));
    }
}
```

:::

<FeedExample :items="openInPlace" />

`modal` is a boolean in the payload.

<a id="writing-tofeed-by-hand"></a>

## Implementing the Feedable Contract

`toFeed()` and `feedMedia()` are the two methods of the `Feedable` contract.
`InteractsWithFeed` writes `feedMedia()` from the `feedMediaUsing()` closure.
A model can write it itself instead, as a static method:

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

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
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

The model is then feedable everywhere a `Feedable` is. Both closures are
optional; with neither, the label is guessed.

Register the exact class the package creates. A class that already implements
`Feedable` can't also be registered.

<a id="the-model-s-own-feed"></a>

## Reading a Model's Feed

`InteractsWithFeed` also gives the model a feed of everything it took part in:

```php memo="A controller, or wherever the feed is read"
$shop->storyfeed()->get();
```

<FeedExample :items="scoped">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedExample>

It is the same builder as `Storyfeed::feed()->involving($shop)->get()`.

::: headless
:::
