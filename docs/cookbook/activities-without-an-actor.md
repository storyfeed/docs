# Activities Without an Actor

An actor on every activity somebody performed, a party on every activity a
system performed, and a sentence with no `:actor` when nobody did.

```php
<?php

namespace App\Events;

class OrderPlaced implements PublishesToFeed
{
    public function __construct(public Order $order, public User $customer) {}

    public function toFeedActivity(): ?PendingActivity
    {
        return Storyfeed::activity()
            ->by($this->customer)                    // the actor travels on the event
            ->action('order.placed', $this->order)
            ->to($this->order->kitchen);
    }
}
```

<script setup>
import { who, where, orders, party, activity } from '../.vitepress/theme/samples'

const placed = activity({
  id: 'ck6a', verb: 'order.placed', glyph: 'shopping-bag',
  published_at: '2026-08-14T15:02:00.000000Z',
  headline_template: ':actor placed :object with :target',
  actor: who.regular, object: orders.first, target: where.kitchen,
})

const anonymous = activity({
  id: 'ck6b', verb: 'order.placed', glyph: 'shopping-bag',
  published_at: '2026-08-14T15:02:00.000000Z',
  headline_template: ':actor placed :object with :target',
  actor: null, object: orders.first, target: where.kitchen,
})

const paid = activity({
  id: 'ck6c', verb: 'payment.received', glyph: 'credit-card',
  published_at: '2026-08-14T16:10:00.000000Z',
  headline_template: ':actor marked :object paid',
  actor: party.service, object: orders.second,
})

const expired = activity({
  id: 'ck6d', verb: 'order.expired', glyph: 'circle-x',
  published_at: '2026-08-21T00:00:00.000000Z',
  headline_template: ':object expired at :target',
  actor: null, object: orders.fifth, target: where.kitchen,
})
</script>

<FeedStream :items="[placed]" :grouped="false" />

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::verbs([
    'order.placed' => ActivityType::Create,
    'payment.received' => ActivityType::Accept,
    'order.expired' => ActivityType::Remove,
]);

Storyfeed::grammar([
    '*.order.placed' => ':actor placed :object with :target',
    '*.payment.received' => ':actor marked :object paid',
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
    public function __construct(public Order $order) {}

    public function handle(): void
    {
        Storyfeed::activity()
            ->action('order.placed', $this->order)     // assumes no custom resolver or fallback party
            ->to($this->order->kitchen)
            ->publish();
    }
}
```

<FeedStream :items="[anonymous]" :grouped="false" />

Under those defaults the row is published with `actor: null`. To retain the
known author, use
`->by($this->customer)`, with the user passed into the job the way the event above
carries it. For a known system use a [party](/deeper/parties#parties); when the
actor is genuinely absent, [actorless voice](/deeper/parties#actorless-voice)
provides a separate sentence for the same verb.

## An Explicitly Unknown Actor

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($knownAuthor) // User|null: null explicitly means anonymous
    ->action('order.placed', $order)
    ->to($kitchen)
    ->publish();
```

`by(null)` bypasses the ambient actor, custom resolver, authenticated user,
and fallback party. It does not borrow the current operator's identity when
the carried author is unknown.

| Spelling | Actor Behavior |
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

## One Sentence per Kind of Actor

| The Act Was Performed by | The Actor Is | The Sentence |
|---|---|---|
| a user | the user, passed from the event or the action | `:actor placed :object with :target` |
| a job, a command, an integration | a party, named | `:actor marked :object paid` |
| nobody | none | `:object expired at :target` |

## A System Is a Party

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by('Stripe')
    ->action('payment.received', $order)
    ->publish();
```

<FeedStream :items="[paid]" :grouped="false" />

`by('Stripe')` names a party; `by(null)` explicitly records an anonymous
actor. The difference is in
[Parties & anonymous actors](/deeper/parties).

A job that publishes many activities scopes the block with
`Storyfeed::as('System', …)` instead of naming the party on each call; see
[Scoped attribution](/deeper/parties#scoped-attribution).

## No Actor at All

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    'order.expired' => ':object expired at :target',   // no :actor, on purpose
]);

Storyfeed::anonymous() // bypass actor resolution even inside an attributed scope
    ->action('order.expired', $order)
    ->to($kitchen)
    ->publish();
```

<FeedStream :items="[expired]" :grouped="false" />

The builder records no actor, and the template describes the expiry without
naming one. Removing `:actor` from a template changes only the sentence; it
does not clear a stored actor or disable actor resolution.
