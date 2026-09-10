# Details

A detail is app data with a conventional form. The app writes its own block once,
at record time; any renderer that recognises the form draws it beneath the
headline, with no view of yours.

## Recording one

```php
// app/Models/Document.php
public function toFeed(): FeedEntity
{
    return FeedEntity::make(
        label: $this->name,
        data: Attachment::make(size: $this->bytes, mediaType: $this->mime),
    );
}
```

It comes back on the node, in that entity's `data`, exactly as it went in:

```json
{
  "$detail": "acme/attachment",
  "$v": 1,
  "size": 240128,
  "mediaType": "application/pdf"
}
```

Core does not read it, strip it, upgrade it, count it, or name it in a payload
key. An activity recorded from a detail is byte-identical to one recorded from
the array that detail produces.

| a detail is | a detail is **not** |
|---|---|
| a typed block beneath the sentence | part of the headline — that is a [grammar](/deeper/grammar) template |
| the app's value, at the app's key | a key core owns, or a key core validates |
| a form: an encoding, a pair, a passage | a component, or a place for markup |
| a leaf | nestable — a detail never contains another |

## Writing a form

```php
namespace App\Feed;

use Storyfeed\Concerns\HasPayload;
use Storyfeed\Contracts\FeedDetail;

final class Attachment implements FeedDetail
{
    use HasPayload;

    private function __construct(
        private readonly ?int $size,
        private readonly ?string $mediaType,
    ) {}

    public static function make(?int $size = null, ?string $mediaType = null): self
    {
        return new self($size, $mediaType);
    }

    public static function name(): string
    {
        return 'acme/attachment';
    }

    public static function version(): int
    {
        return 1;
    }

    public static function upgrade(array $payload, int $from): array
    {
        // Total: a row written by a NEWER version than this class still has to
        // render, because the row is in the database either way. Never throw.
        return [
            'size' => is_int($payload['size'] ?? null) ? $payload['size'] : null,
            'mediaType' => is_string($payload['mediaType'] ?? null) ? $payload['mediaType'] : null,
        ];
    }

    public function toPayload(): array
    {
        return [
            self::KEY => self::name(),
            self::VERSION => self::version(),
            'size' => $this->size,
            'mediaType' => $this->mediaType,
        ];
    }
}
```

`HasPayload` supplies `toArray()` from `toPayload()`. Override `toArray()` only
to add something that belongs in storage and not on the node.

### The two reserved keys

| key | constant | holds |
|---|---|---|
| `$detail` | `FeedDetail::KEY` | the form's name, verbatim |
| `$v` | `FeedDetail::VERSION` | the version that wrote the row |

Both are `$`-prefixed because `data` is the app's map, and a package writing
into someone else's map has to be unmistakable about which key is not theirs.
Core strips the reserved keys core owns and passes every other key through
untouched, which is what lets `$detail` survive the read path.

### Names

`vendor/form` — namespaced to whoever defines the vocabulary: `acme/attachment`,
`storyfeed-filament/change`. The name outlives every class that writes it, and
two libraries that both wanted the word "change" do not collide in a column.

Free-form, like verbs. Core never validates a name against anything, and has no
list to validate against.

### Versions are add-only

A row recorded today outlives the class that recorded it, so `version()` starts
at 1 on the first commit rather than the day a second shape appears — by then
the unversioned rows already exist.

**A missing `$v` is version 1. That is a definition, not a fallback.** It is the
reader's rule as much as the writer's: hand-written seeder arrays exist, and so
do rows written before a library added its version key. Reading a missing
version as "whatever is current" is silently right today and silently wrong the
day a version 2 lands, because those rows would skip the 1→2 upgrade with
nothing to notice it.

`upgrade()` runs at **read** time and is never written back, so every renderer
sees the current form and no view branches on `$v`.

## Where a detail lives

| on | recorded with | describes |
|---|---|---|
| an entity's snapshot | `FeedEntity::make(data: …)` in `toFeed()` | the noun — the same preview wherever that entity appears |
| an activity | `->data(…)` | the act — this row and no other |

A detail sits alongside the app's own keys, so a reader finds one by walking
`data` rather than by reading a fixed key. Keep it near the top: core's `details`
check and the Filament adapter both stop looking four levels in.

```php
Storyfeed::activity()
    ->by($user)
    ->action('download', $document)
    // A nested Arrayable is NOT converted — only the argument itself is. Call
    // ->toArray() on a detail that sits inside a map, or the column stores {}.
    ->data(['ip' => $ip, 'attachment' => Attachment::make(size: 240128)->toArray()])
    ->publish();
```

## The forms core owns

Two values in the same `data` column follow opposite versioning postures, and
the branch is one question: **does core own the key?**

| key | node key | who upgrades | does `$v` reach the renderer? |
|---|---|---|---|
| `$thread` | `thread` | core, on read | no |
| `$change` | `change` | core, on read | no |
| `$detail` | stays in `data` | the renderer | yes |

Core owns `$thread` and `$change`, so it can find them at a fixed key, upgrade
them, strip them out of `data` and emit one shape forever. A detail lands at an
**app-chosen** key inside the app's own map, so core cannot find it to normalize
it — which is why `$v` travels all the way to the renderer and the renderer
calls `upgrade()` before it draws.

`FeedThread` — set with [`->thread()`](/basics/recording#extras) — carries the
utterance a row is about and the size of the conversation around it. It does not
truncate: the consumer caps `text` at
whatever boundary its domain wants, and `truncated` only tells a renderer
whether to mark it. `FeedChange` carries before/after facts, both sides kept,
never a rendered diff.

## Forms that already exist

`storyfeed/filament` ships five and registers them for its own views. An app
writing its own owes nothing to any of them.

| name | is | keys |
|---|---|---|
| `storyfeed-filament/fields` | labelled rows | `rows[]` of `label`, `value`, `mono`, `missing` |
| `storyfeed-filament/excerpt` | a passage, and where it came from | `text`, `from`, `truncated` |
| `storyfeed-filament/change` | before → after, for one field or several | `changes[]` of `label`, `before`, `after` |
| `storyfeed-filament/file` | what an artefact is and how big | `name`, `size`, `mediaType` |
| `storyfeed-filament/markdown` | authored body text, as source | `content`, `mediaType` |

## What a renderer does with an unknown form

Draws nothing, and never an error — the same rule the read path already applies
to unknown verbs and to Activity Streams extension types. It covers version skew
too: an app on a newer vocabulary than the renderer reading it is a blank space,
not a broken feed.

So a renderer that finds a `$detail` it does not recognise skips it, and the
activity renders as it always would, minus the block.

## Seeing what is in the column

```bash
php artisan storyfeed:doctor --only=details
```

The check reports which forms are actually in `data`, and the two ways one goes
quiet without anything going wrong out loud: a map carrying `$v` with no
`$detail` for a renderer to dispatch on, and a form declaring version 2 on some
rows and nothing on others. It reports only what is knowable without a
vocabulary — core having a vocabulary is the thing this contract exists to
avoid. See [Doctor](/reference/doctor).
