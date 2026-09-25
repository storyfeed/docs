# Choosing What Not to Record

Publish an activity only when a reader of the feed would want to see it.
Most events in an app, such as drafts, saves and background work, record
nothing.

<span id="events-to-omit"></span>

## Choosing Events to Record

| What Happened | Activity | Because |
|---|---|---|
| a model created as a draft | no | nothing has happened yet that a reader would act on |
| a save with no status change | no | nothing a reader would notice has changed |
| the text of a note edited | no | the note is the story; its edit is not. Its [body](/basics/activity-content#adding-entity-bodies) shows the current text |
| a background index, a cache rebuild, a dirty flag set | no | no reader did anything |
| someone typing, or coming online | no | it stops being true within seconds |
| a field-level audit row | no | an audit log is its own surface |
| a status transition | yes | one verb per transition, as in [Choosing When to Publish](/cookbook/choosing-when-to-publish) |
| a question asked about a menu item | yes | the sentence names what was asked about; the activity can [quote the question](/basics/activity-content#adding-quoted-text) |
| an order placed | yes | |
| an order viewed | yes, for a while | its verb declares a [retention window](/deeper/retention) |

## Skipping Publication

```php memo="app/Events/OrderPlaced.php"
<?php

namespace App\Events;

use App\Models\Order;
use App\Models\User;
use Storyfeed\Contracts\PublishesToFeed;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\PendingActivity;

class OrderPlaced implements PublishesToFeed
{
    public function __construct(public Order $order, public User $customer) {}

    public function toFeedActivity(): ?PendingActivity
    {
        if ($this->order->status === 'draft') {
            return null;                                 // not an activity
        }

        return Storyfeed::activity()
            ->by($this->customer)
            ->action('place', $this->order)
            ->to($this->order->shop);
    }
}
```

Returning `null` publishes nothing. See
[Publishing from Events](/deeper/events).

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Storyfeed;

Storyfeed::verbs([
    'place' => ActivityType::Create,
]);
```

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target');
```
