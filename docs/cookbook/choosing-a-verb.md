# Choosing a Verb

Several verbs sit close enough together that the choice is not obvious. Each
pair below has a test that decides it, and the answer matters beyond wording:
the verb decides the Activity Streams type a consumer reads, and it is half of
every grammar key.

## Naming a Verb

A verb says what happened. It does not say what it happened to — the object
already does that.

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()->by($customer)
    ->action('place', $order)   // not 'order.place'
    ->to($kitchen)
    ->publish();
```

A verb that names its object repeats itself in every grammar key, because a
key is already the object's morph alias and the verb: `order.order.place`. It
also stops the verb being shared — `place` reads correctly for anything an app
places, and `order.place` reads correctly for one model.

Where a verb seems to need the extra word, the word is usually a role:

| Reaching for | Record |
| --- | --- |
| `doctrine.clause_add` | `add`, object the clause, target the doctrine |
| `menu.dish_publish` | `publish`, object the dish, target the menu |

**Write verbs in the present tense** — `place`, not `placed`. The headline is
where a sentence reads as the past: the stored verb is the fact, and
`:actor placed :object` is how it is shown.

## Create or Add

`create` when the object did not exist before this activity. `add` when it
already had an identity and is now part of something.

```php
// where the fact happens: a controller, an action, a listener
use Storyfeed\Verb;

Verb::Create->by($cook)->object($dish)->publish();          // the dish is written here
Verb::Add->by($cook)->object($dish)->to($menu)->publish();  // the dish already existed
```

`add` takes a target, because a thing is added *to* something. If there is no
target, the verb is probably `create`.

## Delete or Remove

`delete` when nothing can be pointed at afterwards. `remove` when the object
still exists and has only left a collection.

Archiving is `remove`: the record is still there and a feed row can still link
to it. Reach for `delete` only when the thing is gone.

## Remove or Undo

`undo` reverses an **activity**. Its object is the earlier act, not the thing
the act was about — which is why restoring a retired item is `undo` rather than
`create`. The item is not being written again; a retirement is being called off.

| The sentence you would say | Verb |
| --- | --- |
| "It left the collection." | `remove` |
| "That should not have happened." | `undo` |

## Offer or Invite

`offer` is directed at someone and expects an answer. `invite` is an offer
whose object is an invitation to take part.

Sending a document is `offer`. Sending it for signature is `invite`, because
the recipient is being asked to become a participant.

## Accept or Like

`accept` answers a prior `offer` or `invite`. `like` is unprompted.

An approval flow is `accept` every time, even when the interface calls the
button something else.

## View or Read

`view` for an impression — a page was opened, a preview loaded. `read` for
deliberate consumption — a file was downloaded, a document taken away.

Both are activities. Recording that someone looked at something needs no
special treatment, and neither verb implies a change to the object.

If the choice is not clear, it is `view`.

## When No Verb Fits

A verb that will not fit any of the twenty-eight activity types is usually a
sign that something in the domain is not modelled yet.

An email that bounced, was delivered, or failed has no verb of its own. What
changed state is the delivery, and once a delivery is a record of its own, each
outcome is an ordinary `create` against it:

```php
// where the fact happens: a webhook controller or listener
use Storyfeed\Verb;

Verb::Create->anonymously()
    ->object($deliveryEvent)
    ->to($document)
    ->publish();
```

The same test applies to a status that keeps moving. Three verbs for three
states of one record usually want one verb and a record of the transition.

## When Two Verbs Would Be Identical

If two activities would share a verb, an object type and a target, they are the
same activity, and whatever separates them belongs somewhere other than the
verb.

| What separates them | Where it belongs |
| --- | --- |
| A field moved | [a change in the body](/deeper/details) |
| Something was produced | the `result` role |
| One happened earlier | `publishedAt()` |

```php
// where the fact happens: a controller, an action, a listener
use Storyfeed\Verb;

Verb::Update->by($cook)
    ->object($dish)
    ->resulting($revision) // what the update produced
    ->publish();
```

A verb whose only job is to say *when* something happened is the clearest case:
a backdated coverage is `publishedAt()`, not a second verb.
