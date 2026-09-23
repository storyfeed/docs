# Recording Deletions

To record a deletion, record it about the model you delete, with a verb that
says it was removed. The activity stays after the delete, naming the model's
tombstone.

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class MenuDishController extends Controller
{
    public function destroy(Request $request, Menu $menu, MenuItem $dish): RedirectResponse
    {
        Storyfeed::activity()
            ->by($request->user())
            ->action('remove', $dish)
            ->to($menu)
            ->publish();

        $dish->delete();

        return back();
    }
}
```

```php [Named Arguments]
<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class MenuDishController extends Controller
{
    public function destroy(Request $request, Menu $menu, MenuItem $dish): RedirectResponse
    {
        Storyfeed::record(
            verb: 'remove',
            object: $dish,
            target: $menu,
            actor: $request->user(),
        );

        $dish->delete();

        return back();
    }
}
```
:::

::: code-group
```php [Fluent Syntax]
// routes/feed.php
use App\Models\MenuItem;
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Story;

Story::for(MenuItem::class)
    ->verb('remove')
    ->headline(':actor removed :object from :target')
    ->type(ActivityType::Remove); // a removal: the dish being gone is expected
```

```php [Array]
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Storyfeed;

Storyfeed::verbs([
    'remove' => ActivityType::Remove,   // a removal: the dish being gone is expected
]);

Storyfeed::grammar([
    'menu_item.remove' => ':actor removed :object from :target',
]);
```
:::

<script setup>
import { who, where, dishes, activity, tombstone } from '../.vitepress/theme/samples'

const deleted = '2026-08-14T17:05:00.000000Z'

const removed = activity({
  id: 'ck8', verb: 'remove', glyph: 'circle-x',
  published_at: deleted,
  headline_template: ':actor removed :object from :target',
  actor: who.cook, target: where.menu,
  object: tombstone('menu_item', '31', deleted),
})

const removedKeepingLabel = activity({
  ...removed, id: 'ck9',
  object: tombstone('menu_item', '31', deleted, { label: dishes.cutlets.label }),
})
</script>

<FeedExample context :items="[removed]" />

The dish is a tombstone once it is deleted. To keep naming it, the model keeps
its label on its tombstone:

```php
// app/Models/MenuItem.php, describeFeed()
$this->feedEntity()
    ->label("{$this->code} {$this->name}")
    ->tombstone(fn ($tombstone) => $tombstone->keepLabel());
```

<FeedExample :items="[removedKeepingLabel]" />

## What a Removal Story May Reference

| The Removal Story References | After the Delete |
|---|---|
| the deleted model, in any role | names its tombstone; its label only with `keepLabel()` |
| a surviving parent, such as the menu | renders and links |

Every other activity that named the dish stays too. [Deleted Models](/deeper/deleted-models)
covers what each of them says.

## When the Activities Must Go

Deleting a model never deletes its activities. When they must go, such as a
customer asking to be forgotten, remove them before the model:

```php
// app/Http/Controllers/AccountController.php, destroy()
$user->forceDeleteFromFeed();   // every activity involving the user, permanently
$user->forceDelete();
```

| Method | Removes |
|---|---|
| `deleteFromFeed()` | soft-deletes every activity involving the model |
| `forceDeleteFromFeed()` | permanently deletes every activity involving the model, soft-deleted ones included |

A model registered with `Storyfeed::feedable()` has no such methods. Call the
actions they use:

```php
// where the model is deleted: a controller, an action, a job
use Storyfeed\Actions\DeleteFromFeed;
use Storyfeed\Actions\ForceDeleteFromFeed;

(new DeleteFromFeed)($photo);        // soft
(new ForceDeleteFromFeed)($photo);   // permanent
```

To forget only the activities a deletion made redundant, and keep the rest,
declare [`forgetWhenMissing()`](/deeper/deleted-models#forgetting-activities)
on the verbs that should go.
