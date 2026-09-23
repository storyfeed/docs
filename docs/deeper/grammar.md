# Grammar

A group of activities needs its own headline, such as "placed 3 orders".
`Storyfeed::aggregateGrammar()` registers group headlines.

<script setup>
import { who, where, orders, activity, group } from '../.vitepress/theme/samples'

const repeated = group({ id: 'g2', verb: 'place', axis: 'repeat', count: 3, glyph: 'shopping-bag',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor placed :count orders with :target',
  actors: [who.regular], targets: [where.kitchen],
  objects: [orders.first, orders.second, orders.third],
  distinct: { actors: 1, objects: 3, targets: 1 } })
</script>

## Registering a Group Headline

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::aggregateGrammar([
    'repeat.place' => ':actor placed :count orders with :target',    // {axis}.{verb}
    'actors.place' => ':actors placed :count orders with :target',
]);
```

<FeedExample context :items="[repeated]" />

A single activity's headline is keyed by object type and verb; a group
headline by **axis and verb**. `:count` is the number of activities in the
group.

## Plural Tokens

| Singular Token | Plural Token | Entity Role |
|---|---|---|
| `:actor` | `:actors` | who acted |
| `:object` | `:objects` | what the activity acted on |
| `:target` | `:targets` | what the activity was directed at |
| `:context` | `:contexts` | the surrounding container |
| `:origin` | `:origins` | the source |
| `:result` | `:results` | the produced entity |
| `:instrument` | `:instruments` | the tool or service used |

A plural token becomes a few of the group's names and a count of the rest.
[Rendering](/basics/rendering#groups) covers how.

## Tokens a Group Headline May Use

A group headline may only use tokens that are true of **every** activity in
it. A singular token is allowed only where the [axis pins it](/deeper/aggregation);
a plural token is allowed everywhere.

```php
// repeat = one cook, many dishes
'repeat.reprice' => ':actor changed the price of :object :count times'  // ✗ which dish?
'repeat.reprice' => ':actor changed :count prices'                      // ✓
'repeat.reprice' => ':actor changed :count prices on :targets'          // ✓ a list is true of every member
```

With no group headline registered, a group tries the single-activity
headline. A role that differs across the group becomes a plain noun, such as
"dishes", when all its entities are one type. Otherwise the group has no
headline, and [your renderer handles it](/basics/rendering#a-group-with-no-sentence).

Register the noun forms by morph alias:

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\FeedNoun;

Storyfeed::nouns([
    'menu_item' => 'dish|dishes', // morph alias, not a class name
    'order' => FeedNoun::trans('nouns.order'),
]);
```

Supply both forms; Storyfeed never inflects. Wrap translation keys in
`FeedNoun::trans()`; locales with more plural forms can add pipe segments.
Without a registered noun, the fallback is `item|items`.

The number of entities picks the form: `FeedNoun::form('dish|dishes', 7)`
returns `dishes`. So `:actor put :object on the menu` can arrive as
`:actor put dishes on the menu`. The noun is plain text; `:actor` is still a
link.

## Members That Did Not Fill a Role

A plural token lists only the activities that filled the role. `targets`
groups by actor, verb and day, so an activity with no target can join the
group: it counts towards `:count` but adds no name.

```php
// a targets group of 5 members, 2 of them carrying a target
'targets.ask' => ':actor asked about :count dishes'  // ✗ five members, two dishes
'targets.ask' => ':actor asked about :targets'       // ✓ names the two there are
```

The first line is wrong because of the noun beside `:count`, and nothing
checks that. When `node.count` and `node.distinct.targets` differ, some
activities have no target.

## One List per Template

Both of these are token-safe; only one is readable:

```php
// actors axis — pins :target
':actors placed :objects with :targets'    // ✗ three lists, 180 characters of names
':actors placed :count orders with :target' // ✓ one list, one count, one pinned role
```

Keep one list per template and collapse the others to `:count`.

## Finding the Keys You Have Not Written

Doctor prints the registrations your recorded activities need:

```bash
php artisan storyfeed:doctor --stubs
```

```php
Storyfeed::grammar([
    'order.place' => 'TODO :actor :object :target :context :origin :result :instrument',
]);

Storyfeed::aggregateGrammar([
    'repeat.place' => 'TODO :actor :target :count',
]);
```

Paste them in and write the sentences. Each `TODO` line **lists the tokens that
are safe for that key**.

## Wildcards

Resolution falls back `{type}.{verb}` → `{type}.*` → `*.{verb}` → `*.*`.

### Composite Parents

::: warning
A composite's parent activity has **no object of its own**, so its headline
comes from the `*.{verb}` wildcard, and is blank without one. Register both:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::aggregateGrammar(['composite.publish' => ':actor put :count dishes on the menu']);
Storyfeed::grammar(['*.publish' => ':actor put dishes on the menu']);
```

`'*.*'` would also match, but it also covers every headline you forgot to write.
:::

## Verbs Spanning Multiple Types

Group headlines are keyed by axis and verb, not type. When one verb spans
several types, such as `ask` on dishes and orders, one Story's `groups()` sets
the group headline for all of them. Choose one Story to own it, or register it
with `aggregateGrammar()`.
