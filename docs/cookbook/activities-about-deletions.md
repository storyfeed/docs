# Recording Deletions

To record a deletion, record it about the model you delete, with a verb that
says it was removed. The activity stays after the delete, naming the model's
tombstone.

## Recording a Deletion

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/MenuDishController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class MenuDishController extends Controller
{
    public function destroy(
        Request $request,
        Menu $menu,
        MenuItem $product,
    ): RedirectResponse {
        Storyfeed::activity()
            ->by($request->user())
            ->action('remove', $product)
            ->to($menu)
            ->publish();

        $product->delete();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/MenuDishController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class MenuDishController extends Controller
{
    public function destroy(
        Request $request,
        Menu $menu,
        MenuItem $product,
    ): RedirectResponse {
        Storyfeed::record(
            verb: 'remove',
            object: $product,
            target: $menu,
            actor: $request->user(),
        );

        $product->delete();

        return back();
    }
}
```
:::

```php memo="routes/feed.php"
use App\Models\MenuItem;
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Story;

Story::for(MenuItem::class)
    ->verb('remove')
    ->headline(':actor removed :object from :target')
    ->type(ActivityType::Remove); // a removal: the menu item being gone is expected
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
