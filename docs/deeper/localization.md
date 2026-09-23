# Localization

A headline can be a translation key. Each reader sees it in their own locale,
from your app's `lang` files.

<script setup>
import { activity, scenes } from '../.vitepress/theme/samples'

const french = activity({ ...scenes.order, id: 'lc1',
  headline_template: ':actor a passé :object auprès de :target' })
</script>

## Translating a Headline

::: code-group

```php [Fluent Syntax]
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\FeedHeadline;

Story::for(Order::class)
    ->verb('place')
    ->headline(FeedHeadline::trans('feed.order_placed'));
```

```php [Array]
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedHeadline;

Storyfeed::grammar([
    'order.place' => FeedHeadline::trans('feed.order_placed'),
]);
```

:::

```php
// lang/fr/feed.php
return [
    'order_placed' => ':actor a passé :object auprès de :target',
];
```

<FeedExample :items="[french]" />

The key is translated when the feed is read, in the reader's locale. The
translated line is a template like any other: its tokens stay links, and its
[optional segments](/basics/the-feed-file#optional-segments) still apply.
Tokens are substituted by the renderer, so word order stays the translator's
decision. A missing key renders as the key.

`anonymousHeadline()` and `missingHeadline()` take a `FeedHeadline` too.

## Translating a Noun

A group's noun takes a translation key the same way:

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\FeedNoun;

Story::for(Order::class)->fallback()->noun(FeedNoun::trans('nouns.order'));
```

```php
// lang/fr/nouns.php
return [
    'order' => 'commande|commandes',
];
```

[Aggregation](/deeper/aggregation#tokens-a-group-headline-may-use) covers where
a noun appears.
