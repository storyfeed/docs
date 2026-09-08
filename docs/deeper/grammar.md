# Grammar

Grammar is the registry of headline templates. Stories compile into it; you can
also write it directly:

```php
Storyfeed::grammar([
    'document.upload' => ':actor uploaded :object to :target',   // {objectType}.{verb}
]);

Storyfeed::aggregateGrammar([
    'actors.upload' => ':actors uploaded :count files to :target', // {axis}.{verb}
    'repeat.upload' => ':actor uploaded :count files to :target',
]);
```

Note the two key shapes: singular grammar is keyed by **object type and verb**;
aggregate grammar by **axis and verb**.

The key names the type; the template names the role. Your model names belong in
the key, never in the template:

```php
'document.upload' => ':user uploaded :document to :project',   // ✗ not tokens — these render as text
'document.upload' => ':actor uploaded :object to :target',     // ✓
```

## The anti-lie rule

A group headline may only use tokens that are true of **every** member. A
singular role token is allowed only where the [axis pins it](/deeper/aggregation);
plural tokens are allowed everywhere, because a list of one is still true.

```php
// repeat = one actor, many documents
'repeat.revise' => ':actor made :count revisions to :object'   // ✗ lies: which document?
'repeat.revise' => ':actor made :count revisions'              // ✓
'repeat.revise' => ':actor made :count revisions in :targets'  // ✓ plural is honest
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

## One plural list per template

Both of these are token-safe; only one is readable:

```php
':actors uploaded :objects in :targets'    // ✗ 180 characters of names
':actors uploaded :count files in :targets' // ✓ one list, one count
```

Doctor validates token safety, not readability. Keep the second collapsed
dimension as `:count`.

## Wildcards

Resolution falls back `{type}.{verb}` → `{type}.*` → `*.{verb}` → `*.*`.

### Composite parents need `*.{verb}`

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

## Verbs spanning multiple types

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
