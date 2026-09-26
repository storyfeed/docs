# Choosing What Not to Record

Publish activities that help people follow what happened. Routine saves,
drafts, and background work usually do not belong in the feed.

<span id="events-to-omit"></span>

## Choosing Events to Record

| Event | Record It? | Reason |
|---|---|---|
| model created as a draft | no | it is not ready for others to act on |
| save with no status change | no | no visible change occurred |
| note text edited | no | the note's [body](/basics/activity-content#adding-entity-bodies) already displays its current text |
| background indexing, cache rebuilding, or setting a dirty flag | no | internal maintenance is not useful feed content |
| someone typing or coming online | no | the state may change within seconds |
| field-level audit record | no | keep detailed change history in an audit log |
| status transition | yes | each transition describes an event; see [Choosing When to Publish](/cookbook/choosing-when-to-publish) |
| question asked about a menu item | yes | the activity identifies the subject and can [quote the question](/basics/activity-content#adding-quoted-text) |
| order placed | yes | others can follow the order's progress |
| order viewed | temporarily | use the verb's [retention period](/deeper/retention) to limit how long it remains |

## Skipping Publication

For an event implementing `PublishesToFeed`, check whether to publish in
`toFeedActivity()`:

```php memo="app/Events/OrderPlaced.php" at="toFeedActivity()"
if ($this->order->status === 'draft') {
    return null;                                 // not an activity [!code highlight]
}

return Storyfeed::activity()
    ->by($this->customer)
    ->action('place', $this->order)
    ->to($this->order->shop);
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
