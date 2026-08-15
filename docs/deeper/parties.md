# Parties & anonymous actors

<script setup>
import { who, where, doc, entity, activity } from '../.vitepress/theme/samples'

const synced = activity({
  id: 'pt1', verb: 'sync', icon: 'refresh-cw',
  published_at: '2026-08-14T13:55:00.000000Z',
  headline_template: ':actor synced :object to :target',
  actor: entity('storyfeed.party', '1', 'Concur Web Service', null),
  object: doc.expenseReportQ3, target: where.passwordCrackdown,
})
</script>

Two different things that both look like "not a user":

| | means | in the payload |
|---|---|---|
| **anonymous** | the actor is genuinely unknown | `actor: null` — the renderer supplies its own label |
| **party** | a named participant with no model in your app | an ordinary entity, `type: "storyfeed.party"`, real `label`, `url: null` |

## Parties

```php
$party = Storyfeed::party('Stripe');

Storyfeed::record('sync', $invoice, actor: $party);
```

<FeedStream :items="[synced]" :grouped="false" />

Parties work in **any** role — actor, object, target, or context:

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
