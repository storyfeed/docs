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
import { scene, role } from '../.vitepress/theme/world'
import { activity, tombstone } from '../.vitepress/theme/samples'

// Two renderings of the same deletion: discard or preserve the snapshot label.
const source = scene.cookbook.deletion
const removed = activity({ ...source,
  object: tombstone(source.object.type, source.object.id, source.published_at),
})
const removedKeepingLabel = activity({ ...source,
  object: tombstone(source.object.type, source.object.id, source.published_at, { label: role.product.label }),
})
</script>

<FeedExample :items="[removed]" />

## Preserving a Deleted Model's Label

The menu item is a tombstone once it is deleted. To keep naming it, the model keeps
its label on its tombstone:

```php memo="app/Models/MenuItem.php" at="describeFeed()"
$this->feedEntity()
    ->label("{$this->code} {$this->name}")
    ->tombstone(fn ($tombstone) => $tombstone->keepLabel());
```

<FeedExample :items="[removedKeepingLabel]" />

<span id="references-after-deletion"></span>

## Referencing Surviving Models

| The Removal Story References | After the Delete |
|---|---|
| the deleted model, in any role | names its tombstone; its label only with `keepLabel()` |
| a surviving parent, such as the menu | renders and links |

Every other activity that named the menu item stays too. [Deleted Models](/deeper/deleted-models)
covers what each of them says.

## Removing Activities

### Removing All Involving Activities

Deleting a model keeps its activities unless a verb declares `forgetWhenMissing()`. When they must go, such as a
customer asking to be forgotten, remove them before the model:

```php memo="app/Http/Controllers/AccountController.php" at="destroy()"
$user->forceDeleteFromFeed();   // every activity involving the user, permanently
$user->forceDelete();
```

| Method | Removes |
|---|---|
| `deleteFromFeed()` | soft-deletes every activity involving the model |
| `forceDeleteFromFeed()` | permanently deletes every activity involving the model, soft-deleted ones included |

A model registered with `Storyfeed::feedable()` has no such methods. Call the
actions they use:

```php memo="Where the model is deleted: a controller, an action, a job"
use Storyfeed\Actions\DeleteFromFeed;
use Storyfeed\Actions\ForceDeleteFromFeed;

(new DeleteFromFeed)($photo);        // soft
(new ForceDeleteFromFeed)($photo);   // permanent
```

### Forgetting Redundant Activities

To forget only the activities a deletion made redundant, and keep the rest,
declare [`forgetWhenMissing()`](/deeper/deleted-models#forgetting-activities)
on the verbs that should go.
