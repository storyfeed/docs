# Parties & Anonymous Actors

## Introduction

An activity's actor can be a user or a **party**, such as a payment provider.
An **anonymous** activity has no recorded actor.

<script setup>
import { scene, role } from '../.vitepress/theme/world'
const cancelled = scene.deeper.parties.system
const { anonymous } = scene.cookbook.actorless
</script>

|  | Means | In the Payload |
|---|---|---|
| **anonymous** | no recorded actor | `actor: null`; the headline uses the [anonymous headline](#anonymous-headlines) |
| **party** | a named participant with no model in your app | an entity with `type: "storyfeed.party"`, a `label`, and `url: null` |

<a id="parties"></a>

## Recording a Party

When {{ role.mall.label }} closes for the night, a scheduled Artisan command
cancels any {{ role.shop.label }} order left unpaid. The command runs from the
console, where no user is signed in, so it needs a named actor to identify who
cancelled the orders. Pass a string to the `by` method to use a party. Strings
can name parties in any role:

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
                ->by('Scoops Register') // [!code highlight]
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
                actor: 'Scoops Register', // [!code highlight]
            );
        });
    }
}
```
:::

<FeedExample :items="[cancelled]" />

Storyfeed creates the party when its name is first used and reuses it for
later activities.

Without `by('Scoops Register')` or another actor default, this command records
an [anonymous activity](#recording-anonymous-activities).

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

Storyfeed::parties(['Stripe', 'Scoops Register']);
```

Undeclared names are handled according to the environment:

| Environment | An Undeclared Name |
|---|---|
| `local`, `testing` | throws `UndeclaredParty` with the call and allowed names |
| everywhere else | is ignored; the activity retains its default actor and `storyfeed:doctor` reports the name |

The list applies to [`Storyfeed::actor()`](/deeper/activity-scopes#sharing-an-actor)
and a [verb's `actor` method](/deeper/stories#request-based-actors). The `by`
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

```php
Storyfeed::activity()
    ->by(null) // [!code highlight]
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
