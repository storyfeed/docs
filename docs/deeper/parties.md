# Parties & Anonymous Actors

<script setup>
import { orders, party, activity } from '../.vitepress/theme/samples'

const paid = activity({
  id: 'pt1', verb: 'payment.received', glyph: 'credit-card',
  published_at: '2026-08-14T14:32:00.000000Z',
  headline_template: ':actor marked :object paid',
  actor: party.service,
  object: orders.first,
})
</script>

Two different things that both look like "not a user":

|  | Means | In the Payload |
|---|---|---|
| **anonymous** | the actor is genuinely unknown | `actor: null` — actorless grammar or a renderer fallback |
| **party** | a named participant with no model in your app | an ordinary entity, `type: "storyfeed.party"`, real `label`, `url: null` |

## Parties

```php
// where the fact happens: a controller, an action, a listener
$party = Storyfeed::party('Stripe');

Storyfeed::record('payment.received', $order, actor: $party);
```

<FeedStream :items="[paid]" :grouped="false" />

Parties work in **any** role — actor, object, target, context, origin, result, or instrument:

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->action('order.on_the_way', $order)
    ->to(Storyfeed::party('Front desk'))
    ->publish();
```

`party()` resolves-or-creates by name, so repeated calls reuse the row.

## Scoped Attribution

Inside a job or console command there is no authenticated user. Scope a block:

```php
// a job, or a console command
Storyfeed::as('System', function () {
    Storyfeed::record('order.cancelled', object: $order);
});
```

A string becomes a party; a model is used directly. An explicit `->actor()`
still wins inside the scope, and the previous resolver is restored even if the
callback throws.

## App-wide Fallbacks

```php
// config/storyfeed.php
'parties' => [
    'fallback' => null,      // e.g. 'System' — a name for otherwise-anonymous publishes
],

'actor_resolver' => null,    // an invokable class; null = the authenticated user
```

With no fallback, unresolvable publishes are anonymous.

## Actorless Voice

::: tip
`actorlessGrammar()` is not in a tagged release. An install pinned to v0.9.0 or
earlier resolves ordinary grammar for an actorless activity.
:::

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::actorlessGrammar([
    'order.confirmed' => ':object was confirmed', // exact verb, not objectType.verb
]);
```

A singular activity with no recorded actor identity uses this template before
ordinary grammar. A named party or an actor whose model can no longer be
resolved still uses ordinary grammar. If no actorless entry matches, ordinary
grammar remains the fallback.

Keys are exact verbs, including dotted verbs. There are no wildcards or
aggregate forms. String templates cannot contain `:actor` or `:actors`.
Closures receive the activity and return finished text, as in
[Grammar](/deeper/grammar). Registrations merge by default; pass `merge: false`
to replace the actorless registry.
