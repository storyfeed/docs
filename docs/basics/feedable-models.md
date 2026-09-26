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

To include a model in the feed, implement the `Feedable` interface to provide
its label and optional link.

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

The `toFeed` method returns a `FeedEntity` containing the model's label.
The `InteractsWithFeed` trait implements the remaining `Feedable` methods.

Storyfeed caches the model's feed values in a **snapshot**, which it refreshes
whenever the model is saved.

<a id="morph-aliases"></a>

### Defining Morph Aliases

Storyfeed identifies models by morph aliases, so changing a class namespace
does not invalidate existing activities. Register the aliases with an enforced
morph map:

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

Keep aliases used by existing activities in the map. If an alias cannot be
resolved, the feed displays a placeholder for that model.

## Defining Entity Values

<a id="the-default-label"></a>

### Default Labels

You may omit the `toFeed` method to use the trait's default implementation:

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

Common default labels include:

| Source | Example |
|---|---|
| `name` attribute | {{ role.product.label }} |
| `title` attribute | `Spring Menu` |
| class name and key | `Order #1042` |

If you implement the `toFeed` method, set the label on the returned entity.

### Custom Labels

To customize default labels across your application, register a callback in a
service provider. Return `null` to use Storyfeed's default rules:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Illuminate\Database\Eloquent\Model;
use Storyfeed\Facades\Storyfeed;

Storyfeed::guessFeedLabelsUsing(
    fn (Model $model) => $model->getAttribute('reference'),
);
```

To customize one model's default label, implement its `guessFeedLabel` method.
See [Feedable API](/reference/feedable#default-labels) for the complete label
precedence and how to call the trait's implementation.

<a id="describing-the-snapshot"></a>

### Describing the Snapshot with `describeFeed()`

You may define snapshot values in the `describeFeed` method by modifying the
entity returned by `$this->feedEntity()`:

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

Use this method to add data or bodies while retaining the default label, or to
combine values from a parent model and its subclasses. Unset fields remain
empty except for the label. If you implement `toFeed`, the trait does not call
`describeFeed`.

## Resolving Links and Images

<a id="the-link"></a>

### Links

Storyfeed resolves links when retrieving the feed. Register a resolver in the
model's `booted` method:

```php memo="app/Models/Order.php" at="booted()"
use Storyfeed\FeedContext;

static::feedMediaUsing(
    fn (FeedContext $context) => route('orders.show', $context->routeKey()),
);
```

<FeedExample :items="withLink" />

The resolver receives the snapshot through `$context`. Its `routeKey` method
returns the model's route key, such as the ID or slug accepted by `route`.
Return a URL string or `null` for no link.

<a id="a-link-per-feed"></a>

A resolver may return a different URL for each
[named feed](/basics/named-feeds#linking-each-feed-somewhere-different).

### Images

The media resolver may also provide an image preview. Use the `data` method to
store the values it needs, such as the photo's media type and dimensions:

<a id="a-complete-model"></a>

::: code-group
```php [Fluent Syntax] memo="app/Models/MenuItem.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    protected static function booted(): void
    {
        static::feedMediaUsing(
            fn (FeedContext $context, FeedMedia $media) => $media
                ->url(route('menu.show', $context->routeKey()))
                ->preview(FeedImage::make()
                    ->src(route('menu.photo', $context->routeKey()))
                    ->mediaType($context->data('mediaType'))
                    ->width($context->data('width'))
                    ->height($context->data('height'))
                    ->alt($context->label())
                ),
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
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

class MenuItem extends Model implements Feedable
{
    use InteractsWithFeed;

    protected static function booted(): void
    {
        static::feedMediaUsing(
            fn (FeedContext $context, FeedMedia $media) => $media
                ->url(route('menu.show', $context->routeKey()))
                ->preview(FeedImage::make(
                    src: route('menu.photo', $context->routeKey()),
                    mediaType: $context->data('mediaType'),
                    width: $context->data('width'),
                    height: $context->data('height'),
                    alt: $context->label(),
                )),
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

The context's `data` method returns a snapshot value, or `null` if the key is
missing. Use the `preview` method for the image and the `url` method for the
link. See [Feedable API](/reference/feedable) for all media properties.

<a id="modal-links"></a>

### Modal Links

To mark a photo or document link for display in a modal, call the `modal`
method on its media. This sets `modal: true` on the entity:

::: code-group

```php [Fluent Syntax] memo="app/Models/Photo.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

class Photo extends Model implements Feedable
{
    use InteractsWithFeed;

    protected static function booted(): void
    {
        static::feedMediaUsing(
            fn (FeedContext $context, FeedMedia $media) => $media
                ->url(route('photos.show', $context->routeKey()))
                ->modal(),
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
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

class Photo extends Model implements Feedable
{
    use InteractsWithFeed;

    protected static function booted(): void
    {
        static::feedMediaUsing(
            fn (FeedContext $context) => FeedMedia::make(
                url: route('photos.show', $context->routeKey()),
                modal: true,
            ),
        );
    }
}
```

:::

<FeedExample :items="openInPlace" />

The payload's `modal` field is a boolean.

<a id="writing-tofeed-by-hand"></a>

## Implementing the Feedable Contract

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

A method defined on the model takes precedence over the trait's implementation.

<a id="models-you-don-t-own"></a>

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
            ->data(['mediaType' => $photo->mime_type]),
    )
    ->feedMediaUsing(
        fn (FeedContext $context, FeedMedia $media) => $media
            ->url(route('photos.show', $context->routeKey())),
    );
```

Storyfeed then accepts the model wherever a `Feedable` model is supported.
Both closures are optional. Without them, Storyfeed generates a default label.

Register the exact class instantiated by the package. You cannot register a
class that already implements `Feedable`.

<a id="the-model-s-own-feed"></a>

## Reading a Model's Feed

To retrieve activities involving the model, call the `storyfeed` method
provided by the `InteractsWithFeed` trait:

```php memo="A controller, or wherever the feed is read"
$shop->storyfeed()->get();
```

<FeedExample :items="scoped">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedExample>

This is equivalent to `Storyfeed::feed()->involving($shop)->get()`.

::: headless
:::
