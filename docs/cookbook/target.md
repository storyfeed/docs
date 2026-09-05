# The target takes the preposition

A target that is the noun after the verb's preposition, and a context recorded
alongside it when the sentence also has a place.

```php
Storyfeed::activity()
    ->by($user)
    ->action('upload', $document)
    ->to($project)
    ->publish();
```

<script setup>
import { who, where, doc, note, firm, activity } from '../.vitepress/theme/samples'

const uploaded = activity({
  id: 'ck4', verb: 'upload', icon: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :object to :target',
  actor: who.ines, object: doc.annualReportV3, target: where.passwordCrackdown,
})
</script>

<FeedStream :items="[uploaded]" :grouped="false" />

## Read the sentence to find the target

| sentence | `object` | `target` | recorded as |
|---|---|---|---|
| uploaded a document **to** a project | the document | the project | `->action('upload', $document)->to($project)` |
| commented **on** a document | the comment | the document | `->action('comment', $comment)->on($document)` |
| created a project **for** a client | the project | the client | `->action('create', $project)->for($client)` |
| moved a document **into** a folder | the document | the folder | `->action('move', $document)->into($folder)` |
| archived a document | the document | none | `->action('archive', $document)` |

Every alias in the last column sets `target`. The stored row is the same
whichever preposition the sentence takes; the list is in
[Recording](/basics/recording#roles).

A sentence with no preposition has no target.

## When the target is also the place

An upload is aimed at the project and happens inside it. Record both:

```php
Storyfeed::activity()
    ->by($user)
    ->action('upload', $document)
    ->to($project)              // target: what the act was aimed at
    ->context($project)         // context: where it happened
    ->publish();
```

A comment on a document has the document as target and the project as
context. The difference between the two roles, and what recording context
buys, is in [Containers & context](/deeper/context#target-or-context).
