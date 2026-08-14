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

When no aggregate grammar resolves, the group falls back to the head member's
singular template **only if every token that template uses is pinned by the
axis** — otherwise both headline fields are null and
[your renderer handles it](/basics/rendering#null-headline-groups).

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

Aggregate grammar is keyed per **verb**, while a Story is per
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
