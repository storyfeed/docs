# Feedable Models

<script setup>
import { scene, role } from '../.vitepress/theme/world'

const withSnapshot = [{ ...scene.order, object: { ...scene.order.object, url: null } }]
const withLink = [scene.order]
const product = scene.basics.activityContent.product
const withImage = [{ ...product, object: { ...product.object, body: null,
  media: scene.basics.activityContent.photo.object.media } }]
</script>

## Introduction

A feedable model provides a label for its activities. Storyfeed supplies a
default label; links and images are optional. Making a model feedable does
not record activities.

<a id="making-a-model-feedable"></a>

## Making Models Feedable

<a id="the-default-label"></a>
<a id="default-labels"></a>

### Using Default Labels

Implement the `Feedable` interface and use the `InteractsWithFeed` trait:

```php memo="app/Models/Order.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;

class Order extends Model implements Feedable
{
    use InteractsWithFeed; // [!code highlight]
}
```

<FeedExample :items="withSnapshot" />

The trait supplies the label without a `toFeed` method. Common defaults include:

| Source | Example |
|---|---|
| `name` attribute | {{ role.product.label }} |
| `title` attribute | `Spring Menu` |
| class name and key | `Order #1042` |

Storyfeed caches the model's feed values in a **snapshot**, which it refreshes
when the model is saved while recording is enabled.

<a id="models-you-don-t-own"></a>
<a id="registering-external-models"></a>

For models from another package, such as Spatie Media Library, see [Registering External Models](/reference/feedable#registering-external-models).

<a id="writing-tofeed-by-hand"></a>
<a id="implementing-the-feedable-contract"></a>

You may also [implement the Feedable contract's methods directly](/reference/feedable#implementing-the-feedable-contract).

<a id="the-model-s-own-feed"></a>
<a id="reading-a-model-s-feed"></a>

To retrieve activities involving a model, see [Filtering by Entity or Role](/basics/reading#filtering-by-entity-or-role).

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

<a id="defining-entity-values"></a>

## Customizing Model Labels

To set a model's label, define its `toFeed` method:

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
        return FeedEntity::make()->label("Order #{$this->reference}"); // [!code highlight]
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
            label: "Order #{$this->reference}", // [!code highlight]
        );
    }
}
```
:::

<FeedExample :items="withSnapshot" />

The `toFeed` method returns a `FeedEntity` containing the model's label.
Set the label on the returned entity when you implement this method.

<a id="custom-labels"></a>

You may also [customize default labels across your application](/reference/feedable#custom-labels).

<a id="describing-the-snapshot"></a>
<a id="describing-the-snapshot-with-describefeed"></a>

To add snapshot values while retaining a default label, use [`describeFeed()`](/reference/feedable#describing-the-snapshot-with-describefeed).

## Resolving Links and Images

<a id="the-link"></a>

<a id="links"></a>

### Adding Links

Storyfeed resolves links when retrieving the feed. Register a resolver in the
model's `booted` method:

```php memo="app/Models/Order.php" at="booted()"
use Storyfeed\FeedContext;

static::feedMediaUsing(
    fn (FeedContext $context) => route('orders.show', $context->routeKey()), // [!code highlight]
);
```

<FeedExample :items="withLink" />

The resolver receives the snapshot through `$context`. Its `routeKey` method
returns the model's route key, such as the ID or slug accepted by `route`.
Return a URL string or `null` for no link.

<a id="a-link-per-feed"></a>

A resolver may return a different URL for each
[named feed](/basics/named-feeds#linking-each-feed-somewhere-different).

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

Add a media resolver to the `MenuItem` model's `booted` method. Use `preview`
for the image and `url` for the link:

::: code-group

```php [Fluent Syntax] memo="app/Models/MenuItem.php" at="booted()"
use Storyfeed\FeedContext;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

static::feedMediaUsing(
    fn (FeedContext $context, FeedMedia $media) => $media
        ->url(route('menu.show', $context->routeKey()))
        ->preview( // [!code highlight]
            FeedImage::make()
                ->src(route('menu.photo', $context->routeKey()))
                ->mediaType($context->data('mediaType'))
                ->width($context->data('width'))
                ->height($context->data('height'))
                ->alt($context->label()),
        ),
);
```

```php [Named Arguments] memo="app/Models/MenuItem.php" at="booted()"
use Storyfeed\FeedContext;
use Storyfeed\FeedImage;
use Storyfeed\FeedMedia;

static::feedMediaUsing(
    fn (FeedContext $context, FeedMedia $media) => $media
        ->url(route('menu.show', $context->routeKey()))
        ->preview( // [!code highlight]
            FeedImage::make(
                src: route('menu.photo', $context->routeKey()),
                mediaType: $context->data('mediaType'),
                width: $context->data('width'),
                height: $context->data('height'),
                alt: $context->label(),
            ),
        ),
);
```

:::

<FeedExample :items="withImage" />

The resolver receives the snapshot's values in `$context` and an empty
`FeedMedia` in `$media`. Return the populated media to include the preview.
See [Feedable API](/reference/feedable#feedmedia) for all media properties.

<a id="modal-links"></a>

To mark a link for display in a modal, see [Modal Links](/reference/feedable#modal-links).

::: headless
:::
