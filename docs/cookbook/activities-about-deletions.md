# Activities about deletions

A removal story that still renders after the row it is about is gone.

```php
Storyfeed::activity()
    ->by($user)
    ->action('document.remove', $project)     // object: the parent, which survives
    ->data(['name' => $document->name])       // the removed thing travels as text
    ->publish();

$document->delete();
```

```php
Storyfeed::verbs([
    'document.remove' => ActivityType::Remove,
]);

Storyfeed::grammar([
    'project.document.remove' => ':actor removed a document from :object',
]);
```

<script setup>
import { who, where, doc, activity } from '../.vitepress/theme/samples'

const removed = activity({
  id: 'ck8', verb: 'document.remove', glyph: 'archive',
  published_at: '2026-08-14T17:05:00.000000Z',
  headline_template: ':actor removed a document from :object',
  actor: who.ines, object: where.passwordCrackdown,
  data: { name: doc.annualReportV3.label },
})
</script>

<FeedStream :items="[removed]" :grouped="false" />

The node's `data` carries the name for your renderer to show beneath the
headline.

## What a removal story may reference

For an Eloquent model using `Storyfeed\Concerns\InteractsWithFeed`, a
model-instance delete soft-deletes every activity it took part in, in any
role. A `forceDeleted` event hard-deletes them. The table assumes these
model events run.

| the removal story references | after the delete |
|---|---|
| the deleted model, in any role, published before the delete | deleted with the model's other activities |
| the deleted model, published after the delete | the snapshot renders; its link points at a record that is gone |
| the surviving parent as `object`, the name in `data` | renders and links |

Implementing `Feedable` alone installs no lifecycle hooks. A Feedable adapter
around a media or discussion row does not receive the underlying model’s
delete events automatically. Decide whether those activities should survive
and wire any cleanup explicitly.

Bulk query deletes, such as `Document::where(...)->delete()`, do not dispatch
individual model events and therefore do not run this cascade.

The lifecycle hooks are in
[Feedable models](/basics/feedable-models#keeping-snapshots-fresh).

## A soft delete is a delete

`$document->delete()` on a soft-deleting model using the trait fires the same
hook and soft-deletes the activities. Restoring the model does not restore them.
