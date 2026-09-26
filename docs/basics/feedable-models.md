# Feedable Models

<script setup>
import { scene, role } from '../.vitepress/theme/world'

const withSnapshot = [{ ...scene.order, object: { ...scene.order.object, url: null } }]
const withLink = [scene.order]
</script>

## Introduction

A feedable model provides a label for its activities. Storyfeed supplies a
default label; links and images are optional. Making a model feedable does
not record activities.

<a id="models-you-don-t-own"></a>
<a id="registering-external-models"></a>
<a id="writing-tofeed-by-hand"></a>
<a id="implementing-the-feedable-contract"></a>
<a id="the-model-s-own-feed"></a>
<a id="reading-a-model-s-feed"></a>

For a model from another package, such as Spatie Media Library, see
[Registering External Models](/reference/feedable#registering-external-models).
To implement the contract's methods yourself, see
[Implementing the Feedable Contract](/reference/feedable#implementing-the-feedable-contract).
To retrieve a model's activities, see
[Filtering by Entity or Role](/basics/reading#filtering-by-entity-or-role).

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

Without any configuration, Storyfeed guesses a model's feed label by checking
commonly used columns, falling back on the class name and key.

| Source | Example |
|---|---|
| `name` attribute | {{ role.product.label }} |
| `title` attribute | `Spring Menu` |
| class name and key | `Order #1042` |

<FeedExample :items="withSnapshot" />

<a id="morph-aliases"></a>
<a id="defining-morph-aliases"></a>

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

<a id="resolving-links-and-images"></a>
<a id="the-link"></a>
<a id="links"></a>
<a id="adding-links"></a>

## Customizing a Model's Link

Storyfeed resolves links when retrieving the feed. To set a model's link,
define its static `feedMedia` method:

```php memo="app/Models/Order.php"
use Storyfeed\FeedContext;
use Storyfeed\FeedMedia;

public static function feedMedia(FeedContext $context): ?FeedMedia // [!code highlight]
{
    return FeedMedia::make()->url(route('orders.show', $context->routeKey()));
}
```

<FeedExample :items="withLink" />

The method receives the snapshot through `$context`. Its `routeKey` method
returns the model's route key, such as the ID or slug accepted by `route`.
Return a `FeedMedia` with the URL, or `null` for no link.

Alternatively, use the trait's implementation by registering a resolver in
the model's `booted` method:

```php memo="app/Models/Order.php" at="booted()"
use Storyfeed\FeedContext;

static::feedMediaUsing(
    fn (FeedContext $context) => route('orders.show', $context->routeKey()), // [!code highlight]
);
```

The trait calls the registered resolver, which may return a URL string,
a `FeedMedia`, or `null`. Without a resolver, it returns `null`.
A `feedMedia` method defined on the model takes precedence over the trait's
implementation.

<a id="a-link-per-feed"></a>

A resolver may return a different URL for each
[named feed](/basics/named-feeds#linking-each-feed-somewhere-different).

<a id="storing-snapshot-data"></a>
<a id="a-complete-model"></a>

For snapshot data, see [Storing Snapshot Data](/reference/feedable#storing-snapshot-data).

<a id="images"></a>
<a id="showing-image-previews"></a>

For images, see [Showing Image Previews](/reference/feedable#showing-image-previews).

<a id="modal-links"></a>

To mark a link for display in a modal, see [Modal Links](/reference/feedable#modal-links).

::: headless
:::
