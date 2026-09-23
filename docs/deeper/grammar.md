# Grammar

A group of activities needs its own headline, such as "placed 3 orders".
`Storyfeed::aggregateGrammar()` registers group headlines, keyed by the axis the
group formed on and the verb. Headlines for a single activity are in
[Headlines](/basics/headlines).

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

A single activity's headline is keyed by object type and verb; a group headline
by **axis and verb**. A Story's `groups()` writes the same entries. `:count` is
the number of members.

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

A singular token becomes one entity's label. A plural token becomes the group's
sample and an overflow count. [Rendering](/basics/rendering#groups)
covers substitution and the `:count` and `:others` tokens.

## Tokens a Group Headline May Use

A group headline may only use tokens that are true of **every** member. A
singular role token is allowed only where the [axis pins it](/deeper/aggregation);
a plural token is allowed everywhere.

```php
// repeat = one cook, many dishes
'repeat.reprice' => ':actor changed the price of :object :count times'  // ✗ which dish?
'repeat.reprice' => ':actor changed :count prices'                      // ✓
'repeat.reprice' => ':actor changed :count prices on :targets'          // ✓ a list is true of every member
```

`storyfeed:doctor` reports unsafe tokens as warnings; run it with
`--fail-on=warning` to make CI fail on them.

When no aggregate grammar resolves, the group tries the head member's singular
template. Pinned tokens keep their links. An unpinned role with one distinct
entity can also keep its token; with several entities, it can become a plain
noun when the axis pins their type. If neither fallback is safe, both headline
fields are null and [your renderer handles it](/basics/rendering#a-group-with-no-sentence).

Register the noun forms by morph alias:

```php
// app/Providers/AppServiceProvider.php, boot()
use Storyfeed\FeedNoun;

Storyfeed::nouns([
    'menu_item' => 'dish|dishes', // morph alias, not a class name
    'order' => FeedNoun::trans('nouns.order'),
]);
```

Supply both forms; Storyfeed never inflects. Translation keys are wrapped in
`FeedNoun::trans()`, and locales with more plural forms can use extra pipe
segments. Without a registered noun, the fallback uses `item|items`.

The distinct entity count selects the form but is not printed:
`FeedNoun::form('dish|dishes', 7)` returns `dishes`. Core substitutes the noun
into the template, so `:actor put :object on the menu` can arrive as
`:actor put dishes on the menu`. The noun is plain text with no link; `:actor`
is still a linkable token.

## Members That Did Not Fill a Role

A plural token lists the members that filled the role, which may not be every
member. A role outside the axis key can be empty on some members.

`targets` is keyed on actor, verb and day, not on target. An activity with no
target joins the same group as one with a target: it counts towards `:count`
and adds nothing to the sample.

```php
// a targets group of 5 members, 2 of them carrying a target
'targets.ask' => ':actor asked about :count dishes'  // ✗ five members, two dishes
'targets.ask' => ':actor asked about :targets'       // ✓ names the two there are
```

Both lines are token-safe; the first is wrong because of the noun beside
`:count`, which nothing checks. `node.count` is the member total, and
`node.distinct.targets` counts the distinct targets. When they differ, some
members have no target.

## One List per Template

Both of these are token-safe; only one is readable:

```php
// actors axis — pins :target
':actors placed :objects with :targets'    // ✗ three lists, 180 characters of names
':actors placed :count orders with :target' // ✓ one list, one count, one pinned role
```

Doctor reports unsafe tokens, but nothing reports length. Collapse every list
but one to `:count`.

## Finding the Keys You Have Not Written

Doctor reads the pairs actually recorded and the axes registered, and prints
the registrations they need:

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
are safe for that key**: an aggregate stub offers only the tokens its axis pins,
and a singular stub lists every role.

Two findings emit no stub. `roles` means a template names a role its activities
never carry, so the sentence needs rewriting. `aggregates.latent` means no read
mode shows that group, so a template for it would never render. See
[Doctor](/reference/doctor#groups-no-surface-can-read).

## Wildcards

Resolution falls back `{type}.{verb}` → `{type}.*` → `*.{verb}` → `*.*`.

### Composite Parents

::: warning
A composite's parent activity has **no object of its own**, so its headline
comes from the `*.{verb}` wildcard. With only `composite.{verb}` registered,
the parent's headline is blank. Register both:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::aggregateGrammar(['composite.publish' => ':actor put :count dishes on the menu']);
Storyfeed::grammar(['*.publish' => ':actor put dishes on the menu']);
```

`'*.*'` matches everything, including the missing headlines you would want
doctor to report.
:::

## Verbs Spanning Multiple Types

Aggregate grammar is keyed by **axis and verb**, while a Story is keyed by
object type and verb. When one verb spans several types, such as `ask` on
dishes, orders and categories, one Story's `groups()` sets the group headlines
for all of them, and the other Stories do not show it.

Choose one Story to own them, or register the shared keys directly with
`aggregateGrammar()`.
