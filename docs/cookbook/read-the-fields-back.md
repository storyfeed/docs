# Composing a Coherent Activity

Before you record a new kind of activity, write its fields out in a line and
check that they describe what happened.

## Composing an Activity

```text
:actor · :verb · :object · :target
```

Fill in the values you plan to record, with `—` for an empty field. A reader
should be able to tell what happened from those values alone. Do this before
writing the headline.

## Recording an Accepted Invitation

```text
inviter · joined   · invitee    · —        incoherent
invitee · joined   · invitee    · —        incoherent
invitee · accepted · invitation · project  coherent
```

| Composition | What the Fields Say |
|---|---|
| Inviter · joined · invitee · — | The inviter is the actor, but sent the invitation earlier and did not act here. |
| Invitee · joined · invitee · — | The invitee is repeated as the object, and nothing says what they joined. |
| Invitee · accepted · invitation · project | Who accepted, what they accepted, and which project it was for. |

<span id="checking-role-values"></span>

Each field should name something that took part in this event, once. A
repetition can be right: someone editing their own profile is both actor and
object.

Record the coherent composition where the invitation is accepted:

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

This describes the move, but not where the document came from. That is a
missing detail, not a wrong record; decide separately whether the event needs
it.

Read the stored values, not the headline. The headline can change later; the
record stays.

<span id="duplicate-occurrences"></span>

## Checking Multiple Activities

Three autosaves recorded as three revisions each look coherent alone.
[Choosing When to Publish](/cookbook/choosing-when-to-publish) covers where the
call belongs, and [Repeating Activities](/cookbook/repeating-activities) covers
keeping only the latest.

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

The fields are fine, but the template names a role no publisher fills, so the
headline shows a fallback where a name should be.

<span id="repeated-rows"></span>
<span id="inspecting-repeated-roles"></span>
