# Containers & Context

`context` is the fourth role: the container an activity happened **inside**,
such as the kitchen a dish belongs to. Record it, and you can read the feed for
everything that happened inside that container.

<script setup>
import { who, where, dishes, notes, activity } from '../.vitepress/theme/samples'

const inside = activity({
  id: 'cx1', verb: 'ask', glyph: 'message-circle',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor asked about :target in :context',
  actor: who.customer4, object: notes.spice, target: dishes.chickenCurry,
  context: where.kitchen,
})
</script>

::: code-group
```php [Fluent Syntax]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\AskQuestionRequest;
use App\Models\Kitchen;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class DishQuestionController extends Controller
{
    public function store(AskQuestionRequest $request, Kitchen $kitchen, MenuItem $dish): RedirectResponse
    {
        $note = $dish->notes()->create($request->validated());

        Storyfeed::activity() // [!code focus]
            ->by($request->user()) // [!code focus]
            ->action('ask', $note) // [!code focus]
            ->on($dish)               // target: what the question is about // [!code focus]
            ->context($kitchen)       // context: the kitchen the dish belongs to // [!code focus]
            ->publish(); // [!code focus]

        return back();
    }
}
```

```php [Named Arguments]
<?php

namespace App\Http\Controllers;

use App\Http\Requests\AskQuestionRequest;
use App\Models\Kitchen;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class DishQuestionController extends Controller
{
    public function store(AskQuestionRequest $request, Kitchen $kitchen, MenuItem $dish): RedirectResponse
    {
        $note = $dish->notes()->create($request->validated());

        Storyfeed::record( // [!code focus]
            verb: 'ask', // [!code focus]
            object: $note, // [!code focus]
            actor: $request->user(), // [!code focus]
            target: $dish,            // what the question is about // [!code focus]
            context: $kitchen,        // the kitchen the dish belongs to // [!code focus]
        ); // [!code focus]

        return back();
    }
}
```
:::

<FeedExample context :items="[inside]" />

## The Difference Between Target and Context

| Role | Holds | In the Sentence |
|---|---|---|
| `target` | what the preposition points at | asked **about** the dish |
| `context` | the container the act happened inside | …**in** the kitchen |

`context` is for a target that sits inside a container: a question about a
dish in a kitchen, a note on an order at a table. When the target is itself the
container, `target` alone carries it:

::: code-group
<<< @/snippets/publish-from-controller.php [Fluent Syntax]
<<< @/snippets/publish-from-controller.named-arguments.php [Named Arguments]
:::

Setting `context` to the same kitchen as well is allowed; it records the
kitchen in both roles. A role the headline doesn't name is still used for
scoping, grouping and the AS2 document, so fill every role that is true.

## When to Set It

An activity needs `context` when something reads it:

| You Want | Why It Needs `context` |
|---|---|
| a group like "three customers asked about dishes in the same kitchen today" | grouping reads roles, so the container has to *be* a role |
| `feed()->context($kitchen)` | the scope reads the `context` column |
| `:context` in a headline | a headline can only name a role the activity carries |
| `context` on the Activity Streams 2.0 document | the serializer emits each role that is filled, and omits each that is not |

## The Container Query

`feed()->context($kitchen)` returns what happened inside the kitchen. It is
narrower than [`involving()`](/basics/reading#scoping), which also matches
activities where the kitchen is the `object`, such as its creation.

## A Container That Is Not a Model

When the container is a plain value, such as a folder name, a source system
or a mailbox, record it one of three ways:

| Home | In the Headline | Groups by It | In the AS2 Document | Cost |
|---|---|---|---|---|
| `->context('Saturday service')` | yes, as `:context` | yes | yes, as a [party](/deeper/parties) | one party per distinct string |
| `->data(['folder' => $name])` | no — templates read roles, not `data` | no | no | the value arrives in the node for your renderer to show beneath |
| a closure in the grammar | yes, pre-rendered | no | no | `headline_template` is null; the renderer gets a string it cannot tokenize or link |

## Recording Context at Publish

Roles are set when the activity is published and never backfilled. If the
container is a model you have at publish time, record it: anything that reads
`context` later only sees the activities recorded with one.
