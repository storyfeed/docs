# Quickstart

Recording an activity takes three things: models that say how they read in a
feed, a headline for the verb, and one call where the fact happens. The example
is a customer placing an order with a kitchen.

<script setup>
import { scenes } from '../.vitepress/theme/samples'
</script>

## Making the Models Feedable

A model that appears in the feed says how it should read:

```php
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
        return FeedEntity::make(label: "Order #{$this->reference}");
    }
}
```

`Kitchen` and `User` get the same treatment, each returning its own label.

## Giving the Verb a Headline

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target');
```

## Publishing an Activity

::: code-group
<<< @/snippets/publish.php [Fluent Syntax]
<<< @/snippets/publish.named-arguments.php [Named Arguments]
:::

On the feed:

<FeedExample context :items="[scenes.order]" />

## Rendering the Feed

Return the feed from a route:

```php
// routes/web.php
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/', function () {
    return Storyfeed::feed()->get();
});
```

With the demo records, links and glyph configured, the response looks like this:

<FeedExample payload :items="[scenes.order]" />

### Rendered Feed

The activity carries a headline template and the entities that fill its tokens:

<FeedExample :items="[scenes.order]">
  <template #annotations="{ node }">
    <Annotation v-if="node.id === scenes.order.id" label="Published above">An order placement</Annotation>
  </template>
</FeedExample>

### Rendering With Vue

With Inertia, pass the same feed as a prop instead,
`Inertia::render('Home', ['feed' => Storyfeed::feed()->get()])`, and the page
hands it to the app's own composable and stream component:

```vue
<!-- resources/js/Pages/Home.vue -->
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
