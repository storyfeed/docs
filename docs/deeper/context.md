# Containers & Context

## Introduction

`context` records the container an activity happened **inside**,
such as the shop a dish belongs to. Record it, and you can read everything
that happened in that shop.

<script setup>
import { activity, scene, role } from '../.vitepress/theme/world'
const inside = activity({ ...scene.question, context: role.shop,
  headline_template: ':actor asked about :target in :context' })
</script>

<a id="recording-context-at-publish"></a>

## Recording Context

Roles are never filled in later. If you have the container when you publish,
record it: a `context` read only finds activities recorded with one.

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/DishQuestionController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\AskQuestionRequest;
use App\Models\Shop;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class DishQuestionController extends Controller
{
    public function store(
        AskQuestionRequest $request,
        Shop $shop,
        MenuItem $dish,
    ): RedirectResponse {
        $note = $dish->notes()->create($request->validated());

        Storyfeed::activity()
            ->by($request->user())
            ->action('ask', $note)
            ->on($dish)               // target: what the question is about
            ->context($shop)       // context: the shop the dish belongs to
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/DishQuestionController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\AskQuestionRequest;
use App\Models\Shop;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class DishQuestionController extends Controller
{
    public function store(
        AskQuestionRequest $request,
        Shop $shop,
        MenuItem $dish,
    ): RedirectResponse {
        $note = $dish->notes()->create($request->validated());

        Storyfeed::record(
            verb: 'ask',
            object: $note,
            actor: $request->user(),
            target: $dish,            // what the question is about
            context: $shop,        // the shop the dish belongs to
        );

        return back();
    }
}
```
:::

<FeedExample :items="[inside]" />

<a id="the-difference-between-target-and-context"></a>

## Target and Context

| Role | Holds | In the Sentence |
|---|---|---|
| `target` | what the preposition points at | asked **about** the dish |
| `context` | the container the act happened inside | …**in** the shop |

Use `context` when the target sits inside a container, like a dish in a
shop. When the target is the container itself, `target` is enough:

::: code-group
<<< @/snippets/publish-from-controller.php {php memo="app/Http/Controllers/OrderController.php"} [Fluent Syntax]
<<< @/snippets/publish-from-controller.named-arguments.php {php memo="app/Http/Controllers/OrderController.php"} [Named Arguments]
:::

<FeedExample :items="[scene.order]" />

Fill every role that is true, even one the headline doesn't name: roles are
also used for scoping and grouping.

<a id="uses-of-context"></a>

Set `context` when something reads it:

| You Want | Why It Needs `context` |
|---|---|
| `Storyfeed::feed()->context($shop)` | the read finds only activities recorded with a context |
| `:context` in a headline | a headline can only name a role the activity carries |

<a id="the-container-query"></a>

## Reading Activities in a Container

`Storyfeed::feed()->context($shop)` returns what happened inside the shop.
[`involving()`](/basics/reading#scoping) also returns activities about the
shop itself, such as its creation.

<a id="non-model-containers"></a>

## Using Non-Model Containers

When the container is a plain value, such as a service name, pass the string:
`->context('Saturday service')`. It becomes a [party](/deeper/parties), so
`:context` names it in the headline, and
`Storyfeed::feed()->context('Saturday service')` reads what happened in it.

Each distinct string is its own party. For a value that should not become a
role, use `->data(['service' => $name])`: it arrives in the activity's `data`,
and headlines cannot name it.

[Activity Scopes](/deeper/activity-scopes) supplies context across a callback
or an HTTP request.
