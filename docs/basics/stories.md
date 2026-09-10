# Story classes

A Story is one class per meaningful activity type — its verb, headline, icon,
and aggregation, in one file:

```php
use App\Models\Document;
use Storyfeed\Contracts\FeedVerb;
use Storyfeed\Grouping\Group;
use Storyfeed\Story;

class DocumentWasUploaded extends Story
{
    public string|array|null $objectType = Document::class;

    public string|FeedVerb|BackedEnum|null $verb = 'upload';

    public function headline(): string
    {
        return ':actor uploaded :object to :target';
    }

    public function icon(): ?string
    {
        return 'file-up';
    }

    public function groups(): array
    {
        return [
            Group::byActors()->headline(':actors uploaded :count files to :target'),
            Group::repeat()->headline(':actor uploaded :count files to :target'),
        ];
    }
}
```

Generate and register:

```bash
php artisan make:story DocumentWasUploaded
```

```php
Storyfeed::stories([
    DocumentWasUploaded::class,
]);
```

`make:story --from-doctor` generates stubs for every gap doctor found.

## Anatomy

| member | required | |
|---|---|---|
| `$objectType` | yes | a model class (recommended), a morph alias, an array of either, or `'*'` for object-less activities |
| `$verb` | yes | a verb string or `FeedVerb` enum case |
| `headline()` | yes | the singular template |
| `icon()` | no | an icon token; resolution falls back through the icon registry |
| `groups()` | no | how this activity aggregates — see [Aggregation](/deeper/aggregation) |
| `$type` | no | AS2.0 type override; normally the enum's job |

Nothing is inferred from the class name — `$verb` and `$objectType` are both
explicit. The name is documentation; name it for the reader.

::: tip Naming
`{Object}Was{Verbed}` reads well when the object is the patient
(`DocumentWasUploaded`). For reflexive activities, write what happened:
`MemberJoined`, not `MemberWasJoined`. Nothing consults the name at runtime.
:::

## Caching

Stories compile into the registries the direct API writes, so both layers stay
supported. Cache the compiled manifest in production:

```bash
php artisan storyfeed:cache    # also runs on `optimize`
php artisan storyfeed:clear    # before a test run: cached config overrides phpunit.xml
                               # and can drop a seeded database
```

See [Testing](/deeper/testing#optimize-before-a-test-run-wipes-a-seeded-database).

## Strict grammar

```php
'grammar' => [
    'strict' => null,
],
```

Throws when publishing a `(type, verb)` pair no story or grammar entry covers —
the earliest possible catch for "the grammar was authored once and never grew".
`null` means strict in `local`/`testing` only; production always publishes.

## Inventory

```bash
php artisan storyfeed:stories
```

Inventories three things: your registered story definitions, the object/verb
pairs already recorded in the feed — including ones the package never wired,
listed as `(call site)` — and feedable models that publish nothing at all.

A `(call site)` row names a recorded pair, not a source location, so a publisher
that has never run is invisible to it. Find those in the source:

```bash
grep -rn "Storyfeed::record\|Storyfeed::activity\|::record(" app/
```
