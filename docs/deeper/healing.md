# Healing

A **healer** derives what a story should say today from the rows it came from,
and reconciles the feed against that. Run it and every story it covers is
either recorded, corrected, or left exactly as it is.

It exists so that composing an activity wrongly is recoverable. Roles, verbs and
grammar are decisions made early, when you know least about your own domain, and
a feed without a healer makes each of them permanent.

## A healer

```php
namespace App\Storyfeed;

use App\Models\Invitation;
use Storyfeed\Contracts\FeedHealer;
use Storyfeed\Healing\StoryCandidate;
use Storyfeed\Facades\Storyfeed;

class ArrivalHealer implements FeedHealer
{
    public function key(): string
    {
        return 'arrivals';
    }

    public function candidates(): iterable
    {
        foreach (Invitation::query()->whereNotNull('accepted_at')->lazy() as $invitation) {
            yield new StoryCandidate(
                label: "{$invitation->name} joined",
                story: Storyfeed::activity()
                    ->by($invitation->user)
                    ->action('joined', $invitation->user)
                    ->to($invitation->table)
                    ->publishedAt($invitation->accepted_at),
            );
        }
    }
}
```

Register it beside your feeds:

```php
Storyfeed::healers([ArrivalHealer::class]);
```

`candidates()` **writes nothing**. It describes the story it would publish, and
the command decides whether to.

## Running it

```bash
php artisan storyfeed:heal --dry-run
php artisan storyfeed:heal --only=arrivals
php artisan storyfeed:heal
```

Start with `--dry-run`. It walks every candidate and prints what it would do,
without touching a row.

```
arrivals   Dona joined                 record
arrivals   Sam joined                  replace   actor
arrivals   Ines joined                 unchanged
arrivals   Marcel joined               removed
```

## The four outcomes

A candidate is matched against the feed by **verb plus object** — the same key
`->replace()` supersedes on.

| outcome | when | what happens |
|---|---|---|
| `record` | no row on that key | published, dated from your source row |
| `replace` | a live row that differs | superseded, keeping the original `published_at` |
| `unchanged` | a live row that says the same thing | nothing |
| `removed` | only soft-deleted rows on that key | nothing, ever |

`removed` is the one to understand before you run this. A story someone deleted
stays deleted — a healer fills gaps, it never overrules a deletion. Core tells
the two apart without an app-side flag: a superseded row always has a live
sibling on its key, and a removed one never does.

## What "differs" compares

The story's own facts:

| compared | not compared |
|---|---|
| `verb` | `published_at` |
| all seven [entity roles](/basics/recording#the-roles) | entity snapshots |
| `data` | grouping rows |

`published_at` is excluded because a live publish stamps `now()` and a healer
derives your source row's clock; they differ by milliseconds on every story ever
recorded. Snapshots are excluded because a renamed dish is not a changed story.

`Storyfeed\Support\ActivityRoles::STORED` is the list, so a role added to the
package is compared without you editing anything.

## What it does not do

A healer does not decide policy. It cannot invent a story your sources do not
describe, and it will not delete an activity — a story whose source row is gone
is simply never a candidate, and the existing row stays until you remove it.

::: warning Healing rewrites settled history
Replacing a story bumps the feed's `sync_token`, so every accumulating client
resyncs — the same contract as
[`storyfeed:curate --rehash`](/reference/commands#rehash-when-the-grouping-recipe-changes-underneath-existing-rows).
A reader holding a cursor from before the run may see one empty page before
refetching. Prefer running it when the feed is quiet, and never schedule it
against a surface someone reads at a fixed hour.
:::

## Testing a healer

Assert **both** that the right stories exist and that the wrong ones are gone:

```php
it('re-derives arrivals and retires the old composition', function () {
    app(FeedHealer::class)->run();

    expect(Activity::where('verb', 'joined')->count())->toBe(1)
        ->and(Activity::where('verb', 'accepted')->count())->toBe(0);
});
```

The second assertion is the one that catches a half-done migration. A test
written only from the first passes happily with both compositions live.
