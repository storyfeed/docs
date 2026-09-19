# Recording an Authoriser

Someone does a thing; someone else permits it. The doer belongs in the sentence.
The authoriser belongs in the record, and usually nowhere else.

```php
// The contributor's story. Their photo, their name on it.
Storyfeed::activity()
    ->by($customer)
    ->action('publish', $photo)
    ->to($dish)
    ->publish();

// The approval. A real activity, in no feed.
Storyfeed::activity()
    ->by($approver)
    ->action('approve', $photo)
    ->publish();
```

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::feeds([
    'kitchen' => fn (FeedBuilder $feed) => $feed
        ->only(['publish', 'reprice'])
        ->except('approve'),        // decided, not forgotten
]);
```

## The Shape

This turns up wherever a system has both a person who does something and a person
who permits it: moderation queues, dual control, four-eyes approval, a draft
someone else releases. The requirement is always the same sentence:

> **Recorded and queryable, not in the sentence.**

Two halves that pull against each other: a role would put the approver in the
sentence, and a `data` key would keep them out of the index.

## Checking for an Existing Record

Before adding a row, look for the fact where it would naturally live. An approval
usually happens *to* something — a photo, a document, a draft — and that thing
often already carries a column, a custom property, or a status field recording
who released it.

If it does, use that. The recipe below is for approvals with **no natural home**:
a change applied to a menu, a release with no record of its own, an authorisation
that sits between two entities rather than on one.

## Recording It as Its Own Activity

Record the approval as a real activity whose actor is the approver, and admit
its verb to no feed. That satisfies both halves with mechanisms that already
ship.

**Queryable.** The approver is the *actor* of a real row, so the participant
index has them. The footnote is a lookup:

```php
$approval = Activity::query()
    ->involving($photo)
    ->where('verb', 'approve')
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

## When the Second Query Is Too Much

On a single record's timeline, or one photo's detail page, the lookup is one
query on a page already doing several. On a dense list it is not.

If you reach that point, denormalise the approver's name into the story's `data`
at publish time **as well** — and keep the activity as the record of truth. The
`data` copy is a rendering convenience that may go stale; the activity is the
thing `involving()` can still find, and the thing an audit answers from.

## What the Reader Sees

Nothing, unless you draw it. The approval carries no headline template because it
appears in no feed. The footnote is your renderer's, from the lookup above, and
it should read like an annotation rather than a second sentence — a name and a
timestamp under the story, not a row of its own.

That asymmetry is the whole recipe: **the doer is the actor, the authoriser is a
footnote.**
