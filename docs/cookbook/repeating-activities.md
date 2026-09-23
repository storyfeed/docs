# Repeating Activities

When the same verb happens to the same object again, you can keep every
occurrence as its own row, or call `->replace()` so only the latest one stays.

<script setup>
import { who, where, orders, dishes, activity } from '../.vitepress/theme/samples'

const on = (id, verb, glyph, at, actor, object, template) => activity({ id, verb, glyph,
  published_at: at, headline_template: template, actor, object, target: where.kitchen })

const pricedTwice = [
  on('rp1', 'reprice', 'tag', '2026-08-14T14:32:00.000000Z', who.cook, dishes.kottu, ':actor changed the price of :object'),
  on('rp2', 'add', 'chef-hat', '2026-08-14T14:20:00.000000Z', who.cook, dishes.kottu, ':actor added a new dish, :object'),
]

const timeline = [
  on('rp3', 'place', 'shopping-bag', '2026-08-14T14:40:00.000000Z', who.regular, orders.first, ':actor placed :object'),
  on('rp4', 'confirm', 'circle-check', '2026-08-14T14:30:00.000000Z', who.cook, orders.first, ':actor confirmed :object'),
  on('rp5', 'place', 'shopping-bag', '2026-08-14T14:20:00.000000Z', who.regular, orders.first, ':actor placed :object'),
]

const pulse = [timeline[0], timeline[1]]
</script>

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()->by($cook)->action('reprice', $dish)->replace()->publish();   // replaces the earlier price change
Storyfeed::activity()->by($cook)->action('add', $dish)->publish();                // every new dish is its own row
```

After one new dish and two price changes:

<FeedExample context :items="pricedTwice" />

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::verbs([
    'reprice' => ActivityType::Update,
    'add' => ActivityType::Add,
    'place' => ActivityType::Create,
    'confirm' => ActivityType::Accept,
]);

Storyfeed::grammar([
    'menu_item.reprice' => ':actor changed the price of :object',
    'menu_item.add' => ':actor added a new dish, :object',
    'order.place' => ':actor placed :object',
    'order.confirm' => ':actor confirmed :object',
]);
```

## Which Verbs Replace

| Decision | Question | Consequence |
|---|---|---|
| occurrence | is this a retry of the same fact, or a new act? | an order placed again after an amendment is a new occurrence |
| retention | does this feed need every occurrence? | append for a full timeline; replace only when earlier ones may leave the feed |

Replacement publishes a new row and retires the earlier matches. It needs an
object id, and it keeps neither the original row's id nor its time. It does
not detect retries: an append-only publisher whose delivery can repeat needs
its own retry guard.

## A Full Timeline Beside a Latest-state Pulse

The order is placed, confirmed, amended, and placed again. Two ways to record
it:

| Request | Full Timeline | Latest-state Pulse, per Verb |
|---|---|---|
| first placement | append `placed` | replace `placed` |
| confirmation | append `confirmed` | replace `confirmed` |
| placed again after an amendment | append another `placed` | replace the earlier `placed` |
| visible rows afterward | first placement, confirmation, second placement | confirmation, second placement |

For the full timeline, each transition request runs this with its verb:

```php
// where the fact happens: $verb is 'place' or 'confirm'
Storyfeed::activity()->by($user)->action($verb, $order)->publish();

$timeline = Storyfeed::feed()->involving($order)->log()->get();
```

<FeedExample :items="timeline" />

For the pulse, each transition request instead runs:

```php
// where the fact happens: keeps only the latest row of each verb on the order
Storyfeed::activity()->by($user)->action($verb, $order)->replace()->publish();

$pulse = Storyfeed::feed()->involving($order)->live()->get();
```

<FeedExample :items="pulse" />

The pulse keeps one row per verb, not one row per order.

Replacement changes what is stored, so `log()` afterwards cannot recover the
full timeline. If you need both, keep the full timeline and build the pulse
from it without replacing.

## A Save-shaped Verb That Is Not Published at All

A save that changes nothing a reader would notice records no row at all. See
[Choosing When to Publish](/cookbook/choosing-when-to-publish).

## What `->replace()` Matches On

The object's type and id, and the verb. The actor, target, context and `data`
are not part of the match. So a single `status` verb carrying
`data: ['from' => …, 'to' => …]` replaces its own previous transition: seven
states in, one row out. With a verb per transition, each one replaces only
itself.

Replaced rows are soft-deleted by default: they leave every feed but stay in
storage until `storyfeed:prune` removes them. Set `storyfeed.replace.delete`
to `'force'` to delete them, with their grouping rows, in the publish
transaction. Their participant rows are deleted either way.

`->publishAndReplace()` is `->replace()->publish()` in one call.
