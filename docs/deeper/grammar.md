# Grammar

Grammar is the registry of templates the feed uses to render its activities'
headlines. A Story's `headline()` and `groups()` fill it; the direct form is:

<script setup>
import { who, where, doc, activity, group } from '../.vitepress/theme/samples'

const single = activity({ id: 'g1', verb: 'upload', glyph: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :object to :target',
  actor: who.ines, object: doc.annualReportV3, target: where.passwordCrackdown })

const repeated = group({ id: 'g2', verb: 'upload', axis: 'repeat', count: 3, glyph: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :count files to :target',
  actors: [who.ines], targets: [where.passwordCrackdown],
  objects: [doc.annualReportV3, doc.signagePlanRevB, doc.pricingTableFinal],
  distinct: { actors: 1, objects: 3, targets: 1 } })
</script>

```php
Storyfeed::grammar([
    'document.upload' => ':actor uploaded :object to :target',   // {objectType}.{verb}
]);

Storyfeed::aggregateGrammar([
    'actors.upload' => ':actors uploaded :count files to :target', // {axis}.{verb}
    'repeat.upload' => ':actor uploaded :count files to :target',
]);
```

<FeedStream :items="[single, repeated]" :grouped="false" />

Note the two key shapes: singular grammar is keyed by **object type and verb**;
aggregate grammar by **axis and verb**.

The key names the type; the template names the role. Your model names belong in
the key, never in the template:

```php
'document.upload' => ':user uploaded :document to :project',   // ✗ not tokens — these render as text
'document.upload' => ':actor uploaded :object to :target',     // ✓
```

For singular activities with no recorded actor, register a separate
[actorless voice](/deeper/parties#actorless-voice) keyed by exact verb.

## Tokens

| Singular Token | Plural Token | Entity Role |
|---|---|---|
| `:actor` | `:actors` | who acted |
| `:object` | `:objects` | what the activity acted on |
| `:target` | `:targets` | what the activity was directed at |
| `:context` | `:contexts` | the surrounding container |
| `:origin` | `:origins` | the source |
| `:result` | `:results` | the produced entity |
| `:instrument` | `:instruments` | the tool or service used |

Singular tokens resolve to one entity label. Plural tokens resolve to group
exemplars with overflow. [Rendering](/basics/rendering#headline-templates)
covers substitution and the `:count` and `:others` tokens.

## Tokens a Group Headline May Use

A group headline may only use tokens that are true of **every** member. A
singular role token is allowed only where the [axis pins it](/deeper/aggregation);
plural tokens are allowed everywhere, because a list of one is still true.

```php
// repeat = one actor, many documents
'repeat.revise' => ':actor made :count revisions to :object'   // ✗ which document?
'repeat.revise' => ':actor made :count revisions'              // ✓
'repeat.revise' => ':actor made :count revisions in :targets'  // ✓ a list is true of every member
```

`storyfeed:doctor` reports unsafe tokens as warnings; run it with
`--fail-on=warning` to make CI fail on them.

When no aggregate grammar resolves, the group tries the head member's singular
template. Pinned tokens keep their links. An unpinned role with one distinct
entity can also keep its token; with several entities, it can become a plain
noun when the axis pins their type. If neither fallback is safe, both headline
fields are null and [your renderer handles it](/basics/rendering#null-headline-groups).

Register the noun forms by morph alias:

```php
use Storyfeed\FeedNoun;

Storyfeed::nouns([
    'document' => 'document|documents', // morph alias, not a class name
    'clause' => FeedNoun::trans('nouns.clause'),
]);
```

Supply both forms; Storyfeed never inflects. Translation keys are wrapped in
`FeedNoun::trans()`, and locales with more plural forms can use extra pipe
segments. Without a registered noun, the fallback uses `item|items`.

The distinct entity count selects the form but is not printed:
`FeedNoun::form('document|documents', 7)` returns `documents`. Core substitutes
that text before returning the template, so `:actor uploaded :object` can arrive
as `:actor uploaded documents`. The substituted noun is plain text, with no
single entity to link to; `:actor` remains a linkable token.

## Members That Did Not Fill a Role

A plural token lists the members that filled the role. It does not promise every member filled it. An axis pins what its key names, and
a role outside the key is free to be absent on some members.

`targets` is keyed on actor, verb and day — target is not in the key at all. So
an activity with no target joins the same bucket as one with a target: it counts
towards `:count` and contributes no exemplar.

```php
// a targets group of 5 members, 2 of them carrying a target
'targets.comment' => ':actor commented on :count projects'  // ✗ five members, two projects
'targets.comment' => ':actor commented in :targets'         // ✓ names the two there are
```

Both lines are token-safe; the defect is in the noun the template puts beside
`:count`, which nothing validates. `node.count` is the member total;
`node.distinct.targets` counts only the members that filled the role. Where the
two disagree, some members filled no target.

## One List per Template

Both of these are token-safe; only one is readable:

```php
// actors axis — pins :target
':actors uploaded :objects in :targets'    // ✗ three lists, 180 characters of names
':actors uploaded :count files in :target' // ✓ one list, one count, one pinned role
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
Storyfeed::aggregateGrammar(['composite.upload' => ':actor uploaded :count files to :target']);
Storyfeed::grammar(['*.upload' => ':actor uploaded files to :target']);
```

`'*.*'` matches everything, including the gaps you would want reported.
:::

## Verbs Spanning Multiple Types

Aggregate grammar is keyed by **axis and verb**, while a Story is per
`(objectType, verb)`. When one verb spans several types — `create` on projects,
tasks, and clients — its aggregate keys have no single owner: whichever Story
declares `groups()` for `create` owns them all, and nothing indicates that to a
reader of the other Stories.

Pick one owner deliberately, or register the shared aggregate keys directly with
`aggregateGrammar()` where their scope is obvious.

## Icons

```php
Storyfeed::icons([
    'document.upload' => 'file-up',
    '*.comment' => 'message-circle',
]);
```

Same resolution order, resolved server-side. The icon vocabulary is entirely
yours — the payload ships whatever token you registered.

## Translation

Templates are plain strings, so they translate:

```php
Storyfeed::grammar([
    'document.upload' => __('feed.document_uploaded'),
]);
```

Because tokens are substituted by the renderer, word order stays the
translator's decision.
