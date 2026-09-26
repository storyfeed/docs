# Localization

## Introduction

Headlines and nouns may use translation keys from your app's `lang` files.
Storyfeed translates them when retrieving the feed, using the application's
current locale. Set it for each request as described in Laravel's
[locale configuration](https://laravel.com/docs/13.x/localization#configuring-the-locale);
Storyfeed does not choose the reader's locale.

<script setup>
import { activity, scene } from '../.vitepress/theme/world'
const french = activity({ ...scene.order,
  headline_template: ':actor a passé :object auprès de :target' })
</script>

<a id="translating-a-headline"></a>

## Translating Headlines

Define the template for each supported locale, starting with the default:

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

With the locale set to French:

<FeedExample :items="[french]" />

Translated templates keep linked tokens and
[optional segments](/basics/the-feed-file#optional-segments). You may reorder
tokens in each translation. Undefined keys are displayed as written.

`anonymousHeadline()` and `missingHeadline()` take a `FeedHeadline` too.

<a id="translating-a-noun"></a>

## Translating Nouns

Pass a translation key to `FeedNoun::trans()` for a group's noun:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\FeedNoun;

Story::for(Order::class)->fallback()->noun(FeedNoun::trans('nouns.order'));
```

Separate singular and plural forms with a pipe:

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

See [Aggregation](/deeper/aggregation#group-headline-tokens) for where nouns appear.
