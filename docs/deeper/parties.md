# Parties & Anonymous Actors

<script setup>
import { orders, party, activity } from '../.vitepress/theme/samples'

const paid = activity({
  id: 'pt1', verb: 'pay', glyph: 'credit-card',
  published_at: '2026-08-14T14:32:00.000000Z',
  headline_template: ':actor marked :object paid',
  actor: party.service,
  object: orders.first,
})
</script>

An activity's actor does not have to be a user. It can be a **party**, a
named participant with no model in your app, such as a payment provider. Or it
can be **anonymous**: nobody is known.

|  | Means | In the Payload |
|---|---|---|
| **anonymous** | the actor is genuinely unknown | `actor: null` — actorless grammar or a renderer fallback |
| **party** | a named participant with no model in your app | an ordinary entity, `type: "storyfeed.party"`, real `label`, `url: null` |

## Parties

```php
// where the fact happens: a controller, an action, a listener
$party = Storyfeed::party('Stripe');

Storyfeed::record(
    verb: 'pay',
    object: $order,
    actor: $party,
);
```

<FeedExample context :items="[paid]" />

A party can fill any role, not only the actor:

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->action('dispatch', $order)
    ->to(Storyfeed::party('Front desk'))
    ->publish();
```

`party()` finds or creates the party by name, so repeated calls reuse one row.

## Scoped Attribution

Inside a job or console command there is no authenticated user. Scope a block:

```php
// a job, or a console command
Storyfeed::as('System', function () {
    Storyfeed::record(
        verb: 'cancel',
        object: $order,
    );
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

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::actorlessGrammar([
    'confirm' => ':object was confirmed', // exact verb, not objectType.verb
]);
```

An activity recorded with no actor uses this template instead of its ordinary
grammar, when one matches. A party, or an actor whose model has since been
deleted, still uses ordinary grammar.

Keys are exact verbs, including dotted verbs, with no wildcards and no group
forms. A string template cannot contain `:actor` or `:actors`. A closure
receives the activity and returns finished text, as in
[Grammar](/deeper/grammar). Registrations merge; pass `merge: false` to replace
them.
