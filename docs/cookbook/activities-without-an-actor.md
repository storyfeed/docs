# Activities Without an Actor

<script setup>
import { scene } from '../.vitepress/theme/world'
import { linkFetch } from '../.vitepress/theme/recipes/signed-links'
const { paid } = scene.cookbook.actorless
</script>

Use the user as actor for a person's action and a named party for a system's
action. An anonymous activity has no recorded actor: who acted is unknown,
including when you deliberately use `Storyfeed::anonymous()` or `by(null)`.

<span id="headlines-by-actor-type"></span>

## Choosing an Actor

| Event | Actor | Headline |
|---|---|---|
| a user places an order | the user | `:actor placed :object with :target` |
| a job, command, or integration marks an order paid | a named party | `:actor marked :object paid` |
| an order expires without a recorded actor | none | `:object expired at :target` |
| someone fetches a link sent to a customer | none; the customer is the target | `:object was fetched through the link sent to :target` |

<span id="the-default-actor"></span>
<span id="recording-the-authenticated-user"></span>
<span id="preserving-an-actor-in-background-work"></span>

## Recording a System Actor

Pass a string to `by()` to record a named party, such as the payment service
that confirmed the payment:

::: code-group
```php [Fluent Syntax] memo="app/Jobs/MarkOrderPaid.php"
<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Storyfeed\Facades\Storyfeed;

class MarkOrderPaid implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order) {}

    public function handle(): void
    {
        $this->order->update(['status' => 'paid']);

        Storyfeed::activity()
            ->by('Stripe')
            ->action('pay', $this->order)
            ->publish();
    }
}
```

```php [Named Arguments] memo="app/Jobs/MarkOrderPaid.php"
<?php

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Storyfeed\Facades\Storyfeed;

class MarkOrderPaid implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order) {}

    public function handle(): void
    {
        $this->order->update(['status' => 'paid']);

        Storyfeed::record(
            verb: 'pay',
            object: $this->order,
            actor: 'Stripe',
        );
    }
}
```
:::

Define the headline for the verb:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('pay')
    ->headline(':actor marked :object paid');
```

<FeedExample :items="[paid]" />

<span id="recording-without-an-actor"></span>

## Recording No Actor

To record no actor, such as for an order that expires unpaid, call
`Storyfeed::anonymous()` and define a headline without `:actor`. See
[Recording Anonymous Activities](/deeper/parties-and-anonymous-actors#recording-anonymous-activities).

<span id="recording-an-unverified-fetch"></span>
<span id="retrieving-fetch-evidence"></span>
<span id="finding-a-recipient-s-link-access"></span>
<span id="recording-an-authenticated-performer"></span>

## A Link Sent to Someone

A signed link proves which link was used, not who used it: a forwarded link or
a mail scanner fetches it too. Record the fetch with no actor, and the intended
recipient as the target:

```php memo="routes/feed.php"
use App\Models\Document;
use Storyfeed\Facades\Story;

Story::for(Document::class)->verb('fetch')
    ->headline(':actor fetched :object')
    ->anonymousHeadline(':object was fetched through the link sent to :target');
```

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/DocumentLinkController.php" at="__invoke()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::anonymous()
    ->action('fetch', $document)
    ->to($recipient)
    ->data(['prefetch' => $request->header('Purpose') === 'prefetch'])
    ->publish();
```

```php [Named Arguments] memo="app/Http/Controllers/DocumentLinkController.php" at="__invoke()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::record(
    verb: 'fetch',
    object: $document,
    target: $recipient,
    anonymous: true,
    data: ['prefetch' => $request->header('Purpose') === 'prefetch'],
);
```
:::

<FeedExample :items="[linkFetch]" />

`Storyfeed::feed()->involving($recipient)` lists the fetches through their
links. A `Purpose: prefetch` header hints that software fetched the link, so it
is stored as data, never as the actor.
