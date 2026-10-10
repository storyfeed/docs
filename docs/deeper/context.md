# Containers & Context

## Introduction

The `context` role records where an activity happened, such as the shop a dish
belongs to. Use it to retrieve activities within that shop.

Containers can be nested beyond target and context: dish → menu → shop → mall.
Each model declares `parent()` so `involving($mall)` finds activity beneath it.
See [Distant Relations](/deeper/distant-relations).

<script setup>
import { activity, scene, role } from '../.vitepress/theme/world'
const inside = activity({ ...scene.question, context: role.shop,
  headline_template: ':actor asked about :target in :context' })
</script>

<a id="recording-context-at-publish"></a>

## Recording Context

Record the context when publishing. Storyfeed does not fill roles later, so a
context filter can only find activities recorded with that context.

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/MenuItemQuestionController.php"
<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class MenuItemQuestionController extends Controller
{
    public function store(Request $request, MenuItem $menuItem): RedirectResponse
    {
        $note = $menuItem->notes()->create([
            'user_id' => $request->user()->id,
            'body' => $request->validate(['body' => 'required|string'])['body'],
        ]);

        Storyfeed::activity()
            ->by($request->user())
            ->action('ask', $note)
            ->on($menuItem)              // target: what the question is about
            ->context($menuItem->shop)   // context: the shop the dish belongs to
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/MenuItemQuestionController.php"
<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class MenuItemQuestionController extends Controller
{
    public function store(Request $request, MenuItem $menuItem): RedirectResponse
    {
        $note = $menuItem->notes()->create([
            'user_id' => $request->user()->id,
            'body' => $request->validate(['body' => 'required|string'])['body'],
        ]);

        Storyfeed::record(
            verb: 'ask',
            object: $note,
            actor: $request->user(),
            target: $menuItem,           // what the question is about
            context: $menuItem->shop,    // the shop the dish belongs to
        );

        return back();
    }
}
```
:::

<FeedExample :items="[inside]" />

<a id="the-difference-between-target-and-context"></a>

<a id="target-and-context"></a>

## Choosing Between Target and Context

| Role | Holds | In the Sentence |
|---|---|---|
| `target` | what the action was directed at | asked about the dish |
| `context` | where it happened | in the shop |

Use `context` when the target belongs to a container, such as a dish in a shop.
Storyfeed never copies the target into `context`. If the target is the
container itself, the `target` role is enough, and `involving($shop)` already
finds the activity:

::: code-group
<<< @/snippets/publish-from-controller.php {php memo="app/Http/Controllers/OrderController.php"} [Fluent Syntax]
<<< @/snippets/publish-from-controller.named-arguments.php {php memo="app/Http/Controllers/OrderController.php"} [Named Arguments]
:::

<FeedExample :items="[scene.order]" />

Record every role that describes what happened, even if the headline omits it.
Storyfeed also uses roles for filtering and grouping.

For containers above the target or context, declare each model's
[parent](/deeper/distant-relations).

<a id="uses-of-context"></a>

Set the context when you need to filter by it or include it in a headline:

| Usage | Why It Needs `context` |
|---|---|
| `Storyfeed::feed()->context($shop)` | finds only activities recorded with that context |
| `:context` in a headline | displays the entity recorded in the context role |

<a id="the-container-query"></a>

<a id="reading-activities-in-a-container"></a>

## Retrieving Activities in a Container

The `context` method filters activities recorded within the shop:

```php memo="A controller, or wherever the feed is retrieved"
use Storyfeed\Facades\Storyfeed;

Storyfeed::feed()->context($shop)->get();
```

<FeedExample :items="[inside]" />

The [`involving` method](/basics/reading#scoping) also includes activities about
the shop itself, such as its creation, and activity beneath its
[declared parent hierarchy](/deeper/distant-relations).

<a id="non-model-containers"></a>

## Using Non-Model Containers

To use a name as the context, pass a string such as
`->context('Saturday service')`. Storyfeed creates a [party](/deeper/parties)
for the name. The `:context` token displays it, and
`Storyfeed::feed()->context('Saturday service')` retrieves its activities.

Each distinct name creates a separate party. To store a value without assigning
a role, use `->data(['service' => $name])`. It is returned in the activity's
`data` and cannot be used as a headline role token.

Use [Activity Scopes](/deeper/activity-scopes) to supply context across a
callback or HTTP request.
