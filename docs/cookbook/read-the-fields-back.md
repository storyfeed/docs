# Composing a Coherent Activity

Before recording a new kind of activity, list its fields and check that they
describe what happened. The headline states the minimal fact, no less and no
more; evidence and detail belong in the body.

## Composing an Activity

```text
:actor · :verb · :object · :target
```

Fill in the values you plan to record, using `—` for empty fields. Check that
they explain the event before writing its headline.

## Naming the Object

Use the object's plain name as its label. In `Storyfeed for Laravel`, the
object is `Storyfeed` and the target is `Laravel`; the headline template
supplies `for :target`. A qualifier such as `as a Recommendation` belongs in
the body.

## Recording an Accepted Invitation

```text
inviter · joined   · invitee    · —        incoherent
invitee · joined   · invitee    · —        incoherent
invitee · accepted · invitation · project  coherent
```

| Composition | Meaning |
|---|---|
| Inviter · joined · invitee · — | The inviter sent the invitation earlier but did not act in this event. |
| Invitee · joined · invitee · — | The invitee appears as both actor and object, without identifying what they joined. |
| Invitee · accepted · invitation · project | Identifies who accepted, what they accepted, and which project it was for. |

<span id="checking-role-values"></span>

Each field should identify someone or something involved in the event.
The same entity may fill more than one role: someone editing their own
profile is both actor and object.

Record the activity where your application accepts the invitation:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/AcceptInvitationController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Invitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class AcceptInvitationController
{
    public function __invoke(Request $request, Invitation $invitation): RedirectResponse
    {
        Storyfeed::activity()
            ->by($request->user())
            ->action('accept', $invitation)
            ->to($invitation->project)
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/AcceptInvitationController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Invitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class AcceptInvitationController
{
    public function __invoke(Request $request, Invitation $invitation): RedirectResponse
    {
        Storyfeed::record(
            verb: 'accept',
            object: $invitation,
            actor: $request->user(),
            target: $invitation->project,
        );

        return back();
    }
}
```
:::

```php memo="routes/feed.php"
use App\Models\Invitation;
use Storyfeed\Facades\Story;

Story::for(Invitation::class)->verb('accept')
    ->headline(':actor accepted :object for :target');
```

<span id="coherence-and-completeness"></span>

<a id="checking-completeness"></a>

## Checking for Missing Roles

```text
user · moved · document · folder B
```

This records the move but omits the document's original folder. Decide
whether the event needs that detail; its omission does not make the other
fields incorrect.

Check the stored values, then read the rendered headline aloud. Compare
`$item->headline()->toString()` with the sentence you intended; its verb,
roles, and preposition should state that fact.

<span id="duplicate-occurrences"></span>

## Checking Multiple Activities

Three autosaves recorded as separate revisions may each describe a valid
event but produce repetitive activities. See
[Choosing When to Publish](/cookbook/choosing-when-to-publish) for where to
publish and [Repeating Activities](/cookbook/repeating-activities) for keeping
only the latest.

<a id="unfilled-headline-tokens"></a>

## Finding Unfilled Tokens

```text
user · archived · document · —   coherent — nothing was aimed at
```

```php memo="routes/feed.php"
use App\Models\Document;
use Storyfeed\Facades\Story;

Story::for(Document::class)->verb('archive')
    ->headline(':actor archived :object from :target'); // Nothing fills :target.
```

The fields describe the event, but the headline includes an empty target.
It displays a fallback where the target's name would be.

<span id="repeated-rows"></span>
<span id="inspecting-repeated-roles"></span>
