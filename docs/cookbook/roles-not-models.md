# The sentence names roles, never models

A headline that renders for every model that fills a slot, and that stays
correct when a model is renamed.

```php
Storyfeed::grammar([
    'document.upload' => ':actor uploaded :object to :target',
]);
```

<script setup>
import { who, where, doc, activity } from '../.vitepress/theme/samples'

const uploaded = activity({
  id: 'ck1', verb: 'upload', icon: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :object to :target',
  actor: who.ines, object: doc.annualReportV3, target: where.passwordCrackdown,
})
</script>

<FeedStream :items="[uploaded]" :grouped="false" />

## Where the model name goes

The key names the type. The template names the role.

| | names | example |
|---|---|---|
| the key | the object's type and the verb | `'document.upload'` |
| the template | the slot in the sentence | `:actor`, `:object`, `:target`, `:context` |

```php
'document.upload' => ':user uploaded :document to :project',   // ✗ :user is not a token and renders as text
'document.upload' => ':actor uploaded :object to :target',     // ✓
```

## Each token is a part of the sentence

| token | is the sentence's | filled by |
|---|---|---|
| `:actor` | subject | whoever did it |
| `:object` | direct object | what it was done to |
| `:target` | noun after the preposition | what it was aimed at |
| `:context` | place | where it happened |

The full token table, including the plural tokens a group uses, is in
[Rendering](/basics/rendering#headline-templates).

## The same sentence in a Story

```php
public function headline(): string
{
    return ':actor uploaded :object to :target';
}
```

The type moves to `$objectType`; the template does not change. See
[Story classes](/basics/stories).
