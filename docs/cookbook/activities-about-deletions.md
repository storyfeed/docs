# Recording Deletions

Publish a removal activity before deleting its model. The activity remains,
with a tombstone in place of the model. The tombstone records the model's
former type and deletion time.

## Recording a Deletion

::: code-group
```php [Fluent Syntax]
Storyfeed::activity()
    ->by($request->user())
    ->action('remove', $product)
    ->to($menu)
    ->publish();

$product->delete();
```

```php [Named Arguments]
Storyfeed::record(
    verb: 'remove',
    object: $product,
    target: $menu,
    actor: $request->user(),
);

$product->delete();
```
:::

```php memo="routes/feed.php"
use App\Models\MenuItem;
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Story;

Story::for(MenuItem::class)
    ->verb('remove')
    ->headline(':actor removed :object from :target')
    ->type(ActivityType::Remove); // a removal verb keeps its headline after the delete
```

<script setup>
import { scene } from '../.vitepress/theme/world'
import { activity, tombstone } from '../.vitepress/theme/samples'

const source = scene.cookbook.deletion
const removed = activity({ ...source,
  object: tombstone(source.object.type, source.object.id, source.published_at),
})
</script>

<FeedExample :items="[removed]" />

## Choosing What Stays

Other activities involving the menu item also remain with its tombstone.
See [Deleted Models](/deeper/deleted-models) for their headlines and payloads.

| To | Use |
|---|---|
| keep the deleted model's label in earlier activities | [`keepLabel()`](/deeper/deleted-models#keeping-labels) on its tombstone |
| remove activities made redundant by permanent deletion | [`forgetWhenMissing()`](/deeper/deleted-models#forgetting-redundant-activities) on those verbs |
| remove all activities involving a model, such as when a customer asks to be forgotten | [`deleteFromFeed()` or `forceDeleteFromFeed()`](/deeper/deleted-models#removing-activities-explicitly) before deleting the model |
