# Composing a Coherent Activity

Before you record a new kind of activity, write its fields out in a line and
check that they describe what happened.

```text
:actor · :verb · :object · :target
```

Fill in the values you plan to record, with `—` for an empty field. A reader
should be able to tell what happened from those values alone. Do this before
writing the headline.

## An Invitation Accepted

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

## What to Look For

| Failure Mode | Inspect Each Field for |
|---|---|
| A bystander | someone who did not take part in this event |
| A repetition | the same entity in two fields |
| Noise | something that is not part of the event at all |

A repetition can be right: someone editing their own profile is both actor and
object.

## Coherence and Completeness

```text
user · moved · document · folder B
```

This describes the move, but not where the document came from. That is a
missing detail, not a wrong record; decide separately whether the event needs
it.

Read the stored values, not the headline. The headline can change later; the
record stays.

## What Reading One Row Cannot Catch

Two mistakes look correct in any single row.

### Whether the Event Happened Once

```text
user · revised · proposal · —   coherent
user · revised · proposal · —   coherent
user · revised · proposal · —   coherent
```

Three autosaves, one revision as a reader would count it. Look at several rows
for the verb, not one. [Choosing When to Publish](/cookbook/choosing-when-to-publish)
covers where the call belongs, and
[Repeating Activities](/cookbook/repeating-activities) covers collapsing the
rest.

### Whether Every Token Has a Publisher

```text
user · archived · document · —   coherent — nothing was aimed at
```

```php
// config/storyfeed.php
'document.archive' => ':actor archived :object from :target'   // ✗ nothing fills :target
```

The fields are fine, but the template names a role no publisher fills, so the
headline shows a fallback where a name should be.

```sh
php artisan storyfeed:doctor --only=roles
```

The `roles` check reports a template that names a role none of its activities
carry.

## Repeated Rows

```sh
php artisan storyfeed:doctor --only=reflexive
```

The check lists activities with the same entity as `actor` and `object`,
grouped by verb, at `info` severity. It does not find bystanders, noise, or
repetition in other fields. Read the rows it lists back with the test above.
See [Doctor](/reference/doctor).
