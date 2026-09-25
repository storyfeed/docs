# Containers & Context

## Introduction

`context` records the container an activity happened **inside**,
such as the kitchen a dish belongs to. Record it, and you can read everything
that happened in that kitchen.

[Activity Scopes](/deeper/activity-scopes) supplies context across a callback or an HTTP request.

<script setup>
import { who, where, dishes, notes, activity, scenes } from '../.vitepress/theme/samples'

const inside = activity({
  id: 'cx1', verb: 'ask', glyph: 'message-circle',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor asked about :target in :context',
  actor: who.customer4, object: notes.spice, target: dishes.chickenCurry,
  context: where.kitchen,
})
</script>

<a id="recording-context-at-publish"></a>

## Recording Context

Roles are never filled in later. If you have the container when you publish,
record it: a `context` read only finds activities recorded with one.

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
    public function store(
        AskQuestionRequest $request,
        Kitchen $kitchen,
        MenuItem $dish,
    ): RedirectResponse {
        $note = $dish->notes()->create($request->validated());

        Storyfeed::activity()
            ->by($request->user())
            ->action('ask', $note)
            ->on($dish)               // target: what the question is about
            ->context($kitchen)       // context: the kitchen the dish belongs to
            ->publish();

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
    public function store(
        AskQuestionRequest $request,
        Kitchen $kitchen,
        MenuItem $dish,
    ): RedirectResponse {
        $note = $dish->notes()->create($request->validated());

        Storyfeed::record(
            verb: 'ask',
            object: $note,
            actor: $request->user(),
            target: $dish,            // what the question is about
            context: $kitchen,        // the kitchen the dish belongs to
        );

        return back();
    }
}
```
:::

<FeedExample context :items="[inside]" />

<a id="the-difference-between-target-and-context"></a>

## Target and Context

| Role | Holds | In the Sentence |
|---|---|---|
| `target` | what the preposition points at | asked **about** the dish |
| `context` | the container the act happened inside | …**in** the kitchen |

Use `context` when the target sits inside a container, like a dish in a
kitchen. When the target is the container itself, `target` is enough:

::: code-group
<<< @/snippets/publish-from-controller.php [Fluent Syntax]
<<< @/snippets/publish-from-controller.named-arguments.php [Named Arguments]
:::

<FeedExample :items="[scenes.order]" />

Fill every role that is true, even one the headline doesn't name: roles are
also used for scoping and grouping.

<a id="uses-of-context"></a>

Set `context` when something reads it:

| You Want | Why It Needs `context` |
|---|---|
| a group like "three customers asked about dishes in the same kitchen today" | grouping reads roles, so the container has to *be* a role |
| `feed()->context($kitchen)` | the scope reads the `context` column |
| `:context` in a headline | a headline can only name a role the activity carries |
| `context` on the Activity Streams 2.0 document | the serializer emits each role that is filled, and omits each that is not |

<a id="the-container-query"></a>

## Reading Activities in a Container

`feed()->context($kitchen)` returns what happened inside the kitchen.
[`involving()`](/basics/reading#scoping) also returns activities about the
kitchen itself, such as its creation.

<a id="non-model-containers"></a>

## Using Non-Model Containers

When the container is a plain value, such as a folder name, record it one of
three ways:

| Home | In the Headline | Groups by It | In the AS2 Document | Cost |
|---|---|---|---|---|
| `->context('Saturday service')` | yes, as `:context` | yes | yes, as a [party](/deeper/parties) | one party per distinct string |
| `->data(['folder' => $name])` | no — templates read roles, not `data` | no | no | the value arrives in the node for your renderer to show beneath |
| a closure in the grammar | yes, pre-rendered | no | no | `headline_template` is null; the renderer gets a string it cannot tokenize or link |
