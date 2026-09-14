# Repeating Activities

Keep every occurrence in a timeline, or retain only the latest occurrence of
a verb on an object. Choose what the reader needs to revisit.

<script setup>
import { who, where, orders, dishes, activity } from '../.vitepress/theme/samples'

const on = (id, verb, glyph, at, actor, object, template) => activity({ id, verb, glyph,
  published_at: at, headline_template: template, actor, object, target: where.kitchen })

const pricedTwice = [
  on('rp1', 'menu.price_changed', 'tag', '2026-08-14T14:32:00.000000Z', who.cook, dishes.kottu, ':actor changed the price of :object'),
  on('rp2', 'menu.dish_added', 'chef-hat', '2026-08-14T14:20:00.000000Z', who.cook, dishes.kottu, ':actor added a new dish, :object'),
]

const timeline = [
  on('rp3', 'placed', 'shopping-bag', '2026-08-14T14:40:00.000000Z', who.regular, orders.first, ':actor placed :object'),
  on('rp4', 'confirmed', 'circle-check', '2026-08-14T14:30:00.000000Z', who.cook, orders.first, ':actor confirmed :object'),
  on('rp5', 'placed', 'shopping-bag', '2026-08-14T14:20:00.000000Z', who.regular, orders.first, ':actor placed :object'),
]

const pulse = [timeline[0], timeline[1]]
</script>

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()->by($cook)->action('menu.price_changed', $dish)->replace()->publish();   // replaces the earlier price change
Storyfeed::activity()->by($cook)->action('menu.dish_added', $dish)->publish();                // every new dish is its own row
```

After one new dish and two price changes:

<FeedExample context :items="pricedTwice" />

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::verbs([
    'menu.price_changed' => ActivityType::Update,
    'menu.dish_added' => ActivityType::Add,
    'placed' => ActivityType::Create,
    'confirmed' => ActivityType::Accept,
]);

Storyfeed::grammar([
    '*.menu.price_changed' => ':actor changed the price of :object',
    '*.menu.dish_added' => ':actor added a new dish, :object',
    'order.placed' => ':actor placed :object',
    'order.confirmed' => ':actor confirmed :object',
]);
```

## Which Verbs Replace

| Decision | Question | Consequence |
|---|---|---|
| occurrence | is this a retry of the same fact, or a new act? | an order placed again after an amendment is a new occurrence |
| identity | should all occurrences share one object/verb pair? | `replace()` matches object type, object id, and verb; actor, target, context, and `data` do not distinguish occurrences |
| retention | does this feed need every occurrence? | append for a full timeline; replace only when earlier occurrences may leave the feed |

A price change can be a second fact worth retaining. A dish added once can
use replacement to make replay leave one visible row. The
verb's shape alone does not decide either policy.

Replacement publishes a new row and retires earlier matches. It requires an
object id. It does not detect retries or preserve the original row's id and
time. An append-only publisher needs its own durable occurrence identity and
retry guard if delivery can repeat.

## A Full Timeline Beside a Latest-state Pulse

The order is placed, confirmed, amended, and placed again. These are two
alternative recording policies for the same sequence:

| Request | Full Timeline | Latest-state Pulse, per Verb |
|---|---|---|
| first placement | append `placed` | replace `placed` |
| confirmation | append `confirmed` | replace `confirmed` |
| placed again after an amendment | append another `placed` | replace the earlier `placed` |
| visible rows afterward | first placement, confirmation, second placement | confirmation, second placement |

For the full timeline, each transition request runs this with its verb:

```php
// $verb is 'placed' or 'confirmed'; the app guards retries by occurrence id.
Storyfeed::activity()->by($user)->action($verb, $order)->publish();

$timeline = Storyfeed::feed()->involving($order)->log()->get();
```

<FeedExample :items="timeline" />

For the pulse, each transition request instead runs:

```php
// Deliberately retain only the latest occurrence of EACH verb on this order.
Storyfeed::activity()->by($user)->action($verb, $order)->replace()->publish();

$pulse = Storyfeed::feed()->involving($order)->live()->get();
```

<FeedExample :items="pulse" />

The pulse keeps the latest confirmation as well as the latest placement; it
is not a single current-status row. The second placement is new news, even
though this policy removes the first from the feed.

Replacement affects stored activities, not just one reader. Reading `log()`
after replacement cannot recover the full timeline. If both surfaces need to
coexist, retain the complete history separately or build the pulse from the
retained occurrences without replacing them. Superseded rows are soft-deleted
by default; `storyfeed.replace.delete = 'force'` hard-deletes them. See
[Repeating Activities](/cookbook/repeating-activities#what-replace-matches-on).

## A Save-shaped Verb That Is Not Published at All

A save that changes nothing a reader would notice has no row, replaced or
otherwise. See [Choosing when to publish](/cookbook/choosing-when-to-publish).

## What `->replace()` Matches On

The object and the verb. `data` is not part of the key, so a single
`status.changed` verb carrying `data: ['from' => …, 'to' => …]` supersedes its
own previous transition: seven states in, one row out. A verb per transition
keeps each one idempotent against itself and inert toward its neighbours.

The superseded rows are soft-deleted by default. They leave every feed read
but stay in storage with `deleted_at` set until `storyfeed:prune` removes them.
Set `storyfeed.replace.delete` to `'force'` to delete them, with their grouping
and participant rows, inside the publish transaction. Participant rows go in
either mode.

`->publishAndReplace()` is `->replace()->publish()` in one call.
