# Quickstart

<script setup>
import { scene, avatar } from '../.vitepress/theme/world'

// What the recording produces: no links and no icon are defined yet, so
// every link and the glyph are null, and each entity shows its avatar.
const unlinked = (entity) => entity && { ...entity, link: null, media: avatar(entity.type, entity.id, entity.label) }
const order = { ...scene.order, glyph: null, glyph_intent: null,
  actor: unlinked(scene.order.actor), object: unlinked(scene.order.object), target: unlinked(scene.order.target) }
</script>

## Introduction

Record an activity and display it with the Blade kit. Prepare the models,
define a headline, and publish the activity from your application. This example records a customer placing an
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

Do the same for `Shop` and `User`. If you omit the `toFeed` method, Storyfeed generates
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

<a id="reading-the-feed"></a>

## Retrieving the Feed

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

<a id="rendered-feed"></a>
<a id="rendering-with-vue"></a>

## Rendering the Feed

Install the Blade kit:

```bash
composer require storyfeed/ui
```

Register its Tailwind CSS v4 utilities:

```css memo="resources/css/app.css"
@source "../../vendor/storyfeed/ui/resources/views";
```

Return a view from the route:

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function () {
    return view('feed', ['page' => Storyfeed::feed()->get()]);
});
```

Render the page in the view and load your application's CSS:

```blade memo="resources/views/feed.blade.php"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @vite('resources/css/app.css')
</head>
<body>
    <x-storyfeed::feed :page="$page" />
</body>
</html>
```

Compile the CSS with `npm run build`. The feed displays the order placement:

<FeedExample :items="[order]" />

For Inertia applications, use the [Vue](/ui/vue) or [React](/ui/react) kit.

## Story Classes

```php memo="app/Stories/OrderStory.php"
<?php

namespace App\Stories;

class OrderStory
{
    public function place(): string
    {
        return ':actor placed :object with :target';
    }
}
```

```php memo="routes/feed.php"
use App\Models\Order;
use App\Stories\OrderStory;
use Storyfeed\Facades\Story;

Story::resource(Order::class, OrderStory::class);
```

See [Story Classes](/basics/stories).
