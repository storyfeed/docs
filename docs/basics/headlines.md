# Headlines

A headline is the sentence the feed prints for an activity. It is a template,
registered once per verb, and the feed fills in the entities. When you are
done, every verb your app records reads as a sentence.

<script setup>
import { activity, scenes } from '../.vitepress/theme/samples'

const withoutIcon = activity({ ...scenes.order, id: 'hl1', glyph: null })
</script>

## Registering a Headline

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    '*.order.placed' => ':actor placed :object with :target',
]);
```

<FeedStream :items="[withoutIcon]" :grouped="false" />

The key is the object's morph alias and the verb, `{objectType}.{verb}`. A
`*` for the object type matches any, which suits a verb that already names its
subject, as `order.placed` does. The template names roles, never models:

```php
'*.order.placed' => ':customer placed :order with :kitchen',   // ✗ not tokens: these render as text
'*.order.placed' => ':actor placed :object with :target',      // ✓
```

## Tokens

| Token | Substitutes |
|---|---|
| `:actor` | who acted |
| `:object` | what the activity acted on |
| `:target` | what the activity was directed at |
| `:context` | the surrounding container |
| `:origin` | the source |
| `:result` | the produced entity |
| `:instrument` | the tool or service used |

Each token becomes the label of the entity in that role, linked where the
entity has a link. A role the activity did not record renders as your
renderer's placeholder, so a template names only the roles the verb always
carries.

## Adding an Icon

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::icons([
    '*.order.placed' => 'shopping-bag',
    '*.order.completed' => 'receipt',
    '*.menu.dish_live' => 'chef-hat',
]);
```

<FeedStream :items="[scenes.order]" :grouped="false" />

The icon is a token; your renderer maps it onto an icon set it owns. Keys
resolve most-specific first: `order.order.placed`, then `order.*`, then
`*.order.placed`, then `*.*`.

## Translating a Headline

Templates are plain strings, so they translate:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    '*.order.placed' => __('feed.order_placed'),
]);
```

Tokens are substituted by the renderer, so word order stays the translator's
decision.
