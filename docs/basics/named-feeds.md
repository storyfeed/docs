# Named feeds

A feed shown to a customer and a feed shown to an admin are not the same feed.
Declare each one once, by name, and enter it by that name:

```php
Storyfeed::feed('customer')->involving($order)->get();
```

## A declaration has two halves

```php
Storyfeed::feed('customer')->get();                     // every order in the system
Storyfeed::feed('customer')->involving($order)->get();  // this order
```

A name carries the **verbs**. It does not carry the **scope** — which rows the
surface may read is still `involving()` / `context()` / `query()`, exactly as on
any other builder.

The two halves fail in opposite directions:

| left out | what the reader gets |
|---|---|
| the verb allowlist | too little — a missing event in a visibly incomplete timeline |
| the scope | every order in the system, correctly verb-filtered and entirely plausible |

::: danger The scope is the half with no symptom
The first line below returns a complete, correct-looking customer timeline built
from other people's orders.

```php
Storyfeed::feed('customer')->get();                     // unscoped
Storyfeed::feed('customer')->involving($order)->get();  // scoped
```

[Feed classes](#feed-classes) move the scope into the declaration, so the
unscoped line cannot be written.
:::

## Declaring presets

A preset is a closure over the builder, registered at boot:

```php
// AppServiceProvider::boot()
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedBuilder;

Storyfeed::feeds([
    'customer' => fn (FeedBuilder $feed) => $feed->only([
        'order.placed', 'order.confirmed', 'order.ready',
        'order.out_for_delivery', 'order.delivered', 'order.paid',
    ])->log(),

    'kitchen' => fn (FeedBuilder $feed) => $feed->only(['order.*', 'photo.*'])->live(),

    'admin' => fn (FeedBuilder $feed) => $feed,
]);
```

Two entry points, both taking the name:

```php
Storyfeed::feed('customer')->involving($order)->get();
$order->storyfeed('customer')->get();
```

An unknown name throws `UnknownFeed`. A typo does not fall back to the
unfiltered feed.

The allowlist binds; the mode does not. `->log()` in a preset is a presentation
default, and any call site may override it with `->summary()`.

## `only()` and `except()`

The primitives work on any builder, with or without a name:

```php
Storyfeed::feed()->only(['order.placed', 'order.delivered'])->get();
Storyfeed::feed()->only(['order.*', OrderVerb::Paid])->get();
Storyfeed::feed()->except(['order.margin_note'])->get();
```

| | |
|---|---|
| accepts | verb strings, `FeedVerb` cases and backed enum cases, mixed in one list |
| `order.*` | trailing `*` is a prefix wildcard |
| an unrecognised verb | never throws — verbs are free-form strings, so an allowlist naming a verb nobody records is a query matching nothing. `storyfeed:doctor` reports it |
| `only([])` | throws. An empty allowlist renders as a feed saying nothing happened |
| repeat calls | intersect: `only(A)` then `only(B)` is `A ∩ B` |

Intersection is what makes a name unwidenable downstream — a call site can add
`->only()` on top of a preset and only ever cut further:

```php
// still just order.placed: the preset's allowlist is a floor
Storyfeed::feed('customer')->only(['order.placed', 'order.margin_note'])->get();
```

Excluded verbs are excluded from the query the whole read is built from, so
group counts and the distinct-role counts behind `:actors and 3 others`
recompute inside the filter. A group whose members are all excluded produces no
node.

When a filter is active, `query()` callbacks are wrapped in their own group
before it is applied — a top-level `orWhere` in a callback cannot readmit an
excluded verb. Feeds that never filter generate the SQL they always did.

## Feed classes

::: warning Available on `main`
Feed classes and `make:feed` land in the release after `v0.8.0-alpha.1`. On a
tagged install, presets and `only()` / `except()` are the whole surface.
:::

A closure runs at boot, before any order exists, so it can carry verbs but not a
subject. A class takes its subject as a constructor argument:

```php
namespace App\Feeds;

use App\Models\Order;
use Storyfeed\Feed;
use Storyfeed\FeedBuilder;

class CustomerFeed extends Feed
{
    public function __construct(protected Order $order) {}

    public function define(FeedBuilder $feed): void
    {
        $feed->only([
            'order.placed', 'order.confirmed', 'order.ready',
            'order.out_for_delivery', 'order.delivered', 'order.paid',
        ])->log();
    }

    protected function scope(FeedBuilder $feed): void
    {
        $feed->context($this->order);
    }
}
```

```php
CustomerFeed::make($order)->get();
```

Generate one with `php artisan make:feed Customer --subject=App\Models\Order`.

`make()` is `new static(...)`, so the subject is a typed constructor argument
and the language does the work: `CustomerFeed::make()` is an
`ArgumentCountError` and `CustomerFeed::make($user)` a `TypeError`. Both fail on
the first call, unconditionally. `new CustomerFeed` is flagged by PHPStan and
your IDE before it runs; `make()` forwards variadically, so a missing argument
there surfaces at runtime.

A class that takes a subject has no unscoped entry, including by name:

```php
CustomerFeed::make($order)->get();   // the only way in
Storyfeed::feed('customer');         // throws — this feed takes constructor arguments
```

### The two hooks

| hook | declares | may read constructor state |
|---|---|---|
| `define()` | what the feed is about — verbs, mode, limit | no |
| `scope()` | the values only a request supplies | yes |

`storyfeed:doctor` reads a customer feed's allowlist without having an order to
give it, so it runs `define()` against an instance built without the
constructor. A `define()` that reaches for `$this->order` produces a
`feeds.preset_failed` finding for that feed.

### Declared scope is locked

A role filter is a single-slot assignment — a second `involving()` replaces the
first — so the role a `scope()` binds cannot be rebound:

```php
CustomerFeed::make($order)->context($other);                     // throws
CustomerFeed::make($order)->only(['order.placed'])->summary();   // fine
```

Narrowing stays open: another role, `only()`, `query()`, a different mode. Only
`Feed` classes lock anything — `Storyfeed::feed()`, presets and
`$model->storyfeed()` behave as they always did.

A class that takes a subject and never binds it throws when built, so
hand-writing the file keeps the guarantee that `make:feed` writes:

```php
class CustomerFeed extends Feed
{
    public function __construct(protected Order $order) {}
    // ...and no scope(), so CustomerFeed::make($order) throws
}
```

### Global feeds

A feed with no subject declares no constructor and no `scope()`:

```php
class AdminFeed extends Feed
{
    public function define(FeedBuilder $feed): void
    {
        $feed->except(['order.margin_note'])->summary();
    }
}

AdminFeed::make()->get();
```

### Registration

```php
Storyfeed::feeds([
    'customer' => CustomerFeed::class,     // named explicitly
    AdminFeed::class,                      // name derived: 'admin'
    'kitchen' => fn (FeedBuilder $feed) => $feed->only(['order.*'])->live(),
]);
```

Both forms compile to one registry and nothing downstream can tell them apart.
`CustomerFeed::make($order)` works with an empty registry — registering is what
lets `storyfeed:doctor` check the feed.

Feeds hold closures and bound models rather than data, so they never enter the
compiled manifest and `storyfeed:cache` is a no-op for them.

## What a name is not

A feed is a query filter you route a surface through. It selects rows; it never
hides an activity, and the read path has no visibility layer underneath it.

- It does not know **who is asking**. `CustomerFeed::make($order)` is the same
  feed whichever customer requests it — that *this* customer may see *this*
  order is a policy question, in the controller where it always was.
- **It filters events, not fields.** An internal detail carried in a
  customer-visible verb's `data` bag is still in the payload. What keeps it out
  is what you record.
- **The write path is untouched.** Recording an internal verb stays legal.
- **Composite parents are not special-cased.** An allowlist admitting a story's
  member verbs but not the story's own verb drops the parent node, and the
  members read as solo items.
- **The [AS2.0 controller](/deeper/activity-streams) builds its own query** and
  is not filtered by a name. It ships disabled.

There is no `authorize()` hook on `Feed`.

## Coverage

`storyfeed:doctor` asserts that every verb is **decided** — named in the
allowlist or the denylist of at least one restricted feed:

```
⚠ Verb `order.margin_note` is named by no restricted feed, so nobody decided who
  may see it. Name it in the allowlist or the denylist of a feed.
```

The vocabulary it checks is your registered verbs plus the verbs actually
recorded, so a verb added carelessly six months from now becomes a
`--fail-on=warning` CI failure. An open feed — one calling neither `only()` nor
`except()` — decides nothing and contributes nothing. An app that never calls
`feeds()` gets no findings from the check. See
[Doctor](/reference/doctor#feed-coverage) for every finding it reports.

Two things weaken it, both worth knowing before you rely on it:

- **A wildcard admits verbs that do not exist yet.** `only(['order.*'])` takes
  `order.margin_note` the day someone records it, and the check counts it
  decided. Wildcards suit feeds allowed to grow; enumerate the feed you are
  defending.
- **`except()` admits tomorrow's verb** unless someone adds it. Prefer `only()`
  for a customer-facing surface.

```php
// the customer feed, enumerated
'customer' => fn (FeedBuilder $feed) => $feed->only([
    'order.placed', 'order.delivered', 'order.paid',
]),
```
