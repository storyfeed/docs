# Grammar

A group of activities reads as one sentence, and that sentence is a template
too. Aggregate grammar is the registry of templates for group headlines,
keyed by the axis the group formed on and the verb. When you are done, every
group your feed can form has a sentence that is true of every member.

<script setup>
import { who, where, orders, activity, group } from '../.vitepress/theme/samples'

const repeated = group({ id: 'g2', verb: 'placed', axis: 'repeat', count: 3, glyph: 'shopping-bag',
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
    'repeat.placed' => ':actor placed :count orders with :target',    // {axis}.{verb}
    'actors.placed' => ':actors placed :count orders with :target',
]);
```

<FeedStream :items="[repeated]" :grouped="false" />

A singular [headline](/basics/headlines) is keyed by object type and verb; a
group headline by **axis and verb**. A Story's `groups()` writes the same
entries. `:count` is the member count.

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

A singular token resolves to one entity label. A plural token resolves to the
group's exemplars with an overflow count. [Rendering](/basics/rendering#groups)
covers substitution and the `:count` and `:others` tokens.

## Tokens a Group Headline May Use

A group headline may only use tokens that are true of **every** member. A
singular role token is allowed only where the [axis pins it](/deeper/aggregation);
plural tokens are allowed everywhere, because a list of one is still true.

```php
// repeat = one cook, many dishes
'repeat.menu.price_changed' => ':actor changed the price of :object :count times'  // ✗ which dish?
'repeat.menu.price_changed' => ':actor changed :count prices'                      // ✓
'repeat.menu.price_changed' => ':actor changed :count prices on :targets'          // ✓ a list is true of every member
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
`FeedNoun::form('dish|dishes', 7)` returns `dishes`. Core substitutes
that text before returning the template, so `:actor put :object on the menu`
can arrive as `:actor put dishes on the menu`. The substituted noun is plain text, with no
single entity to link to; `:actor` remains a linkable token.

## Members That Did Not Fill a Role

A plural token lists the members that filled the role. It does not promise every member filled it. An axis pins what its key names, and
a role outside the key is free to be absent on some members.

`targets` is keyed on actor, verb and day — target is not in the key at all. So
an activity with no target joins the same bucket as one with a target: it counts
towards `:count` and contributes no exemplar.

```php
// a targets group of 5 members, 2 of them carrying a target
'targets.discussion.asked' => ':actor asked about :count dishes'  // ✗ five members, two dishes
'targets.discussion.asked' => ':actor asked about :targets'       // ✓ names the two there are
```

Both lines are token-safe; the defect is in the noun the template puts beside
`:count`, which nothing validates. `node.count` is the member total;
`node.distinct.targets` counts only the members that filled the role. Where the
two disagree, some members filled no target.

## One List per Template

Both of these are token-safe; only one is readable:

```php
// actors axis — pins :target
':actors placed :objects with :targets'    // ✗ three lists, 180 characters of names
':actors placed :count orders with :target' // ✓ one list, one count, one pinned role
```

Two rules meet here and only one is enforced. Token safety is semantic: doctor
reports a token an axis cannot make true of every member. Length is editorial:
nothing reports it, and the fix is to collapse every dimension but one to
`:count`.

## Wildcards

Resolution falls back `{type}.{verb}` → `{type}.*` → `*.{verb}` → `*.*`.

### Composite Parents

::: warning
A composite's parent activity has **no object of its own**, so it resolves
through the wildcard — authoring only `composite.{verb}` leaves the parent
blank. Author both:

```php
// app/Providers/AppServiceProvider.php, boot()
Storyfeed::aggregateGrammar(['composite.menu.dish_live' => ':actor put :count dishes on the menu']);
Storyfeed::grammar(['*.menu.dish_live' => ':actor put dishes on the menu']);
```

`'*.*'` matches everything, including the gaps you would want reported.
:::

## Verbs Spanning Multiple Types

Aggregate grammar is keyed by **axis and verb**, while a Story is per
`(objectType, verb)`. When one verb spans several types — `discussion.asked` on dishes,
orders and categories — its aggregate keys have no single owner: whichever Story
declares `groups()` for `create` owns them all, and nothing indicates that to a
reader of the other Stories.

Pick one owner deliberately, or register the shared aggregate keys directly with
`aggregateGrammar()` where their scope is obvious.
