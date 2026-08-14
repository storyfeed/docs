# Verbs

Verbs are free-form strings in storage. An enum is the recommended authoring
layer — IDE-discoverable and typo-proof — but never a closed set:

```php
use Storyfeed\Concerns\AsFeedVerb;
use Storyfeed\Contracts\FeedVerb;

enum ActivityVerb: string implements FeedVerb
{
    use AsFeedVerb;

    case Upload = 'upload';
    case Comment = 'comment';
    case Confirm = 'confirm';
}
```

Register your vocabulary:

```php
Storyfeed::verbs(ActivityVerb::class);
```

With `AsFeedVerb`, every case doubles as a recording builder:

```php
ActivityVerb::Comment->actor($user)->object($comment)->in($project)->publish();
```

## Strict mode

```php
// config/storyfeed.php
'verbs' => [
    'strict' => null,
],
```

Strict mode throws when a recorded verb resolves to no registry entry — a
typo'd verb becomes an exception instead of a silently misfiled activity.
`null` (the default) means strict in `local`/`testing` and permissive
everywhere else; production always publishes.

## Activity Streams types

Each verb can map to an [Activity Streams 2.0](/deeper/activity-streams) type,
carried by the enum:

```php
public function activityType(): ActivityType|string|null
{
    return match ($this) {
        self::Upload => ActivityType::Add,
        self::Comment => ActivityType::Create,
        default => null,
    };
}
```

Unmapped verbs serialize as extension types and are preserved verbatim — AS2
mapping never gates recording, and unknown types are never dropped.

## Inspecting your vocabulary

```bash
php artisan storyfeed:verbs          # registered verbs, AS2 types, grammar/icon coverage
php artisan storyfeed:verbs --used   # compared against verbs actually recorded
```

`--used` is the drift check: verbs recorded but never registered (typos), and
verbs registered but never recorded (dead vocabulary).
