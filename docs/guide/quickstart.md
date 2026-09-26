# Quickstart

<script setup>
import { scene } from '../.vitepress/theme/world'

// What these three steps produce: no links and no icon are defined yet, so
// every url and the glyph are null.
const unlinked = (entity) => entity && { ...entity, url: null, media: null }
const order = { ...scene.order, glyph: null, glyph_intent: null,
  actor: unlinked(scene.order.actor), object: unlinked(scene.order.object), target: unlinked(scene.order.target) }
</script>

## Introduction

To record an activity, prepare the models, define a headline, and publish the
activity from your application. This example records a customer placing an
order with a shop.

<a id="making-the-models-feedable"></a>

## Preparing the Models

[Install Storyfeed](/guide/installation) before defining your models and headline.

To include the `Order` model in an activity, implement the `Feedable` interface
and use the `InteractsWithFeed` trait. Define its label in the `toFeed` method:

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

For the `Shop` and `User` models, implement `Feedable` and use
`InteractsWithFeed` as well. If you omit the `toFeed` method, Storyfeed generates
a [default label](/basics/feedable-models#default-labels) from the model's
attributes, such as `name`.

<a id="giving-the-verb-a-headline"></a>

## Defining a Headline

Define a headline for the `place` verb in `routes/feed.php`:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target');
```

## Publishing an Activity

Publish the activity where your application places the order:

::: code-group
<<< @/snippets/publish.php {php memo="Where the order is placed: a controller, an action, a listener"} [Fluent Syntax]
<<< @/snippets/publish.named-arguments.php {php memo="Where the order is placed: a controller, an action, a listener"} [Named Arguments]
:::

<FeedExample :items="[order]" />

## Reading the Feed

To retrieve a page of activities, call the `feed` method on the `Storyfeed`
facade, followed by the `get` method. You may return the result from a route:

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function () {
    return Storyfeed::feed()->get();
});
```

<a id="displaying-the-payload"></a>

The route returns a JSON payload:

<FeedExample payload :items="[order]" />

<a id="rendering-the-feed"></a>
<a id="rendered-feed"></a>
<a id="rendering-with-vue"></a>

::: headless
:::

See [Rendering](/basics/rendering) to display the feed with Blade or Vue.
