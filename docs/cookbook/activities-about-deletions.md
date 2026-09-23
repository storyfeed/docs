# Recording Deletions

To record that something was deleted, make the surviving parent the object
and carry the deleted thing's name in `data`. The row keeps rendering after the
deleted model is gone.

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
        Storyfeed::activity() // [!code focus]
            ->by($request->user()) // [!code focus]
            ->action('remove', $menu)             // object: the parent, which survives [!code focus]
            ->data(['name' => $dish->name])       // the removed thing travels as text [!code focus]
            ->publish(); // [!code focus]

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
        Storyfeed::record( // [!code focus]
            verb: 'remove', // [!code focus]
            object: $menu,                        // the parent, which survives [!code focus]
            actor: $request->user(), // [!code focus]
            data: ['name' => $dish->name],        // the removed thing travels as text [!code focus]
        ); // [!code focus]

        $dish->delete();

        return back();
    }
}
```
:::

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::verbs([
    'remove' => ActivityType::Remove,
]);

Storyfeed::grammar([
    'menu.remove' => ':actor removed a dish from :object',
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

Your renderer shows the name from the node's `data`.

## What a Removal Story May Reference

A model using `Storyfeed\Concerns\InteractsWithFeed` soft-deletes every
activity it took part in, in any role, when it is deleted. A force delete
hard-deletes them.

| The Removal Story References | After the Delete |
|---|---|
| the deleted model, in any role, published before the delete | deleted with the model's other activities |
| the deleted model, published after the delete | the snapshot renders; its link points at a record that is gone |
| the surviving parent as `object`, the name in `data` | renders and links |

The cascade runs on model events, so it does not run for:

- a model that implements `Feedable` without the trait
- a bulk query delete, such as `MenuItem::where(...)->delete()`

Wire that cleanup yourself. The hooks are in
[Feedable API](/reference/feedable#snapshot-maintenance).

## A Soft Delete Is a Delete

Soft-deleting a model with the trait soft-deletes its activities too.
Restoring the model does not restore them.
