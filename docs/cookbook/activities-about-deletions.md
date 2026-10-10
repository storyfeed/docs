# Recording Deletions

<script setup>
import { scene } from '../.vitepress/theme/world'
import { activity, tombstone } from '../.vitepress/theme/samples'

const source = scene.cookbook.deletion
const deleted = activity({ ...source, verb: 'delete',
  headline_template: ':actor deleted :object from :target',
  object: tombstone(source.object.type, source.object.id, source.published_at),
})
</script>

Publish a `delete` activity before deleting its model. The activity remains,
with a tombstone in place of the model. The tombstone records the model's
former type and deletion time.

## Recording a Deletion

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/MenuItemController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class MenuItemController
{
    public function destroy(Request $request, Menu $menu, MenuItem $menuItem): RedirectResponse
    {
        Storyfeed::activity()
            ->by($request->user())
            ->action('delete', $menuItem)
            ->to($menu)
            ->publish();

        $menuItem->delete();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/MenuItemController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class MenuItemController
{
    public function destroy(Request $request, Menu $menu, MenuItem $menuItem): RedirectResponse
    {
        Storyfeed::record(
            verb: 'delete',
            object: $menuItem,
            actor: $request->user(),
            target: $menu,
        );

        $menuItem->delete();

        return back();
    }
}
```
:::

```php memo="routes/feed.php"
use App\Models\MenuItem;
use Storyfeed\Facades\Story;

Story::for(MenuItem::class)
    ->verb('delete')
    ->headline(':actor deleted :object from :target');
```

<FeedExample :items="[deleted]" />

`delete` is a [removal verb](/deeper/deleted-models#removal-verbs), so the
tombstone does not make its activity redundant.

## Choosing What Stays

Other activities involving the menu item also remain with its tombstone.
See [Deleted Models](/deeper/deleted-models) for their headlines and payloads.

| To | Use |
|---|---|
| keep the deleted model's label in earlier activities | [`keepLabel()`](/deeper/deleted-models#keeping-labels) on its tombstone |
| remove activities made redundant by permanent deletion | [`forgetWhenMissing()`](/deeper/deleted-models#forgetting-redundant-activities) on those verbs |
| remove all activities involving a model, such as when a customer asks to be forgotten | [`deleteFromFeed()` or `forceDeleteFromFeed()`](/deeper/deleted-models#removing-activities-explicitly) before deleting the model |
