# Recording Activities

<script setup>
import { scene, group } from '../.vitepress/theme/world'

// A price change draws no card: the item's details would show today's price, not the change.
const recorded = scene.basics.recording.priced
const priced = { ...recorded, object: { ...recorded.object, body: null }, data: { from: 275, to: 295 } }
// The same change, imported with a date from long ago.
const backdated = { ...priced, published_at: scene.distant.published_at }
// The same catalogue photos, recorded together in one request instead of separately.
const photos = scene.basics.recording.photos
const composite = group({
  id: 'recording-composite', verb: 'upload', axis: 'composite', count: photos.length,
  glyph: photos[0].glyph, published_at: photos[0].published_at,
  headline_template: ':actor uploaded :count photos',
  actors: [photos[0].actor], objects: photos.map(node => node.object),
  distinct: { actors: 1, objects: photos.length },
})
</script>

## Introduction

An activity is a verb plus the models it involves. You record one with an
explicit call, wherever the fact happens: an action, an observer, an event
listener.

<a id="the-builder"></a>

## Publishing Activities

<a id="fluent-recording"></a>

The builder reads in the order of the headline it produces:

::: code-group
<<< @/snippets/publish-from-controller.php {php memo="app/Http/Controllers/OrderController.php"} [Fluent Syntax]
<<< @/snippets/publish-from-controller.named-arguments.php {php memo="app/Http/Controllers/OrderController.php"} [Named Arguments]
:::

<FeedExample :items="[scene.order]" />

The first argument to `action()` is the **verb**: a plain string naming what
happened. `place` is this app's own word, not one the package knows. The stored
verb is the string you pass, and [The Feed File](/basics/the-feed-file) gives it
the headline the feed prints.

<a id="named-arguments"></a>

`Storyfeed::record()` records the same activity in one call, with each role as
a named argument.

<a id="roles"></a>

## Assigning Roles

| Role | Question It Answers | Example |
|---|---|---|
| `actor` | who did it | the customer |
| `object` | what it was done to | the order |
| `target` | what the act was directed at | the shop |
| `context` | where it happened | the surrounding container |
| `origin` | where it came from | the source of an accepted invitation |
| `result` | what it produced | a receipt, a generated artifact |
| `instrument` | what it happened via | the device an order was taken on |

Direction decides the role. The same tablet is a `target` for an order sent
**to** it and an `instrument` for an order taken **on** it.

<a id="reading-as-a-sentence"></a>

### Role Aliases

Each role has a setter named for it: `actor()`, `object()`, `target()`,
`context()`, `origin()`, `result()` and `instrument()`; `verb()` sets the verb.
Aliases let the call site read as the sentence:

| Alias | Sets | Reads As |
|---|---|---|
| `->by()` | `actor` | who acted |
| `->action()` | `verb` and `object` | what they did, to what |
| `->using()` | `instrument` | what they acted via |
| `->resulting()` | `result` | what they produced |
| `->to()` `->for()` `->on()` `->with()` `->into()` `->in()` `->from()` | `target` | what it was aimed at |

An alias and its setter record the same activity.

<a id="the-actor"></a>

## Assigning the Actor

Omit the actor and the authenticated user is recorded. A queued job or a
scheduled command has no authenticated user, so name the actor:

::: code-group
```php [Fluent Syntax] memo="app/Jobs/PlaceScheduledOrder.php" at="handle()"
Storyfeed::activity()
    ->by($this->order->customer)
    ->action('place', $this->order)
    ->to($this->order->shop)
    ->publish();
```

```php [Named Arguments] memo="app/Jobs/PlaceScheduledOrder.php" at="handle()"
Storyfeed::record(
    verb: 'place',
    object: $this->order,
    actor: $this->order->customer,
    target: $this->order->shop,
);
```
:::

<FeedExample :items="[scene.order]" />

When nothing names an actor and no user is authenticated, the activity is
recorded without one.

## Adding Activity Data

