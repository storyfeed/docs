# Activities without an Actor

An actor on every activity somebody performed, a party on every activity a
system performed, and a sentence with no `:actor` when nobody did.

```php
<?php

namespace App\Events;

class DocumentSubmitted implements PublishesToFeed
{
    public function __construct(public Document $document, public User $user) {}

    public function toFeedActivity(): ?PendingActivity
    {
        return PendingActivity::inline('submit')
            ->by($this->user)                    // the actor travels on the event
            ->object($this->document)
            ->to($this->document->project);
    }
}
```

<script setup>
import { who, where, doc, entity, activity } from '../.vitepress/theme/samples'

const submitted = activity({
  id: 'ck6a', verb: 'submit', glyph: 'file-check',
  published_at: '2026-08-14T15:02:00.000000Z',
  headline_template: ':actor submitted :object to :target',
  actor: who.designer, object: doc.report, target: where.main,
})

const anonymous = activity({
  id: 'ck6b', verb: 'submit', glyph: 'file-check',
  published_at: '2026-08-14T15:02:00.000000Z',
  headline_template: ':actor submitted :object to :target',
  actor: null, object: doc.report, target: where.main,
})

const signed = activity({
  id: 'ck6c', verb: 'sign', glyph: 'file-check',
  published_at: '2026-08-14T16:10:00.000000Z',
  headline_template: ':actor reported :object signed for :target',
  actor: entity('storyfeed.party', '2', 'DocuSign', null),
  object: doc.pricing, target: where.main,
})

const expired = activity({
  id: 'ck6d', verb: 'expire', glyph: 'archive',
  published_at: '2026-08-21T00:00:00.000000Z',
  headline_template: ':object expired in :target',
  actor: null, object: doc.motionTestCopy, target: where.main,
})
</script>

<FeedStream :items="[submitted]" :grouped="false" />

```php
// AppServiceProvider::boot()
Storyfeed::verbs([
    'submit' => ActivityType::Offer,
    'sign' => ActivityType::Accept,
    'expire' => ActivityType::Remove,
]);

Storyfeed::grammar([
    'document.submit' => ':actor submitted :object to :target',
    'document.sign' => ':actor reported :object signed for :target',
]);
```

## The Actor Read from the Request

An activity that omits `by()` uses ambient actor resolution. With the default
configuration this is the authenticated user; a queue worker with no
authenticated user, custom resolver, or fallback party resolves to null:

```php
<?php

namespace App\Listeners;

class RecordSubmission implements ShouldQueue
{
    public function __construct(public Document $document) {}

    public function handle(): void
    {
        Storyfeed::activity()
            ->action('submit', $this->document)     // assumes no custom resolver or fallback party
            ->to($this->document->project)
            ->publish();
    }
}
```

<FeedStream :items="[anonymous]" :grouped="false" />

Under those defaults the row is published with `actor: null`. To retain the
known author, use
`->by($this->user)`, with the user passed into the job the way the event above
carries it. For a known system use a [party](/deeper/parties#parties); when the
actor is genuinely absent, [actorless voice](/deeper/parties#actorless-voice)
provides a separate sentence for the same verb.

## An Explicitly Unknown Actor

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($knownAuthor) // User|null: null explicitly means anonymous
    ->action('submit', $document)
    ->to($project)
    ->publish();
```

`by(null)` bypasses the ambient actor, custom resolver, authenticated user,
and fallback party. It does not borrow the current operator's identity when
the carried author is unknown.

| spelling | actor behavior |
|---|---|
| omit `by()` | resolve the ambient actor |
| `->by(null)` or `->actor(null)` | explicitly anonymous |
| `->anonymously()` | explicitly anonymous on an existing builder |
| `Storyfeed::anonymous()` | start an explicitly anonymous builder |

The last explicit actor choice wins: `->by($user)->anonymously()` clears the
actor; `->anonymously()->by($user)` names the user. These builder methods
also override `Storyfeed::as(...)`. The one-call `Storyfeed::record(...,
actor: null)` still uses ambient resolution; use an anonymous builder when
null is intentional.

## Who Acted Decides the Sentence

| the act was performed by | the actor is | the sentence |
|---|---|---|
| a user | the user, passed from the event or the action | `:actor submitted :object to :target` |
| a job, a command, an integration | a party, named | `:actor reported :object signed for :target` |
| nobody | none | `:object expired in :target` |

## A System Is a Party

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by('DocuSign')
    ->action('sign', $document)
    ->to($project)
    ->publish();
```

<FeedStream :items="[signed]" :grouped="false" />

`by('DocuSign')` names a party; `by(null)` explicitly records an anonymous
actor. The difference is in
[Parties & anonymous actors](/deeper/parties).

A job that publishes many activities scopes the block with
`Storyfeed::as('System', …)` instead of naming the party on each call; see
[Scoped attribution](/deeper/parties#scoped-attribution).

## Nobody Acted

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    'document.expire' => ':object expired in :target',   // no :actor, on purpose
]);

Storyfeed::anonymous() // bypass actor resolution even inside an attributed scope
    ->action('expire', $document)
    ->to($project)
    ->publish();
```

<FeedStream :items="[expired]" :grouped="false" />

The builder records no actor, and the template describes the expiry without
naming one. Removing `:actor` from a template changes only the sentence; it
does not clear a stored actor or disable actor resolution.
