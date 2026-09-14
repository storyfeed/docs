# Headlines

A headline is the sentence the feed prints for an activity. It is a template,
registered once per verb in the **grammar** registry, and the feed fills in
the entities. When you are done, every verb your app records reads as a
sentence.

<script setup>
import { activity, scenes } from '../.vitepress/theme/samples'

const withoutIcon = activity({ ...scenes.order, id: 'hl1', glyph: null })
</script>

## Registering a Headline

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    'order.placed' => ':actor placed :object with :target',
]);
```

<FeedExample :items="[withoutIcon]" />

Read the key as two parts: the object's morph alias, a dot, and the verb.
`order.placed` is the verb `placed`, recorded about an `order`. The dot
belongs to the key; the verb you recorded is still `placed`.

The template names roles, never models:

```php
'order.placed' => ':customer placed :order with :kitchen',   // ✗ not tokens: these render as text
'order.placed' => ':actor placed :object with :target',      // ✓
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
    'order.placed' => 'shopping-bag',
    'order.completed' => 'receipt',
    '*.menu.dish_live' => 'chef-hat',   // any object type
]);
```

<FeedExample :items="[scenes.order]" />

Keys resolve most-specific first: `order.placed`, then `order.*`, then
`*.placed`, then `*.*`.

::: headless it ships no icons
`shopping-bag` is a name you chose, carried to your renderer verbatim. Mapping
it to a drawing is the renderer's job, with whichever icon set it already has.
The package validates nothing here and has no list to validate against.
:::

## What a Glyph Means

A glyph names a shape. `glyph_intent` says what that shape means, and rides
beside it on every node:

```json
{
  "verb": "completed",
  "glyph": "receipt",
  "glyph_intent": "success"
}
```

A renderer that draws the glyph small can tell the verbs apart by shape alone.
One that draws it large, or a feed whose verbs cluster, needs more than a
shape.

Register intents the way you register icons — keyed `type.verb`, wildcards
allowed, resolved most-specific first:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::glyphIntents([
    'order.completed' => 'success',   // the app's own word, not the package's
    'order.placed'    => 'pending',
    'order.cancelled' => 'danger',
]);
```

Or on a story class:

```php
// app/Stories/DocumentWasUploaded.php
public function intent(): ?string
{
    return 'success';
}
```

The value is **your** string. Storyfeed ships no vocabulary of intents and no
colours: `success` is not a term the package knows, ranks or validates, exactly
as `circle-check` is not an icon it ships. The three words above are this
documentation's own, and the renderer maps them onto three colours it owns —
`success`, `pending` and `danger` are what these examples chose to say, not a
list to conform to.

Intents resolve on their own registry, so a wildcard is stated once:

| Key | Matches |
|---|---|
| `order.completed` | that verb on that object type |
| `order.*` | every verb on that object type |
| `*.completed` | that verb on any object type |
| `*.*` | everything with no more specific entry |

Most verbs have no intent, and that is the common case. A placed order is not yet a
success or a failure, so `glyph_intent` is `null` and the disc renders plain —
which is what every node carries until an app registers its first intent.

A renderer that meets an intent it has no colour for draws the plain glyph.
Unknown strings pass through, never dropped, so an app can add a word without
waiting for a renderer to learn it.

## Translating a Headline

Templates are plain strings, so they translate:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    'order.placed' => __('feed.order_placed'),
]);
```

Tokens are substituted by the renderer, so word order stays the translator's
decision.
