# Story classes

A Story is one class per meaningful activity type — its verb, headline, icon,
and aggregation, in one file:

```php
use App\Enums\ActivityVerb;
use App\Models\Document;
use Storyfeed\Grouping\Group;
use Storyfeed\Story;

class DocumentWasUploaded extends Story
{
    public string|array|null $objectType = Document::class;

    public string|FeedVerb|null $verb = ActivityVerb::Upload;

    public function headline(): string
    {
        return ':actor uploaded :object to :target';
    }

    public function icon(): ?string
    {
        return 'bi-file-earmark-arrow-up';
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

::: tip NAMING
`{Object}Was{Verbed}` reads well when the object is the patient
(`DocumentWasUploaded`). For reflexive activities, write what happened:
`MemberJoined`, not `MemberWasJoined`. Nothing consults the name at runtime.
:::

## Compilation

Stories compile into the underlying registries at boot — the same registries
the direct API writes (`Storyfeed::grammar()`, `aggregateGrammar()`,
`icons()`, …). Both layers are permanent: Stories are the convenience, the
registries are the substrate and escape hatch.

Cache the compiled manifest in production — it is wired into
`php artisan optimize`:

```bash
php artisan storyfeed:cache    # also runs on `optimize`
php artisan storyfeed:clear
```

::: warning
Running `optimize` before a test run caches config over `phpunit.xml`'s — if a
seeded test database seems to vanish, `storyfeed:clear` (or `optimize:clear`)
first.
:::

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

Lists every publish site in your app — including publishes the package never
wired — and what could publish but doesn't.
