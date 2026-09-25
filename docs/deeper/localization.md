# Localization

## Introduction

A headline or noun can use a translation key from your app's `lang` files.
Storyfeed translates it when the feed is read, in the application's current
locale, so set the locale for each request as Laravel's
[locale configuration](https://laravel.com/docs/13.x/localization#configuring-the-locale)
describes. Storyfeed does not choose a locale for the reader.

<script setup>
import { activity, scene } from '../.vitepress/theme/world'
const french = activity({ ...scene.order,
  headline_template: ':actor a passé :object auprès de :target' })
</script>

<a id="translating-a-headline"></a>

## Translating Headlines

Define the template in a language file for each locale your app serves,
starting with its default locale:

::: code-group

```php [English] memo="lang/en/feed.php"
return [
    // Without this line, English readers see "feed.order_placed".
    'order_placed' => ':actor placed :object with :target',
];
```

```php [French] memo="lang/fr/feed.php"
return [
    'order_placed' => ':actor a passé :object auprès de :target',
];
```

:::

Pass the translation key to `FeedHeadline::trans()`:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\FeedHeadline;

Story::for(Order::class)
    ->verb('place')
    ->headline(FeedHeadline::trans('feed.order_placed'));
```

A French reader sees:

<FeedExample :items="[french]" />

The translated line is a template like any other: its tokens stay links, and
its [optional segments](/basics/the-feed-file#optional-segments) still apply.
Tokens can appear in any order in a translation. A key that no language file
defines renders as the key.

`anonymousHeadline()` and `missingHeadline()` take a `FeedHeadline` too.

<a id="translating-a-noun"></a>

## Translating Nouns

A group's noun takes a translation key the same way:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\FeedNoun;

Story::for(Order::class)->fallback()->noun(FeedNoun::trans('nouns.order'));
```

The value holds the singular and plural forms, separated by a pipe:

::: code-group

```php [English] memo="lang/en/nouns.php"
return [
    'order' => 'order|orders',
];
```

```php [French] memo="lang/fr/nouns.php"
return [
    'order' => 'commande|commandes',
];
```

:::

[Aggregation](/deeper/aggregation#group-headline-tokens) covers where
a noun appears.
