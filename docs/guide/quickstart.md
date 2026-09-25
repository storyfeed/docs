# Quickstart

<script setup>
import { scene } from '../.vitepress/theme/world'
</script>

## Introduction

Recording an activity takes three things: models that say how they read in a
feed, a headline for the verb, and one call where the fact happens. The example
is a customer placing an order with a shop.

<a id="making-the-models-feedable"></a>

## Preparing the Models

[Install Storyfeed](/guide/installation) before defining your models and headline.

A model that appears in the feed says how it should read:

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

`Shop` and `User` get the same treatment, each returning its own label.

<a id="giving-the-verb-a-headline"></a>

## Defining a Headline

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target');
```

## Publishing an Activity

::: code-group
<<< @/snippets/publish.php {php memo="Where the order is placed: a controller, an action, a listener"} [Fluent Syntax]
<<< @/snippets/publish.named-arguments.php {php memo="Where the order is placed: a controller, an action, a listener"} [Named Arguments]
:::

On the feed:

<FeedExample :items="[scene.order]" />

## Reading the Feed

Return the feed from a route:

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function () {
    return Storyfeed::feed()->get();
});
```

<a id="displaying-the-payload"></a>

With the demo records, links and glyph configured, the response looks like this:

<FeedExample payload :items="[scene.order]" />

## Rendering the Feed

<a id="rendered-feed"></a>
<a id="rendering-with-vue"></a>

::: headless
:::

[Rendering](/basics/rendering) covers turning the payload into a feed, with a
Vue example.
