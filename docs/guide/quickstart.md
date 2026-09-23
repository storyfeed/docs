# Quickstart

Recording an activity takes three things: models that say how they read in a
feed, a headline for the verb, and one call where the fact happens. The example
is a customer placing an order with a kitchen.

<script setup>
import { scenes } from '../.vitepress/theme/samples'
</script>

## 1. Make the Models Feedable

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

## 2. Give the Verb a Headline

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    'order.place' => ':actor placed :object with :target',
]);
```

## 3. Publish an Activity

<<< @/snippets/publish.php

On the feed:

<FeedExample context :items="[scenes.order]" />

## 4. See the Feed

This call returns everything the kitchen took part in:

```php
// a controller, or wherever the feed is read
$page = Storyfeed::feed()->involving($kitchen)->get();
```

<FeedExample :items="[scenes.order]" />

Each node carries its sentence with the entities already in it, so drawing one
needs no knowledge of your app.

::: details What the markup looks like

A page hands the payload to a composable, and the composable to the stream:

```vue
<!-- resources/js/Pages/Kitchen/Feed.vue -->
<script setup lang="ts">
import { usePoll } from '@inertiajs/vue3'
import { toRef } from 'vue'
import FeedStream from '@/components/feed/FeedStream.vue'
import { useFeedStream } from '@/composables/useFeedStream'

const props = defineProps<{ feed: FeedPayload, kitchen: { id: number } }>()

const { items, nextCursor, loadingMore, loadMore } = useFeedStream(
    toRef(() => props.feed),
    (cursor) => feedPage.url({ query: { kitchen: props.kitchen.id, cursor } }),
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
the payload and the URL for the next page. None of it knows what an order is.
:::

## Check Your Work

```bash
php artisan storyfeed:doctor
```

The doctor names each problem with its fix: a verb with no headline, or a
model in the feed that nothing publishes about.
