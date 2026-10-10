# Parties & Anonymous Actors

## Introduction

An activity's actor can be a user or a **party**, such as a payment provider.
An **anonymous** activity has no recorded actor.

<script setup>
import { scene, role } from '../.vitepress/theme/world'
const system = scene.deeper.parties.system
const cancelled = { ...system, actor: { ...system.actor, label: 'Register' } }
const { anonymous } = scene.cookbook.actorless
</script>

|  | Means | In the Payload |
|---|---|---|
| **anonymous** | no recorded actor | `actor: null`; the headline uses the [anonymous headline](#anonymous-headlines) |
| **party** | a named participant with no model in your app | an entity with `type: "storyfeed.party"`, a `label`, and an optional external `link` |

<a id="parties"></a>

## Recording a Party

A scheduled command cancels unpaid orders. No user is signed in, so name the actor:

::: code-group
```php [Fluent Syntax] memo="app/Console/Commands/CancelUnpaidOrders.php"
<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Storyfeed\Facades\Storyfeed;

class CancelUnpaidOrders extends Command
{
    protected $signature = 'orders:cancel-unpaid';

    protected $description = 'Cancel the orders left unpaid at closing time';

    public function handle(): void
    {
        Order::whereNull('paid_at')->whereNull('cancelled_at')->each(function (Order $order) {
            $order->update(['cancelled_at' => now()]);

            Storyfeed::activity()
                ->by('Register') // [!code highlight]
                ->action('cancel', $order)
                ->publish();
        });
    }
}
```

```php [Named Arguments] memo="app/Console/Commands/CancelUnpaidOrders.php"
<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Storyfeed\Facades\Storyfeed;

class CancelUnpaidOrders extends Command
{
    protected $signature = 'orders:cancel-unpaid';

    protected $description = 'Cancel the orders left unpaid at closing time';

    public function handle(): void
    {
        Order::whereNull('paid_at')->whereNull('cancelled_at')->each(function (Order $order) {
            $order->update(['cancelled_at' => now()]);

            Storyfeed::record(
                verb: 'cancel',
                object: $order,
                actor: 'Register', // [!code highlight]
            );
        });
    }
}
```
:::

<FeedExample :items="[cancelled]" />

Storyfeed creates the party when its name is first used and reuses it for
later activities.

Without `by('Register')` or another actor default, this command records
an [anonymous activity](#recording-anonymous-activities).

### Linking a Party

Give a party a URL with `Party::make()`:

::: code-group
```php [Fluent Syntax] memo="app/Console/Commands/CancelUnpaidOrders.php" at="handle()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Models\Party;

Party::make('Register', url: 'https://example.com/register');

Storyfeed::activity()
    ->by('Register')
    ->action('cancel', $order)
    ->publish();
```

```php [Named Arguments] memo="app/Console/Commands/CancelUnpaidOrders.php" at="handle()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Models\Party;

Party::make('Register', url: 'https://example.com/register');

Storyfeed::record(
    verb: 'cancel',
    object: $order,
    actor: 'Register',
);
```
:::

<FeedExample :items="[{ ...cancelled, actor: { ...cancelled.actor, link: { href: 'https://example.com/register', modal: false, attributes: [] } } }]" />

The URL can appear in any party role, and Activity Streams output includes
it as `url`, including for the actor. Without a URL, the party remains unlinked.
Pass `url: null` to remove the link.

`Party::make()` creates the party or updates the one with the same key:

| Argument | Sets | Default |
|---|---|---|
| `name` | the party's label | required |
| `key` | the party's identity | the slug of `name` |
| `type` | its Activity Streams object type, an `ObjectType` or a string | `ObjectType::Service` |
| `data` | your own data stored on the party; replacing it keeps the URL | `[]` |
| `url` | its external link; `null` removes it | the stored link |

### Renaming a Party

A party's name is part of its default key, so a new name creates a new party.
Pass the existing key to rename the party instead, and record with the model
`Party::make()` returns:

::: code-group
```php [Fluent Syntax] memo="app/Console/Commands/CancelUnpaidOrders.php" at="handle()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Models\Party;

$register = Party::make('Front Register', key: 'register');

Storyfeed::activity()
    ->by($register)
    ->action('cancel', $order)
    ->publish();
```

```php [Named Arguments] memo="app/Console/Commands/CancelUnpaidOrders.php" at="handle()"
use Storyfeed\Facades\Storyfeed;
use Storyfeed\Models\Party;

$register = Party::make('Front Register', key: 'register');

Storyfeed::record(
    verb: 'cancel',
    object: $order,
    actor: $register,
);
```
:::

Activities already recorded with the party show the new name. A party name
passed as a string goes through `Party::make()` too, so after the rename
`by('Front Register')` creates a separate party and `by('Register')` renames it
back.

### Using Parties in Other Roles

A party can fill any role, not only the actor:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/DispatchOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class DispatchOrderController extends Controller
{
    public function __invoke(Order $order): RedirectResponse
    {
        $order->update(['dispatched_at' => now()]);

        Storyfeed::activity()
            ->action('dispatch', $order)
            ->to('Front desk')
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/DispatchOrderController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class DispatchOrderController extends Controller
{
    public function __invoke(Order $order): RedirectResponse
    {
        $order->update(['dispatched_at' => now()]);

        Storyfeed::record(
            verb: 'dispatch',
            object: $order,
            target: 'Front desk',
        );

        return back();
    }
}
```
:::

To retrieve a party model by name, call `Storyfeed::party('Front desk')`.
Storyfeed creates it if it does not exist.

<a id="declaring-parties"></a>

## Declaring Party Names

A misspelling such as `'Strpie'` creates a separate party from `'Stripe'`.
Declare allowed actor names to detect these mistakes:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Facades\Storyfeed;

Storyfeed::parties(['Stripe', 'Register']);
```

Undeclared names are handled according to the environment:

| Environment | An Undeclared Name |
|---|---|
| `local`, `testing` | throws `UndeclaredParty` with the call and allowed names |
| everywhere else | is ignored; the activity retains its default actor and `storyfeed:doctor` reports the name |

The list applies to [`Storyfeed::actor()`](/deeper/activity-scopes#sharing-an-actor)
and a [verb's `actor` method](/basics/stories#request-based-actors). The `by`
method does not check it. Without a list, any name is allowed. Names match by
slug, so `'Stripe'` and `'stripe'` identify the same party.

Set `parties.strict` in `config/storyfeed.php` to control whether undeclared
names throw an exception. The default, `null`, throws only in `local` and
`testing`.

<a id="app-wide-fallbacks"></a>

## Setting a Default Actor

```php memo="config/storyfeed.php"
'parties' => [
    // e.g. 'System' — a name for otherwise-anonymous publishes
    'fallback' => null,
],
```

Without a fallback or another resolved actor, the activity is anonymous.

<a id="resolving-the-default-actor"></a>

### Resolving the Default Actor

By default, Storyfeed records the authenticated user when you omit the actor.
To use another authentication guard, set `actor_resolver` to an invokable class
that returns the actor:

```php memo="app/Support/ResolveFeedActor.php"
<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ResolveFeedActor
{
    public function __invoke(): ?Model
    {
        return Auth::guard('admin')->user() ?? Auth::user();
    }
}
```

```php memo="config/storyfeed.php"
'actor_resolver' => App\Support\ResolveFeedActor::class,
```

When the resolver returns `null`, the fallback party applies.

## Recording Anonymous Activities

If you omit the actor, Storyfeed uses the authenticated user or a configured
default. To record no actor, even during an authenticated request, pass `null`
to the `by` method:

```php memo="Where the activity happens: a controller, an action, a listener"
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by(null)
    ->action('place', $order)
    ->to($shop)
    ->publish();
```

<FeedExample :items="[anonymous]" />

| Method | Actor |
|---|---|
| omit `by()` | resolved from the request or configured defaults |
| `->by(null)` or `->actor(null)` | anonymous |
| `->anonymously()` | anonymous, on an existing builder |
| `Storyfeed::anonymous()` | anonymous, on a new builder |
| `Storyfeed::record(..., anonymous: true)` | anonymous; also supplying a non-null `actor:` throws an exception |

Passing `actor: null` to `Storyfeed::record()` still allows the default actor
to apply. Use `anonymous: true` to record no actor with named arguments.

<a id="actorless-voice"></a>

### Anonymous Headlines

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('confirm')
    ->headline(':actor confirmed :object')
    ->anonymousHeadline(':object was confirmed');
```

An anonymous activity uses the anonymous headline. A party uses the ordinary
headline. Anonymous templates cannot contain `:actor`. You may also use a
closure, as described in
[The Feed File](/basics/the-feed-file#choosing-a-headline-per-activity).

If a verb never records an actor, you may omit `:actor` from its headline:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('expire')
    ->headline(':object expired at :target');
```

Omitting `:actor` from a headline does not remove the recorded actor.
