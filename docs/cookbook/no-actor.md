# When the sentence has no actor

An actor on every activity somebody performed, a party on every activity a
system performed, and a sentence with no `:actor` when nobody did.

```php
class DocumentSubmitted implements PublishesToFeed
{
    public function __construct(public Document $document, public User $user) {}

    public function toFeedStory(): ?PendingStory
    {
        return PendingStory::inline('submit')
            ->by($this->user)                    // the actor travels on the event
            ->object($this->document)
            ->to($this->document->project);
    }
}
```

<script setup>
import { who, where, doc, entity, activity } from '../.vitepress/theme/samples'

const submitted = activity({
  id: 'ck6a', verb: 'submit', icon: 'file-check',
  published_at: '2026-08-14T15:02:00.000000Z',
  headline_template: ':actor submitted :object to :target',
  actor: who.ines, object: doc.annualReportV3, target: where.passwordCrackdown,
})

const anonymous = activity({
  id: 'ck6b', verb: 'submit', icon: 'file-check',
  published_at: '2026-08-14T15:02:00.000000Z',
  headline_template: ':actor submitted :object to :target',
  actor: null, object: doc.annualReportV3, target: where.passwordCrackdown,
})

const signed = activity({
  id: 'ck6c', verb: 'sign', icon: 'file-check',
  published_at: '2026-08-14T16:10:00.000000Z',
  headline_template: ':actor reported :object signed for :target',
  actor: entity('storyfeed.party', '2', 'DocuSign', null),
  object: doc.pricingTableFinal, target: where.passwordCrackdown,
})

const expired = activity({
  id: 'ck6d', verb: 'expire', icon: 'archive',
  published_at: '2026-08-21T00:00:00.000000Z',
  headline_template: ':object expired in :target',
  actor: null, object: doc.motionTestClientCopy, target: where.passwordCrackdown,
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

## The actor read from the request

An activity published with no actor takes the authenticated user. On a queue
worker there is none:

```php
class RecordSubmission implements ShouldQueue
{
    public function __construct(public Document $document) {}

    public function handle(): void
    {
        Storyfeed::activity()
            ->action('submit', $this->document)     // no actor: on a worker, nobody is authenticated
            ->to($this->document->project)
            ->publish();
    }
}
```

<FeedStream :items="[anonymous]" :grouped="false" />

The row is published with `actor: null`, and the renderer supplies its own
label. The line that prevents it is `->by($this->user)`, with the user passed
into the job the way the event above carries it.

## Who acted decides the sentence

| the act was performed by | the actor is | the sentence |
|---|---|---|
| a user | the user, passed from the event or the action | `:actor submitted :object to :target` |
| a job, a command, an integration | a party, named | `:actor reported :object signed for :target` |
| nobody | none | `:object expired in :target` |

## A system is a party

```php
Storyfeed::activity()
    ->by('DocuSign')
    ->action('sign', $document)
    ->for($project)
    ->publish();
```

<FeedStream :items="[signed]" :grouped="false" />

A string actor becomes a party: a named participant with no model. A null
actor means the actor is unknown. The two render differently and mean
different things; see [Parties & anonymous actors](/deeper/parties).

For a job that publishes many activities, scope the block with
`Storyfeed::as('System', …)` instead of naming the party on each call. That is
in [Parties](/deeper/parties#scoped-attribution).

## Nobody acted

```php
Storyfeed::grammar([
    'document.expire' => ':object expired in :target',   // no :actor, on purpose
]);

Storyfeed::activity()
    ->action('expire', $document)
    ->in($project)
    ->publish();
```

<FeedStream :items="[expired]" :grouped="false" />

The template has no `:actor`, so a null actor is not a gap in the sentence. A
scheduled command that publishes this activity records nothing about who ran
it, because nobody did.
