# Headlines

A headline is the sentence the feed prints for an activity. It is a template,
registered once per verb, and the feed fills in the entities. When you are
done, every verb your app records reads as a sentence.

<script setup>
import { who, where, doc, activity, scenes } from '../.vitepress/theme/samples'

const withoutIcon = activity({ ...scenes.upload, id: 'hl1', glyph: null })
</script>

## Registering a Headline

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    'document.upload' => ':actor uploaded :object to :target',
]);
```

<FeedStream :items="[withoutIcon]" :grouped="false" />

The key is the object's morph alias and the verb, `{objectType}.{verb}`. The
template names roles, never models: your model names belong in the key.

```php
'document.upload' => ':user uploaded :document to :project',   // ✗ not tokens: these render as text
'document.upload' => ':actor uploaded :object to :target',     // ✓
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
    'document.upload' => 'file-up',
    '*.comment' => 'message-circle',   // any object type
]);
```

<FeedStream :items="[scenes.upload]" :grouped="false" />

The icon is a token; your renderer maps it onto an icon set it owns. Keys
resolve most-specific first: `document.upload`, then `document.*`, then
`*.upload`, then `*.*`.

## Translating a Headline

Templates are plain strings, so they translate:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    'document.upload' => __('feed.document_uploaded'),
]);
```

Tokens are substituted by the renderer, so word order stays the translator's
decision.
