# Recording Connected App Writes

When an operator uses a connected app to create or change a record, record the
operator as the actor and the app as the instrument. Keep who authorised the
write in a companion audit entry, and retrieve everything done through the app
with the instrument filter.

<script setup>
import { scene } from '../.vitepress/theme/world'
const { business, audit } = scene.cookbook.delegated
</script>

## Choosing the Actor and Instrument

For a deliberate operator command, record the operator as actor and the
connected app as instrument when your app treats the operator as performing
the requested action. Choose roles for the fact the activity records:

| Execution | Actor | Instrument | Authorization |
|---|---|---|---|
| An operator commands a connected app to create a record | operator | connected app | retain the authorizer and token owner separately |
| An app independently creates a record | connected app | a separate tool, if used | retain the authorizer and token owner separately |
| A person approves another person's work | person who performed the work | tool used, if any | the approval record identifies the approver; see [Recording an Authoriser](/cookbook/an-authoriser-who-is-not-an-actor) |

A token owner is not automatically the performer. Storyfeed has no built-in
authorizer role. Store authorization in your app's audit record and copy
relevant event-time values into activity data. A connected app with its own
model can be [feedable](/basics/feedable-models); a service without a model can
be a [party](/deeper/parties#using-parties-in-other-roles).

Use `create` when the record is created and `update` or `edit` when it changes.
The transport belongs in the instrument or activity data. See
[Choosing a Verb](/cookbook/choosing-a-verb).

## Recording a Companion Audit Entry

Define different headlines for the business record and the audit entry:

```php memo="routes/feed.php"
use App\Models\AuditEntry;
use App\Models\MenuItem;
use Storyfeed\Facades\Story;

Story::for(MenuItem::class)->verb('create')
    ->headline(':actor created :object using :instrument');

Story::for(AuditEntry::class)->verb('create')
    ->headline(':actor recorded :object for :target using :instrument');
```

The action creates a menu item and a mandatory audit entry. `MenuItem`,
`ConnectedApp` and `AuditEntry` implement `Feedable`; the audit entry labels
its own record. The audit model casts `before` and `after` to arrays and
allows the attributes shown below:

::: code-group
```php [Fluent Syntax] memo="app/Actions/CreateMenuItem.php"
<?php

namespace App\Actions;

use App\Models\AuditEntry;
use App\Models\ConnectedApp;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Storyfeed\Facades\Storyfeed;

class CreateMenuItem
{
    public function handle(
        User $operator,
        User $authoriser,
        User $tokenOwner,
        ConnectedApp $app,
        array $attributes,
    ): MenuItem {
        // The caller has authenticated the app and authorized this command.
        return DB::transaction(function () use (
            $operator, $authoriser, $tokenOwner, $app, $attributes,
        ) {
            $item = MenuItem::create($attributes);
            $facts = [
                'operation' => 'create',
                'before' => null,
                'after' => $item->only('name'),
                'tool' => 'create_menu_item',
                'authoriser_id' => $authoriser->getKey(),
                'token_owner_id' => $tokenOwner->getKey(),
            ];
            $entry = AuditEntry::create([
                ...$facts,
                'subject_type' => $item->getMorphClass(),
                'subject_id' => $item->getKey(),
            ]);

            // If a domain event publishes this fact, keep that as its only site.
            Storyfeed::activity()
                ->by($operator)
                ->action('create', $item)
                ->using($app)
                ->publish();

            Storyfeed::activity()
                ->by($operator)
                ->action('create', $entry)
                ->to($item)
                ->using($app)
                ->data($facts)
                ->publish();

            return $item;
        });
    }
}
```

```php [Named Arguments] memo="app/Actions/CreateMenuItem.php"
<?php

namespace App\Actions;

use App\Models\AuditEntry;
use App\Models\ConnectedApp;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Storyfeed\Facades\Storyfeed;

class CreateMenuItem
{
    public function handle(
        User $operator,
        User $authoriser,
        User $tokenOwner,
        ConnectedApp $app,
        array $attributes,
    ): MenuItem {
        // The caller has authenticated the app and authorized this command.
        return DB::transaction(function () use (
            $operator, $authoriser, $tokenOwner, $app, $attributes,
        ) {
            $item = MenuItem::create($attributes);
            $facts = [
                'operation' => 'create',
                'before' => null,
                'after' => $item->only('name'),
                'tool' => 'create_menu_item',
                'authoriser_id' => $authoriser->getKey(),
                'token_owner_id' => $tokenOwner->getKey(),
            ];
            $entry = AuditEntry::create([
                ...$facts,
                'subject_type' => $item->getMorphClass(),
                'subject_id' => $item->getKey(),
            ]);

            // If a domain event publishes this fact, keep that as its only site.
            Storyfeed::record(
                verb: 'create',
                object: $item,
                actor: $operator,
                instrument: $app,
            );

            Storyfeed::record(
                verb: 'create',
                object: $entry,
                actor: $operator,
                target: $item,
                data: $facts,
                instrument: $app,
            );

            return $item;
        });
    }
}
```

:::

<FeedExample :items="[business, audit]" expanded />

For an edit, capture the item's values before the update and its values
afterward in the audit entry.

Keep one publication site for the business activity. If a domain event
already publishes the menu item's creation, pass the operator and app to that
event and leave only the audit publication in this action. See
[Choosing When to Publish](/cookbook/choosing-when-to-publish#choosing-a-publish-site).

The application owns atomic persistence of its business record and mandatory
audit ledger. This transaction requires those models to share a database
connection. Queued or after-commit feed publication is separate from that
ledger requirement. Filtering a display feed does not make the ledger atomic.

## Filtering by App Instrument

To retrieve activities performed using one connected app, filter by the
instrument role:

```php memo="routes/web.php"
use App\Models\ConnectedApp;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

// Apply the app's authorization middleware to this route.
Route::get('/connected-apps/{app}/activity', function (ConnectedApp $app) {
    return Storyfeed::feed()
        ->instrument($app)
        ->log()
        ->get();
});
```

<FeedExample :items="[audit, business]" />

The instrument filter retrieves both records, even when their actors differ.
An `app_name` value in data does not fill the instrument role.
`involving($app)` is broader: it also matches the app in any other role.
To display only business records while retaining audit activities, filter by
the object type:

```php memo="routes/web.php"
use App\Models\ConnectedApp;
use App\Models\MenuItem;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

// Apply the app's authorization middleware to this route.
Route::get('/connected-apps/{app}/activity', function (ConnectedApp $app) {
    return Storyfeed::feed()
        ->instrument($app)
        ->objectType(MenuItem::class)
        ->log()
        ->get();
});
```

<FeedExample :items="[business]" />
