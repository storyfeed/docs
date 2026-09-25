# The Feed File

`routes/feed.php` declares what each verb's activities say: the headline, the
icon, and how a group of them reads, the way `routes/web.php` declares your
routes. The [installer](/guide/installation#running-the-installer) creates it.

<script setup>
import { scene } from '../.vitepress/theme/world'

// Presentation variants of catalogue facts, as different feed definitions render them.
const withoutIcon = { ...scene.order, glyph: null }
const complete = { ...scene.basics.feedFile.completed, glyph: 'receipt' }
const completeWithIntent = { ...complete, glyph_intent: 'success' }
const completeWithoutIcon = { ...complete, glyph: null }
const placedAtCounter = { ...scene.order, target: null, headline_template: ':actor placed :object' }
const rushed = { ...scene.order, headline_template: ':actor rushed :object to :target', data: { rush: true } }
const created = scene.basics.feedFile.created
// An order verb with no definition of its own, read through the order fallback.
const ready = scene.basics.activityContent.ready
const fellBack = { ...ready, headline_template: ':actor updated :object', glyph: null,
  object: { ...ready.object, body: null } }
</script>

## Basic Definitions

<a id="loading-the-feed-file"></a>
<a id="registering-a-headline"></a>

### Defining a Headline

A headline is the sentence the feed prints for an activity:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object with :target');
```

<FeedExample :items="[withoutIcon]" />

<a id="publishing-a-verb"></a>

`for()` names the object's type, and `verb()` names the verb you
[record](/basics/recording). This headline is for the verb `place`, recorded
about an order.

The template names roles, never models:

```php
// ✗ not tokens: these render as text
->headline(':customer placed :order with :shop')

// ✓
->headline(':actor placed :object with :target')
```

## Headline Templates

<a id="tokens"></a>

### Role Tokens

| Token | Substitutes |
|---|---|
| `:actor` | who acted |
| `:object` | what the activity acted on |
| `:target` | what the activity was directed at |
| `:context` | the surrounding container |
| `:origin` | the source |
| `:result` | the produced entity |
| `:instrument` | the tool or service used |

Each token becomes the label of the entity in that role, linked where it has a
link.

### Optional Segments

Square brackets mark words that print only when the roles inside them are
filled:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object[ with :target]');
```

<FeedExample :items="[placedAtCounter, scene.order]" />

Storyfeed resolves the brackets before the template reaches the payload. An
order placed with a shop keeps ` with :target`; one placed without a target
drops it. Without brackets, an unfilled role leaves its token in the template. Use optional segments for roles the activity may omit.

<a id="choosing-a-headline-per-activity"></a>

### Dynamic Headlines

A closure receives the activity and returns a template:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\Models\Activity;

Story::for(Order::class)
    ->verb('place')
    ->headline(fn (Activity $activity) => ($activity->data['rush'] ?? false)
        ? ':actor rushed :object to :target'
        : ':actor placed :object with :target');
```

<FeedExample :items="[rushed, scene.order]" />

The closure runs when the feed is read. When it returns role tokens, they
become links, like any other template. Text with no role tokens prints as
written.

<a id="adding-an-icon"></a>

## Icons and Intents

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object with :target')
    ->icon('shopping-bag');

Story::for(Order::class)
    ->verb('complete')
    ->headline(':actor completed :object')
    ->icon('receipt');
```

<FeedExample :items="[complete, scene.order]" />

`intent()` names what the icon means, in your app's own word, such as
`success` or `danger`. It arrives in the payload as `glyph_intent`, beside the
icon:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('complete')->icon('receipt')->intent('success');
```

<FeedExample :items="[completeWithIntent]" expanded />

[Rendering](/basics/rendering#glyphs-and-intents) covers drawing it.

<a id="several-verbs-on-one-model"></a>

## Definition Groups

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->group(function () {
    Story::verb('place')->headline(':actor placed :object with :target');
    Story::verb('complete')->headline(':actor completed :object');
});
```

<FeedExample :items="[completeWithoutIcon, withoutIcon]" />

Every `Story::verb()` inside the closure is for orders.

<a id="conventional-model-verbs"></a>

## Resource Definitions

`Story::resource()` defines `create`, `update`, `delete` and `restore` for a
model in one line:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::resource(Order::class);
```

<FeedExample :items="[created]" />

| Verb | Headline | Without an actor | Icon |
|---|---|---|---|
| `create` | `:actor created :object` | `:object was created` | `plus` |
| `update` | `:actor updated :object` | `:object was updated` | `pencil` |
| `delete` | `:actor deleted :object` | `:object was deleted` | `trash` |
| `restore` | `:actor restored :object` | `:object was restored` | `rotate-ccw` |

Narrow it with `only()` or `except()`, and define a verb yourself to say
something else:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::resource(Order::class)->except('update');

Story::for(Order::class)->verb('update')->headline(':actor changed :object');
```

A verb defined in both places is an error naming both lines.

## Definition Precedence

The most specific definition wins:

| Declaration | Matches |
|---|---|
| `Story::for(Order::class)->verb('place')` | that verb on that object type |
| `Story::for(Order::class)->fallback()` | every verb on that object type |
| `Story::verb('place')` | that verb on any object type |
| `Story::fallback()` | everything with no more specific entry |

The same order applies to headlines and to intents. A fallback gives every
order verb without its own definition one headline:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->fallback()->headline(':actor updated :object');
```

<FeedExample :items="[fellBack]" />


<a id="headlines-for-a-group"></a>
<a id="group-headlines"></a>
<a id="roles-that-determine-redundancy"></a>
<a id="headlines-for-deleted-models"></a>

A verb's definition can also say how a group of its activities reads, and what
its activities say once a model they name is deleted.
[Aggregation](/deeper/aggregation#defining-group-headlines) and
[Deleted Models](/deeper/deleted-models) cover both.

## Listing Definitions

List the definitions loaded by your application:

```bash
php artisan storyfeed:list
```

Use `--type=order` or `--verb=place` to filter the list, and `--json` for
machine-readable rows. The output includes the headline, icon and declaration
location. [Commands](/reference/commands) lists the inspection options.

## Caching Definitions

Cache definitions during deployment:

```bash
php artisan storyfeed:cache
```

Storyfeed loads the cached manifest instead of evaluating `routes/feed.php` at
boot. `php artisan optimize` runs it too. Rebuild the cache after changing
definitions. To remove it:

```bash
php artisan storyfeed:clear
```

Closure headlines are serialised into the cache. A closure that cannot be serialised fails the command and identifies its source location. See [Commands](/reference/commands#manifest).
