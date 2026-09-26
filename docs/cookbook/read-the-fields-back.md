# Composing a Coherent Activity

Before recording a new kind of activity, list its fields and check that they
describe what happened.

## Composing an Activity

```text
:actor · :verb · :object · :target
```

Fill in the values you plan to record, using `—` for empty fields. Check that
they explain the event before writing its headline.

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
```php [Fluent Syntax]
Storyfeed::activity()
    ->by($request->user())
    ->action('accept', $invitation)
    ->to($invitation->project)
    ->publish();
```

```php [Named Arguments]
Storyfeed::record(
    verb: 'accept',
    object: $invitation,
    actor: $request->user(),
    target: $invitation->project,
);
```
:::

```php memo="routes/feed.php"
use App\Models\Invitation;
use Storyfeed\Facades\Story;

Story::for(Invitation::class)->verb('accept')
    ->headline(':actor accepted :object to :target');
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

Check the stored values independently of the headline, since headline
definitions can change later.

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
