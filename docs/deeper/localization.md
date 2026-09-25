# Localization

## Introduction

A headline or noun can use a translation key from your app's `lang` files.
Storyfeed translates it when the feed is read, using the application's current locale.

<script setup>
import { activity, scenes } from '../.vitepress/theme/samples'

const french = activity({ ...scenes.order, id: 'lc1',
  headline_template: ':actor a passé :object auprès de :target' })
</script>

<a id="translating-a-headline"></a>

## Defining Translated Headlines

### Translation Files

Define the template in your language file:

```php
// lang/fr/feed.php
return [
    'order_placed' => ':actor a passé :object auprès de :target',
];
```

### Using Translation Keys

Pass the translation key to `FeedHeadline::trans()`:

```php
// routes/feed.php
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\FeedHeadline;

Story::for(Order::class)
    ->verb('place')
    ->headline(FeedHeadline::trans('feed.order_placed'));
```

<FeedExample :items="[french]" />

The key is translated when the feed is read, using the application's current locale. The
translated line is a template like any other: its tokens stay links, and its
[optional segments](/basics/the-feed-file#optional-segments) still apply.
Tokens are substituted by the renderer, so word order stays the translator's
decision. A missing key renders as the key.

`anonymousHeadline()` and `missingHeadline()` take a `FeedHeadline` too.

<a id="translating-a-noun"></a>

## Defining Translated Nouns

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

[Aggregation](/deeper/aggregation#group-headline-tokens) covers where
a noun appears.

## Selecting the Locale

Set Laravel's application locale before reading the feed. Storyfeed uses that
locale to resolve headline and noun keys; it does not choose a locale for the
reader. See Laravel's [locale configuration](https://laravel.com/docs/13.x/localization#configuring-the-locale)
for request-specific locale selection.
