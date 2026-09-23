# Choosing a Verb

How to name a verb, and a test for each pair of verbs that are easy to
choose between. The verb sets the Activity Streams type and is half of every
grammar key.

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

A grammar key is already the object's morph alias plus the verb, so a verb
that names its object gives `order.order.place`. A plain `place` also works for
anything else the app places.

Where a verb seems to need an extra word, the word is usually a role:

| Reaching for | Record |
| --- | --- |
| `doctrine.clause_add` | `add`, object the clause, target the doctrine |
| `menu.dish_publish` | `publish`, object the dish, target the menu |

Write verbs in the present tense: `place`, not `placed`. The headline puts it
in the past: `:actor placed :object`.

## Create or Add

`create` when the object did not exist before this activity. `add` when it
already had an identity and is now part of something.

```php
// where the fact happens: a controller, an action, a listener
use Storyfeed\Verb;

Verb::Create->by($cook)->object($dish)->publish();          // the dish is written here
Verb::Add->by($cook)->object($dish)->to($menu)->publish();  // the dish already existed
```

`add` takes a target. With no target, the verb is probably `create`.

## Delete or Remove

`delete` when nothing can be pointed at afterwards. `remove` when the object
still exists and has only left a collection.

Archiving is `remove`: the record is still there, and a feed row can still
link to it.

## Remove or Undo

`undo` reverses an activity. Its object is the earlier act, not the thing the
act was about, so restoring a retired item is `undo`, not `create`.

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

An approval is `accept`, whatever the button says.

## View or Read

`view` for an impression — a page was opened, a preview loaded. `read` for
deliberate consumption — a file was downloaded, a document taken away.

Neither changes the object. If the choice is not clear, it is `view`.

## When No Verb Fits

A verb that fits none of the twenty-eight activity types usually means
something in the domain is not modelled yet.

An email that bounced, was delivered, or failed has no verb of its own. Make
the delivery a record, and each outcome is an ordinary `create` against it:

```php
// where the fact happens: a webhook controller or listener
use Storyfeed\Verb;

Verb::Create->anonymously()
    ->object($deliveryEvent)
    ->to($document)
    ->publish();
```

Likewise, three verbs for three states of one record usually want one verb
and a record of the transition.

## When Two Verbs Would Be Identical

Two activities with the same verb, object type and target are the same
activity. Whatever separates them belongs somewhere other than the verb.

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
