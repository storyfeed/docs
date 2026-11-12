# Recording Value Changes

## Introduction

A manager renames the "Summer" menu to "Late Summer". The feed should say
"renamed Summer to Late Summer". Passing the two names as roles makes each
name a participant, so a search for a party named "Summer" finds a menu name.
The names are values, and the recipe records them that way.

Record the entity being renamed as the object. Bind its old and new names to
headline tokens so the names remain values throughout filtering and
serialization, and print exactly as the manager typed them.

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

## Binding the Names

Replace the definition with a headline that names a token for each value:

```php memo="routes/feed.php"
use App\Models\Menu;
use Storyfeed\Facades\Story;

Story::for(Menu::class)->verb('rename')
    ->headline(':actor renamed :old to :new');
```

Replace the route with this recording. The menu is still the object, and
[`bind()`](/basics/recording-activities#binding-literal-values) supplies each name:

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
        ->bind('old', $from)
        ->bind('new', $menu->name)
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
        bind: ['old' => $from, 'new' => $menu->name],
    );

    return back();
})->middleware('auth');
```
:::

<FeedExample :items="[valuesAfter]" expanded />

| Field | String Roles | Bindings |
|---|---|---|
| `actor` | the staff member | the staff member |
| `object` | the menu | the menu |
| `target` | a party named after the new name | empty |
| `context` | a party named after the old name | empty |
| `bindings` | empty | `old` and `new` names |

The headline has the same words in both examples. The second composition
keeps the menu's identity separate from its names.

Don't build the headline by concatenating the names into it, as in
`':actor renamed '.$from.' to '.$to`. A name is user-entered text: a menu
called `Brunch [weekends]` or `Specials :object` would be read as an optional
segment or a token. A bound value never enters the template, so it prints
exactly as entered, and the payload carries it in
[`bindings`](/reference/payload-contract#bound-values) beside the template's
`:old` and `:new`.

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
| Bindings | `[]` |

The bound composition creates no parties for the names. It does not remove
parties or change activities already recorded with the first composition.
`Storyfeed::feed()->involving($menu)` finds either activity by the menu model.
A party filter such as `involving('Counter menu')` finds the first composition.
It does not search the second activity's bound values.

### Doctor Findings

`storyfeed:doctor` lists the parties your activities use; see its
[`parties.*` findings](/reference/doctor-checks#parties). They do not decide whether
a name belongs in a binding.

## Choosing Participants and Values

Ask whether the thing has an identity you want to retrieve activities for or
list as a participant. A shop, document, or payment service does. A changed
name, destination email address, amount, date, or setting describes an event;
bind it to a headline token with `bind()`, and store it in `data` as well
when your own code needs to read it.

| Change or Detail | Participant | Bound Value |
|---|---|---|
| Rename or legal-name change | the entity being renamed | old and new names |
| Email delivery | the document or message | destination address |
| Payment | the payment or order | amount and payment method |
| Presentation change | the page or document | font and spacing settings |

[Assigning Roles](/basics/recording-activities#assigning-roles) defines the participants.
Use [Containers & Context](/recording/containers-and-context#choosing-between-target-and-context)
when the activity also needs a containing entity.

For a link's intended recipient, see
[A Link Sent to Someone](/cookbook/activities-without-an-actor#a-link-sent-to-someone),
which records the fetch without assigning the recipient as actor.