`->data()` adds values to the activity itself. They are stored with the
activity and returned in its `data` when the feed is read:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/MenuItemPriceController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePriceRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class MenuItemPriceController extends Controller
{
    public function update(
        UpdatePriceRequest $request,
        MenuItem $product,
    ): RedirectResponse {
        $from = $product->price;

        $product->update(['price' => $request->integer('price')]);

        Storyfeed::activity()
            ->by($request->user())
            ->action('reprice', $product)
            ->data(['from' => $from, 'to' => $product->price])
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/MenuItemPriceController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePriceRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class MenuItemPriceController extends Controller
{
    public function update(
        UpdatePriceRequest $request,
        MenuItem $product,
    ): RedirectResponse {
        $from = $product->price;

        $product->update(['price' => $request->integer('price')]);

        Storyfeed::record(
            verb: 'reprice',
            object: $product,
            actor: $request->user(),
            data: ['from' => $from, 'to' => $product->price],
        );

        return back();
    }
}
```
:::

<FeedExample :items="[priced]" expanded />

## Setting the Publication Time

`->publishedAt()` backdates an activity, for imports and backfills:

::: code-group
```php [Fluent Syntax] memo="app/Console/Commands/ImportPriceHistory.php"
<?php

namespace App\Console\Commands;

use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Console\Command;
use Storyfeed\Facades\Storyfeed;

class ImportPriceHistory extends Command
{
    protected $signature = 'menu:import-prices {file}';

    public function handle(): void
    {
        $rows = json_decode(file_get_contents($this->argument('file')), true);

        foreach ($rows as $row) {
            Storyfeed::activity()
                ->by(User::findOrFail($row['user_id']))
                ->action('reprice', MenuItem::findOrFail($row['menu_item_id']))
                ->data(['from' => $row['from'], 'to' => $row['to']])
                ->publishedAt($row['changed_at'])
                ->publish();
        }
    }
}
```

```php [Named Arguments] memo="app/Console/Commands/ImportPriceHistory.php"
<?php

namespace App\Console\Commands;

use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Console\Command;
use Storyfeed\Facades\Storyfeed;

class ImportPriceHistory extends Command
{
    protected $signature = 'menu:import-prices {file}';

    public function handle(): void
    {
        $rows = json_decode(file_get_contents($this->argument('file')), true);

        foreach ($rows as $row) {
            Storyfeed::record(
                verb: 'reprice',
                object: MenuItem::findOrFail($row['menu_item_id']),
                actor: User::findOrFail($row['user_id']),
                data: ['from' => $row['from'], 'to' => $row['to']],
                publishedAt: $row['changed_at'],
            );
        }
    }
}
```
:::

<FeedExample :items="[backdated]" />

<a id="recording-many-objects-at-once"></a>

## Recording Multiple Objects

`->objects()` records one activity about a set of objects. It stores a parent
activity, plus one activity per object:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/UploadPhotosController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Photo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class UploadPhotosController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $photos = Photo::whereIn('id', $request->input('photos'))->get();

        $photos->each->update(['published_at' => now()]);

        Storyfeed::activity()
            ->by($request->user())
            ->verb('upload')
            ->objects($photos)
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/UploadPhotosController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Photo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Storyfeed\Facades\Storyfeed;

class UploadPhotosController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $photos = Photo::whereIn('id', $request->input('photos'))->get();

        $photos->each->update(['published_at' => now()]);

        Storyfeed::record(
            verb: 'upload',
            objects: $photos,
            actor: $request->user(),
        );

        return back();
    }
}
```
:::

The parent has no object of its own, so it needs its own headline, beside the
headline for the set:

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

Story::verb('upload')->grouped(fn (GroupBuilder $group) => $group->composite(
    ':actor uploaded :count photos', // the set
    ':actor uploaded photos',        // the parent activity
));
```

<FeedExample :items="[composite]" />

[Composites](/deeper/composites) covers how the parent and its activities read
in each mode.
