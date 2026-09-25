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

The activity carries a headline template and the entities that fill its tokens:

<FeedExample :items="[scene.order]">
  <template #annotations="{ node }">
    <Annotation v-if="node.id === scene.order.id" label="Published above">An order placement</Annotation>
  </template>
</FeedExample>

### Rendering With Vue

With Inertia, pass the same feed as a prop instead,
`Inertia::render('Home', ['feed' => Storyfeed::feed()->get()])`, and the page
hands it to the app's own composable and stream component:

```vue memo="resources/js/Pages/Home.vue"
<script setup lang="ts">
import { usePoll } from '@inertiajs/vue3'
import { toRef } from 'vue'
import FeedStream from '@/feed/FeedStream.vue'   // the app's own component
import { useFeed } from '@/feed/useFeed'         // the app's own composable
import type { FeedPayload } from '@/feed/types'

const props = defineProps<{ feed: FeedPayload }>()

const { items, nextCursor, loadingMore, loadMore } = useFeed(
    toRef(() => props.feed),
    (cursor) => `/?cursor=${cursor}`,
)

usePoll(10_000, { only: ['feed'] })
</script>

<template>
    <FeedStream
        :items="items"
        :next-cursor="nextCursor"
        :loading-more="loadingMore"
        @load-more="loadMore"
    />
</template>
```

The composable holds the paging, the stream draws nodes, and the page supplies
the payload and the URL of the next page. None of it knows what an order is.

::: headless
:::
