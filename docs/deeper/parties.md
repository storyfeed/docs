# Parties & anonymous actors

<script setup>
import { who, where, doc, entity, activity } from '../.vitepress/theme/samples'

const synced = activity({
  id: 'pt1', verb: 'sync', glyph: 'refresh-cw',
  published_at: '2026-08-14T13:55:00.000000Z',
  headline_template: ':actor synced :object to :target',
  actor: entity('storyfeed.party', '1', 'Concur Web Service', null),
  object: doc.expenseReportQ3, target: where.passwordCrackdown,
})
</script>

Two different things that both look like "not a user":

| | means | in the payload |
|---|---|---|
| **anonymous** | the actor is genuinely unknown | `actor: null` — actorless grammar or a renderer fallback |
| **party** | a named participant with no model in your app | an ordinary entity, `type: "storyfeed.party"`, real `label`, `url: null` |

## Parties

```php
$party = Storyfeed::party('Stripe');

Storyfeed::record('sync', $invoice, actor: $party);
```

<FeedStream :items="[synced]" :grouped="false" />

Parties work in **any** role — actor, object, target, context, origin, result, or instrument:

```php
Storyfeed::activity()
    ->action('notify', $invoice)
    ->to(Storyfeed::party('Accounts Payable'))
    ->publish();
```

`party()` resolves-or-creates by name, so repeated calls reuse the row.

## Scoped attribution

Inside a job or console command there is no authenticated user. Scope a block:

```php
Storyfeed::as('System', function () {
    Storyfeed::record('sync', object: $invoice);
});
```

A string becomes a party; a model is used directly. An explicit `->actor()`
still wins inside the scope, and the previous resolver is restored even if the
callback throws.

## App-wide fallbacks

```php
'parties' => [
    'fallback' => null,      // e.g. 'System' — a name for otherwise-anonymous publishes
],

'actor_resolver' => null,    // an invokable class; null = the authenticated user
```

With no fallback, unresolvable publishes are anonymous.

## Actorless voice

::: tip
`actorlessGrammar()` is not in a tagged release. An install pinned to v0.9.0 or
earlier resolves ordinary grammar for an actorless activity.
:::

```php
// AppServiceProvider::boot()
Storyfeed::actorlessGrammar([
    'confirm' => ':object was confirmed', // exact verb, not objectType.verb
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
