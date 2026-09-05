# One thing owns the verb and its grammar

Every verb the app publishes has a headline, every headline has a publisher,
and both are declared in the same file.

```php
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
}
```

The class is the one place the verb string is written. Publish through it:

```php
DocumentWasUploaded::activity($document)
    ->by($user)
    ->to($project)
    ->publish();
```

From an event, name the class:

```php
public function toFeedStory(): ?PendingStory
{
    return PendingStory::of(DocumentWasUploaded::class)
        ->by($this->user)
        ->object($this->document)
        ->to($this->document->project);
}
```

`PendingStory::of()` throws for a class that is not registered. Registration
is in [Story classes](/basics/stories).

## Where drift comes from

| verb written in | headline written in | drifts when |
|---|---|---|
| a call site | a grammar array | a verb is added at one and not the other |
| an enum | a grammar array | a case's value changes |
| a Story class | the same Story class | nothing |

## Catching it

```bash
php artisan storyfeed:doctor --only=grammar   # published pairs with no headline
php artisan storyfeed:verbs --used            # registered but never recorded, and recorded but never registered
php artisan storyfeed:stories                 # every publish site in the app
```

`grammar.strict` throws at the publish call in `local` and `testing` when the
pair has no headline. It is in [Story classes](/basics/stories#strict-grammar).

## A verb nothing publishes any more

Rows recorded under a retired verb keep their sentence only while the verb
stays registered:

```php
class DocumentWasPrinted extends Story
{
    // Nothing publishes `print` any more. Registered so rows recorded under it
    // keep their headline.
    public string|array|null $objectType = Document::class;

    public string|FeedVerb|BackedEnum|null $verb = 'print';

    public function headline(): string
    {
        return ':actor printed :object';
    }
}
```

`storyfeed:verbs --used` lists it as registered and not recorded, which is
the comment's claim in the terminal.
