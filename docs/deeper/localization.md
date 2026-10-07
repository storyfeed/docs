# Localization

## Introduction

Headlines and nouns may use translation keys from your app's `lang` files.
Storyfeed translates them when retrieving the feed, using the application's
current locale. Set it for each request as described in Laravel's
[locale configuration](https://laravel.com/docs/13.x/localization#configuring-the-locale);
Storyfeed does not choose the reader's locale.

<script setup>
import { activity, scene, logOf, liveOf, VERBS } from '../.vitepress/theme/world'
const french = activity({ ...scene.order,
  headline_template: ':actor a passé :object chez :target' })
const frenchGroup = liveOf(logOf(scene.deeper.aggregation.orders).map(row => ({
  ...row, headline_template: french.headline_template,
})), {
  ...VERBS,
  place: {
    ...VERBS.place,
    repeat: ':actor a passé commande :count fois chez :target',
  },
})[0]
</script>

<a id="translating-a-headline"></a>

## Translating Headlines

Define the template for each supported locale, starting with the default:

::: code-group

```php [English] memo="lang/en/feed.php"
return [
    // Without this line, English readers see "feed.order_placed".
    'order_placed' => ':actor placed :object at :target',
];
```

```php [French] memo="lang/fr/feed.php"
return [
    'order_placed' => ':actor a passé :object chez :target',
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

### Translating Group Headlines

Add a template for the repeat group to each locale's `feed.php` file:

::: code-group

```php [English] memo="lang/en/feed.php"
return [
    'order_placements' => ':actor made :count order placements at :target',
];
```

```php [French] memo="lang/fr/feed.php"
return [
    'order_placements' => ':actor a passé commande :count fois chez :target',
];
```

:::

Pass the key to the group's headline:

::: code-group

```php [GroupBuilder] memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\FeedHeadline;
use Storyfeed\Grouping\GroupBuilder;

Story::for(Order::class)
    ->verb('place')
    ->grouped(
        fn (GroupBuilder $group) => $group
            ->repeat(FeedHeadline::trans('feed.order_placements')),
    );
```

```php [Group] memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\FeedHeadline;
use Storyfeed\Grouping\Group;

Story::for(Order::class)
    ->verb('place')
    ->grouped(
        Group::repeat()->headline(FeedHeadline::trans('feed.order_placements')),
    );
```

:::

With the locale set to French:

<FeedExample :items="[frenchGroup]" />

The translation is resolved when the feed is read, including when definitions
are cached. Role tokens remain linked, and `:count` counts activities.

Translated group tokens are not checked at boot. Each locale must use only
[tokens supported by the group's axis](/deeper/aggregation#singular-and-plural-tokens).

| Group Headline | How It Is Rendered |
|---|---|
| A string or `FeedHeadline::trans()` | a template whose role tokens and count are replaced |
| A closure | finished text; its result is not processed as a token template |

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
