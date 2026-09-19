# Recording Deletions

A removal story that still renders after the row it is about is gone.

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($user)
    ->action('remove', $menu)      // object: the parent, which survives
    ->data(['name' => $dish->name])           // the removed thing travels as text
    ->publish();

$dish->delete();
```

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::verbs([
    'remove' => ActivityType::Remove,
]);

Storyfeed::grammar([
    '*.menu.dish_removed' => ':actor removed a dish from :object',
]);
```

<script setup>
import { who, where, dishes, activity } from '../.vitepress/theme/samples'

const removed = activity({
  id: 'ck8', verb: 'remove', glyph: 'circle-x',
  published_at: '2026-08-14T17:05:00.000000Z',
  headline_template: ':actor removed a dish from :object',
  actor: who.cook, object: where.menu,
  data: { name: dishes.cutlets.label },
})
</script>

<FeedExample context :items="[removed]" />

The node's `data` carries the name for your renderer to show beneath the
headline.

## What a Removal Story May Reference

For an Eloquent model using `Storyfeed\Concerns\InteractsWithFeed`, a
model-instance delete soft-deletes every activity it took part in, in any
role. A `forceDeleted` event hard-deletes them. The table assumes these
model events run.

| The Removal Story References | After the Delete |
|---|---|
| the deleted model, in any role, published before the delete | deleted with the model's other activities |
| the deleted model, published after the delete | the snapshot renders; its link points at a record that is gone |
| the surviving parent as `object`, the name in `data` | renders and links |

Implementing `Feedable` alone installs no lifecycle hooks. A Feedable adapter
around a media or discussion row does not receive the underlying model’s
delete events automatically. Decide whether those activities should survive
and wire any cleanup explicitly.

Bulk query deletes, such as `MenuItem::where(...)->delete()`, do not dispatch
individual model events and therefore do not run this cascade.

The lifecycle hooks are in
[Feedable API](/reference/feedable#snapshot-maintenance).

## A Soft Delete Is a Delete

`$dish->delete()` on a soft-deleting model using the trait fires the same
hook and soft-deletes the activities. Restoring the model does not restore them.
