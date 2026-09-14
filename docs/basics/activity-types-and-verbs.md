# Activity Types & Verbs

<script setup>
import { who, where, doc, activity } from '../.vitepress/theme/samples'

const uploaded = activity({
  id: 'v1', verb: 'upload', glyph: 'file-up',
  published_at: '2026-08-14T14:30:00.000000Z',
  headline_template: ':actor uploaded :object to :target',
  actor: who.designer, object: doc.report, target: where.main,
})
</script>

Activity types are a way to classify activities, and are usually expressed as verbs denoting the action that occurred.

## Using Strings

<FeedStream :items="[uploaded]" :grouped="false" />

```php
// where the fact happens: a controller, an action, a listener
Storyfeed::activity()
    ->by($user)
    ->action('upload', $document) // [!code focus]
    ->to($project)
    ->publish();
```

These verbs are free-form strings, and can be anything at all.

## Using Enums

In practice, passing loose strings may lead to typos and drift as an application grows. A
common pattern is to define your verbs within an enum,

```php
namespace App\Enums;

enum ActivityVerb: string
{
    case Upload = 'upload';
    case Comment = 'comment';
    case Confirm = 'confirm';
}
```

which can then be decorated with Storyfeed's `AsFeedVerb` trait and `FeedVerb` interface,

```php
namespace App\Enums;

use Storyfeed\Concerns\AsFeedVerb; // [!code focus]
use Storyfeed\Contracts\FeedVerb; // [!code focus]

enum ActivityVerb: string implements FeedVerb // [!code focus]
{
    use AsFeedVerb; // [!code focus]

    case Upload = 'upload';
    case Comment = 'comment';
    case Confirm = 'confirm';
}
```

to allow fluent recording of activities using the enum:

```php
// where the fact happens: a controller, an action, a listener
ActivityVerb::Comment->by($user)
    ->object($comment)
    ->to($project)
    ->publish();
```