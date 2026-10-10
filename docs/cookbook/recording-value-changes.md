# Recording Value Changes

Record the entity being renamed as the object. Store its old and new names in
activity data so the names remain values throughout filtering and serialization.

<script setup>
import { valuesBefore, valuesAfter } from '../.vitepress/theme/recipes/values'
</script>

## Comparing String Roles

A string passed to `to` or `context` creates or reuses a named party. This
composition gives both names participant identities:

```php memo="routes/feed.php"
use App\Models\Menu;
use Storyfeed\Facades\Story;

// Before: the headline displays values stored as parties.
Story::for(Menu::class)->verb('rename')
    ->headline(':actor renamed :context to :target');
```

::: code-group
```php [Fluent Syntax] memo="routes/web.php"
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::patch('/menus/{menu}/name', function (Request $request, Menu $menu) {
    $input = $request->validate(['name' => ['required', 'string', 'max:100']]);
    $from = $menu->name;
    $menu->update(['name' => $input['name']]);

    Storyfeed::activity()
        ->by($request->user())
        ->action('rename', $menu)
        ->context($from) // Before: creates a party for the old name.
        ->to($menu->name) // Before: creates a party for the new name.
        ->publish();

    return back();
})->middleware('auth');
```

```php [Named Arguments] memo="routes/web.php"
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::patch('/menus/{menu}/name', function (Request $request, Menu $menu) {
    $input = $request->validate(['name' => ['required', 'string', 'max:100']]);
    $from = $menu->name;
    $menu->update(['name' => $input['name']]);

    Storyfeed::record(
        verb: 'rename',
        object: $menu,
        actor: $request->user(),
        target: $menu->name, // Before: creates a party for the new name.
        context: $from, // Before: creates a party for the old name.
    );

    return back();
})->middleware('auth');
```
:::

<FeedExample :items="[valuesBefore]" expanded />

## Storing the Names in Data

Replace the definition with a [dynamic headline](/basics/the-feed-file#dynamic-headlines)
that uses the recorded names:

```php memo="routes/feed.php"
use App\Models\Menu;
use Storyfeed\ActivityContext;
use Storyfeed\Facades\Story;

Story::for(Menu::class)->verb('rename')
    ->headline(fn (ActivityContext $activity) =>
        ':actor renamed '.$activity->string('from').' to '.$activity->string('to')
    );
```

Replace the route with this recording. The menu is still the object:

::: code-group
```php [Fluent Syntax] memo="routes/web.php"
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::patch('/menus/{menu}/name', function (Request $request, Menu $menu) {
    $input = $request->validate(['name' => ['required', 'string', 'max:100']]);
    $from = $menu->name;
    $menu->update(['name' => $input['name']]);

    Storyfeed::activity()
        ->by($request->user())
        ->action('rename', $menu)
        ->data(['from' => $from, 'to' => $menu->name])
        ->publish();

    return back();
})->middleware('auth');
```

```php [Named Arguments] memo="routes/web.php"
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::patch('/menus/{menu}/name', function (Request $request, Menu $menu) {
    $input = $request->validate(['name' => ['required', 'string', 'max:100']]);
    $from = $menu->name;
    $menu->update(['name' => $input['name']]);

    Storyfeed::record(
        verb: 'rename',
        object: $menu,
        actor: $request->user(),
        data: ['from' => $from, 'to' => $menu->name],
    );

    return back();
})->middleware('auth');
```
:::

<FeedExample :items="[valuesAfter]" expanded />

| Field | String Roles | Activity Data |
|---|---|---|
| `actor` | the staff member | the staff member |
| `object` | the menu | the menu |
| `target` | a party named after the new name | empty |
| `context` | a party named after the old name | empty |
| `data` | empty | `from` and `to` names |

The headline has the same words in both examples. The second composition
keeps the menu's identity separate from its names.

## Inspecting Parties

For a fresh database, run each composition separately with the same rename.
Retrieve parties without creating any:

```php memo="An Artisan Tinker session"
use Illuminate\Support\Str;
use Storyfeed\Models\Party;

$keys = array_map(Str::slug(...), ['Counter menu', 'Seasonal menu']);

Party::query()->whereIn('key', $keys)->orderBy('name')->pluck('name')->all();
```

| Composition | Party Query Result |
|---|---|
| String roles | `['Counter menu', 'Seasonal menu']` |
| Activity data | `[]` |

The data composition creates no parties for the names. It does not remove
parties or change activities already recorded with the first composition.
`Storyfeed::feed()->involving($menu)` finds either activity by the menu model.
A party filter such as `involving('Counter menu')` finds the first composition.
It does not search the second activity's `data` values.

### Doctor Findings

With parties in use and no `Storyfeed::parties()` declaration,
`storyfeed:doctor` reports `parties.undeclared_list` at **Info** severity.
It also reports each party used by an activity as `parties.used`, with its
name, key, and activity count. These findings list the recorded parties;
they do not determine whether a name should have been activity data.

The [declared-party list](/deeper/parties#declaring-party-names) guards scoped
and verb-default actors. It does not validate explicit `by`, `to`, or
`context` calls.

## Choosing Participants and Values

Ask whether the thing has an identity you want to retrieve activities for or
list as a participant. A shop, document, or payment service does. A changed
name, destination email address, amount, date, or setting describes an event;
store that value in `data` and include it through a dynamic headline.

| Change or Detail | Participant | Activity Data |
|---|---|---|
| Rename or legal-name change | the entity being renamed | old and new names |
| Email delivery | the document or message | destination address |
| Payment | the payment or order | amount and payment method |
| Presentation change | the page or document | font and spacing settings |

[Assigning Roles](/basics/recording#assigning-roles) defines the participants.
Use [Containers & Context](/deeper/context#choosing-between-target-and-context)
when the activity also needs a containing entity.

For a link's intended recipient, keep the recipient identity on the issued-link
record or in data. [Recording Signed-Link Access](/cookbook/recording-signed-link-access)
shows how to retrieve those events without assigning the recipient as actor.
