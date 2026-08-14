# Verbs

A verb is a string. Record one and you have an activity:

```php
Storyfeed::activity()
    ->actor($user)
    ->verb('upload', $document)
    ->to($project)
    ->publish();
```

Verbs are free-form in storage, and nothing has to be registered to record one.
A registry adds grammar, icons, Activity Streams types, and drift detection.

## A better way: an enum

Same strings, typo-proof and IDE-discoverable, with the AS2 mapping carried
alongside:

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

Still not a closed set — storage keeps taking any string. With `AsFeedVerb`,
every case doubles as a recording builder:

```php
ActivityVerb::Comment->actor($user)->object($comment)->to($project)->publish();
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

Unmapped verbs serialize as extension types, preserved verbatim. AS2 mapping
never gates recording.

## Inspecting your vocabulary

```bash
php artisan storyfeed:verbs          # registered verbs, AS2 types, grammar/icon coverage
php artisan storyfeed:verbs --used   # compared against verbs actually recorded
```

`--used` is the drift check: verbs recorded but never registered (typos), and
verbs registered but never recorded (dead vocabulary).
