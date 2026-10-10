# Activities Without an Actor

<script setup>
import { scene } from '../.vitepress/theme/world'
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

<span id="the-default-actor"></span>
<span id="recording-the-authenticated-user"></span>
<span id="preserving-an-actor-in-background-work"></span>

Omit `by()` to record the authenticated user; see
[Assigning the Actor](/basics/recording#assigning-the-actor). A job started by
a console command or the scheduler has no authenticated user, so pass the user
to the job and call `by()`; see
[Carrying Roles Into Queued Jobs](/deeper/activity-scopes#carrying-roles-into-queued-jobs).

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

See [Publishing From Events](/deeper/events) for the complete webhook or
[Sharing an Actor](/deeper/activity-scopes#sharing-an-actor) to use one party
throughout a job. Parties can also fill
[other roles](/deeper/parties#using-parties-in-other-roles).

<span id="recording-without-an-actor"></span>

## Recording No Actor

To record no actor, such as for an order that expires unpaid, call
`Storyfeed::anonymous()` and define a headline without `:actor`. See
[Recording Anonymous Activities](/deeper/parties#recording-anonymous-activities)
and [Anonymous Headlines](/deeper/parties#anonymous-headlines).

For message delivery, bounces, spam complaints and send failures, see
[Recording Email Lifecycle Events](/cookbook/email-lifecycle-events).
