# An authoriser who is not an actor

Someone does a thing; someone else permits it. The doer belongs in the sentence.
The authoriser belongs in the record, and usually nowhere else.

```php
// The contributor's story. Their photo, their name on it.
Storyfeed::activity()
    ->by($customer)
    ->action('photo.published', $photo)
    ->to($dish)
    ->publish();

// The approval. A real activity, in no feed.
Storyfeed::activity()
    ->by($approver)
    ->action('moderation.approved', $photo)
    ->publish();
```

```php
Storyfeed::feeds([
    'kitchen' => fn (FeedBuilder $feed) => $feed
        ->only(['photo.published', 'menu.changed'])
        ->except('moderation.approved'),        // decided, not forgotten
]);
```

## The shape

This turns up wherever a system has both a person who does something and a person
who permits it: moderation queues, dual control, four-eyes approval, a draft
someone else releases. The requirement is always the same sentence:

> **Recorded and queryable, not in the sentence.**

Two halves that pull against each other, which is why the obvious answers fail.

## First, check whether you already have it

Before adding a row, look for the fact where it would naturally live. An approval
usually happens *to* something — a photo, a document, a draft — and that thing
often already carries a column, a custom property, or a status field recording
who released it.

If it does, use that. The recipe below is for approvals with **no natural home**:
a change applied to a menu, a release with no record of its own, an authorisation
that sits between two entities rather than on one.

This is easy to miss in exactly the way the rest of this page is about. A design
conversation can be entirely correct and still answer a question nobody needed
answered — nothing false is said, which is what makes it harder to catch than a
wrong claim.

## Why not a role

Activity Streams gives an activity seven roles, and none of them means
*authorised by*. The vocabulary models the act and its direct participants; an
authorisation that is deliberately not an act has no term.

`attributedTo` is legal on an activity and "entities responsible for" arguably
covers an approver — but it already carries the contributor on the object, and a
reader cannot tell which meaning was intended. One word, two meanings.

## Why not a tag

`tag` is the near-miss, and it is instructive because it is *nearly* right. A
`Person` is a legal tag, tags are annotations by construction, and it renders
quietly. It would work.

It means **associated with** and nothing more. So the record says a person is
connected to this photo without saying how — which reads as tidy on the day you
write it and fails on the day the approval becomes a **consent** fact, or an
audit one, and somebody needs to know what that person actually did.
Under-specification is the wrong failure for a fact you are keeping because it
might be needed.

## Why not a `data` key

`data` is the app's opaque bag, and an entity in it is invisible to
[`involving()`](/basics/reading#scoping). The participant index covers the seven roles and nothing else, so `'approved_by' =>
$user->id` is recorded and **not** queryable — it fails the first half of the
requirement while looking like it satisfies both.

## Why an activity nobody reads

Because it satisfies both halves with mechanisms that already ship.

**Queryable.** The approver is the *actor* of a real row, so the participant
index has them. The footnote is a lookup:

```php
$approval = Activity::query()
    ->involving($photo)
    ->where('verb', 'moderation.approved')
    ->latest('published_at')
    ->first();

$approvedBy = $approval?->cachedActor;
```

**Quiet.** It renders nowhere, because no feed admits the verb. The invisibility
is a property of the read path rather than a convention someone has to remember.

**Honest on the wire.** It is the `Accept` shape Activity Streams wants, so
nothing is invented and no extension term appears in the serialized document.

**The contributor's story is untouched.** Their name is the actor, which is the
whole point of doing it this way rather than co-authoring the story.

::: tip Exclude the verb, do not omit it
`->except()` and omission produce the same feed. They do not produce the same
*record*.

`storyfeed:doctor`'s feed coverage check treats a verb as classified when a feed
names it — **including when a feed excludes it**. An omitted verb is
indistinguishable from one nobody wired up, and the helpful fix for an oversight
is exactly the harmful fix for a deliberate exclusion. Naming it writes the
decision somewhere tooling can see, so the next person to look finds *somebody
decided this* instead of a gap that invites repair.
:::

## When the second query is too much

On a single record's timeline, or one photo's detail page, the lookup is one
query on a page already doing several. On a dense list it is not.

If you reach that point, denormalise the approver's name into the story's `data`
at publish time **as well** — and keep the activity as the record of truth. The
`data` copy is a rendering convenience that may go stale; the activity is the
thing `involving()` can still find, and the thing an audit answers from.

## What the reader sees

Nothing, unless you draw it. The approval carries no headline template because it
appears in no feed. The footnote is your renderer's, from the lookup above, and
it should read like an annotation rather than a second sentence — a name and a
timestamp under the story, not a row of its own.

That asymmetry is the whole recipe: **the doer is the actor, the authoriser is a
footnote.**
