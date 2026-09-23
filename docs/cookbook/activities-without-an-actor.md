# Activities Without an Actor

Record the user when a person acted, a named party when a system acted, and
no actor when nobody did. Each case gets its own headline.

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
            ->action('place', $this->order)
            ->to($this->order->kitchen);
    }
}
```

<script setup>
import { who, where, orders, party, activity } from '../.vitepress/theme/samples'

const placed = activity({
  id: 'ck6a', verb: 'place', glyph: 'shopping-bag',
  published_at: '2026-08-14T15:02:00.000000Z',
  headline_template: ':actor placed :object with :target',
  actor: who.regular, object: orders.first, target: where.kitchen,
})

const anonymous = activity({
  id: 'ck6b', verb: 'place', glyph: 'shopping-bag',
  published_at: '2026-08-14T15:02:00.000000Z',
  headline_template: ':actor placed :object with :target',
  actor: null, object: orders.first, target: where.kitchen,
})

const paid = activity({
  id: 'ck6c', verb: 'pay', glyph: 'credit-card',
  published_at: '2026-08-14T16:10:00.000000Z',
  headline_template: ':actor marked :object paid',
  actor: party.service, object: orders.second,
})

const expired = activity({
  id: 'ck6d', verb: 'expire', glyph: 'circle-x',
  published_at: '2026-08-21T00:00:00.000000Z',
  headline_template: ':object expired at :target',
  actor: null, object: orders.fifth, target: where.kitchen,
})
</script>

<FeedExample context :items="[placed]" />

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::verbs([
    'place' => ActivityType::Create,
    'pay' => ActivityType::Accept,
    'expire' => ActivityType::Remove,
]);

Storyfeed::grammar([
    'order.place' => ':actor placed :object with :target',
    'order.pay' => ':actor marked :object paid',
]);
```

## The Actor Read from the Request

Without `by()`, the actor is resolved from the request: by default, the
authenticated user. A job dispatched from a console command or the scheduler
has no user, so with no custom resolver or fallback party the actor is `null`:

```php
<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Storyfeed\Facades\Storyfeed;

class RecordOrder implements ShouldQueue
{
    public function __construct(public Order $order) {}

    public function handle(): void
    {
        Storyfeed::activity()
            ->action('place', $this->order)     // no by(), no user: the actor is null
            ->to($this->order->kitchen)
            ->publish();
    }
}
```

<FeedExample :items="[anonymous]" />

To keep the author, pass the user into the job and call
`->by($this->customer)`, as the event above does. For a system, use a
[party](/deeper/parties#parties). When nobody acted, give the verb an
[actorless sentence](/deeper/parties#actorless-voice).

## An Explicitly Unknown Actor

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($knownAuthor)                          // User|null: null means anonymous
    ->action('place', $order)
    ->to($kitchen)
    ->publish();
```

`by(null)` skips actor resolution entirely: no resolver, no authenticated
user, no fallback party.

| Spelling | Actor |
|---|---|
| omit `by()` | resolved from the request |
| `->by(null)` or `->actor(null)` | anonymous |
| `->anonymously()` | anonymous, on an existing builder |
| `Storyfeed::anonymous()` | anonymous, from the start |

The last call wins: `->by($user)->anonymously()` records no actor, and
`->anonymously()->by($user)` records the user. Both override
`Storyfeed::as(...)`. `Storyfeed::record(..., actor: null)` still resolves the
actor; use an anonymous builder instead.

## One Sentence per Kind of Actor

| The Act Was Performed by | The Actor Is | The Sentence |
|---|---|---|
| a user | the user | `:actor placed :object with :target` |
| a job, a command, an integration | a party, named | `:actor marked :object paid` |
| nobody | none | `:object expired at :target` |

## A System Is a Party

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by('Stripe')
    ->action('pay', $order)
    ->publish();
```

<FeedExample :items="[paid]" />

A job that publishes many activities can wrap them in
`Storyfeed::as('System', …)` instead of naming the party on each call. See
[Scoped Attribution](/deeper/parties#scoped-attribution).

## No Actor at All

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::grammar([
    'order.expire' => ':object expired at :target',   // no :actor, on purpose
]);

// where the fact happens: a controller, an action, a listener
Storyfeed::anonymous()                          // no actor, even inside Storyfeed::as()
    ->action('expire', $order)
    ->to($kitchen)
    ->publish();
```

<FeedExample :items="[expired]" />

Leaving `:actor` out of a template changes only the sentence. It does not
clear a stored actor.
