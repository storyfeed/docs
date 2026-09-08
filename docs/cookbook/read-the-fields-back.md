# Read the fields back

Check an activity's composition before recording it: **read the recorded fields
back. Do they cohere?**

```text
:actor · :verb · :object · :target
```

Substitute the values you plan to record. Use `—` for an empty field. Can a
reader reconstruct the event from those values alone? Apply this to each new
composition before writing its headline.

## An invitation accepted

```text
Nayani · joined   · Sam        · —      incoherent
Sam    · joined   · Sam        · —      incoherent
Sam    · accepted · invitation · table  coherent
```

The event is an invitee accepting an invitation to a table. The inviter sent
the invitation earlier; they did not perform the acceptance.

| Composition | What the fields say |
|---|---|
| Inviter · joined · invitee · — | The inviter occupies the actor field, although they did not act in this event. |
| Invitee · joined · invitee · — | Correcting the actor still leaves the invitee repeated as the object. The fields do not identify what they joined. |
| Invitee · accepted · invitation · table | The fields identify who accepted, what they accepted, and which table the invitation was for. |

## Three things to look for

| Failure mode | Inspect each field for |
|---|---|
| A bystander | Someone who did not participate in this event. |
| A repetition | The same entity occupying two fields. Check whether both roles are intended. |
| Noise | Something that is not part of the event at all. |

A repetition can be legitimate: someone editing their own profile may be both
actor and object. Read the fields together to decide whether the repetition
describes the event.

## Coherence and completeness

```text
Sam · moved · file · List B
```

This record coheres: it identifies who moved the file and its destination.
It does not identify where the file came from. That missing role is a fidelity
gap, not an incoherence. Decide separately whether the event needs that detail.

The test does not require a grammatical sentence or prepositions between the
fields. The summary can change at any time while the record remains. Read the
stored values independently of the prose used to display them.

## Check recorded repetitions

::: tip Availability
The `reflexive` doctor check is on `dev-main` from core commit `a814cea` and is
not yet in a tagged release.
:::

```sh
php artisan storyfeed:doctor --only=reflexive
```

The check reports activities with the same entity type and ID in `actor` and
`object`, grouped by verb. Its `reflexive.actor_object` finding is an
informational note (`info`), because reflexive records can be legitimate.
It catches actor/object repetition, not bystanders or noise, and does not
inspect every pair of fields. Use the finding to read those records back.

See [Doctor](/reference/doctor) for running checks and
[Recording activities](/basics/recording) for assigning the fields.
