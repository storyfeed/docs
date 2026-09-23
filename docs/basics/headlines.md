# Headlines

A headline is the sentence the feed prints for an activity. You register a
template once per verb in the **grammar** registry, and the feed fills in the
entities.

<script setup>
import { activity, scenes } from '../.vitepress/theme/samples'

const withoutIcon = activity({ ...scenes.order, id: 'hl1', glyph: null })
</script>

## Registering a Headline

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    'order.place' => ':actor placed :object with :target',
]);
```

<FeedExample context :items="[withoutIcon]" />

The key is the object's morph alias, a dot, and the verb: `order.place` is the
verb `place`, recorded about an `order`. The verb you record is still `place`.

The template names roles, never models:

```php
'order.place' => ':customer placed :order with :kitchen',   // ✗ not tokens: these render as text
'order.place' => ':actor placed :object with :target',      // ✓
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

Each token becomes the label of the entity in that role, linked where it has a
link. A role the activity did not record renders as your renderer's
placeholder, so a template names only the roles the verb always carries.

## Adding an Icon

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::icons([
    'order.place' => 'shopping-bag',
    'order.complete' => 'receipt',
    '*.publish' => 'chef-hat',          // any object type
]);
```

<FeedExample :items="[scenes.order]" />

Keys resolve most-specific first:

| Key | Matches |
|---|---|
| `order.place` | that verb on that object type |
| `order.*` | every verb on that object type |
| `*.place` | that verb on any object type |
| `*.*` | everything with no more specific entry |

::: headless icons
:::

## What a Glyph Means

A glyph names a shape. `glyph_intent` says what the shape means, and sits
beside it on every node:

```json
{
  "verb": "complete",
  "glyph": "receipt",
  "glyph_intent": "success"
}
```

Intents have their own registry, keyed and resolved like icons:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::glyphIntents([
    'order.complete' => 'success',   // the app's own word, not the package's
    'order.place'    => 'pending',
    'order.cancel' => 'danger',
]);
```

Or on a story class:

```php
// app/Stories/OrderWasCompleted.php
public function intent(): ?string
{
    return 'success';
}
```

The value is **your** string. Storyfeed ships no intents and no colours, and
validates nothing: `success`, `pending` and `danger` are this example's words,
and the renderer maps them onto colours it owns.

Most verbs have no intent. Their `glyph_intent` is `null`, and the glyph
renders plain. Any string passes through unchanged; a renderer with no colour
for it draws the plain glyph.

## Translating a Headline

Templates are plain strings, so they translate:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    'order.place' => __('feed.order_placed'),
]);
```

Tokens are substituted by the renderer, so word order stays the translator's
decision.
