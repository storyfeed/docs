# Recording Deletions

To record a deletion, record it about the model you delete, with a verb that
says it was removed. The activity stays after the delete. In place of the
model it names a tombstone: the reference a deleted model leaves behind, with
its former type and when it was deleted.

## Recording a Deletion

::: code-group
```php [Fluent Syntax]
Storyfeed::activity()
    ->by($request->user())
    ->action('remove', $product)
    ->to($menu)
    ->publish();

$product->delete(); // [!code highlight]
```

```php [Named Arguments]
Storyfeed::record(
    verb: 'remove',
    object: $product,
    target: $menu,
    actor: $request->user(),
);

$product->delete(); // [!code highlight]
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

Every other activity that named the menu item stays too, with the tombstone in
its place. [Deleted Models](/deeper/deleted-models) covers what each of them
says.

| To | Use |
|---|---|
| keep naming the deleted model in old activities | [`keepLabel()`](/deeper/deleted-models#keeping-labels) on its tombstone |
| remove only the activities the deletion made redundant | [`forgetWhenMissing()`](/deeper/deleted-models#forgetting-redundant-activities) on those verbs |
| remove every activity involving the model, such as for a customer asking to be forgotten | [`deleteFromFeed()` or `forceDeleteFromFeed()`](/deeper/deleted-models#removing-activities-explicitly), before the delete |
