# The Feed File

Define activity headlines, icons, and group headlines in `routes/feed.php`.
The [installer](/guide/installation#running-the-installer) creates this file.

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

A headline describes an activity using a template:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object with :target');
```

<FeedExample :items="[withoutIcon]" />

<a id="publishing-a-verb"></a>

The `for` method specifies the object type, and the `verb` method specifies
the [recorded verb](/basics/recording). This headline applies to `place`
activities involving an order.

## Headline Templates

<a id="tokens"></a>

### Role Tokens

| Token | Entity |
|---|---|
| `:actor` | who performed the action |
| `:object` | the entity acted on |
| `:target` | the entity the action was directed at |
| `:context` | the containing entity |
| `:origin` | the source |
| `:result` | the entity produced |
| `:instrument` | the tool or service used |

Each token is replaced with the entity's label and linked when it has a URL.

### Optional Segments

Enclose an optional phrase in square brackets to include it only when its
referenced roles are filled:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)
    ->verb('place')
    ->headline(':actor placed :object[ with :target]');
```

<FeedExample :items="[placedAtCounter, scene.order]" />

Storyfeed resolves optional segments before returning the payload. In this
example, it includes ` with :target` only when the activity has a target.
Without brackets, an empty role leaves its token in the template.

<a id="choosing-a-headline-per-activity"></a>

### Dynamic Headlines

To choose a headline for each activity, pass a closure that returns a template:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;
use Storyfeed\ActivityContext;

Story::for(Order::class)
    ->verb('place')
    ->headline(
        fn (ActivityContext $activity) => $activity->boolean('rush')
            ? ':actor rushed :object to :target'
            : ':actor placed :object with :target',
    );
```

<FeedExample :items="[rushed, scene.order]" />

The closure receives an [ActivityContext](/reference/feedable#activitycontext),
which provides typed helpers for the activity’s data and accessors for its roles.
It runs when Storyfeed retrieves the feed. Returned role tokens are
rendered as entity labels and links. Text without role tokens is displayed
unchanged.

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

Use the `intent` method to assign an application-defined value, such as
`success` or `danger`. Storyfeed returns it in the `glyph_intent` field:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('complete')->icon('receipt')->intent('success');
```

<FeedExample :items="[completeWithIntent]" expanded />

See [Rendering](/basics/rendering#glyphs-and-intents) to display the icon and
apply its intent.

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

All verb definitions inside the closure apply to orders.

<a id="conventional-model-verbs"></a>

## Resource Definitions

The `resource` method on the `Story` facade defines `create`, `update`, `delete`,
and `restore` for a model:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::resource(Order::class);
```

<FeedExample :items="[created]" />

| Verb | Headline | Icon |
|---|---|---|
| `create` | `:actor created :object` | `plus` |
| `update` | `:actor updated :object` | `pencil` |
| `delete` | `:actor deleted :object` | `trash` |
| `restore` | `:actor restored :object` | `rotate-ccw` |

Use the `only` or `except` methods to select resource verbs. Exclude a verb
before defining it separately:

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::resource(Order::class)->except('update');

Story::for(Order::class)->verb('update')->headline(':actor changed :object');
```

Defining the same verb in both places causes an error with both source locations.

## Definition Precedence

Storyfeed applies definitions in this order, from most to least specific:

| Declaration | Matches |
|---|---|
| `Story::for(Order::class)->verb('place')` | that verb on that object type |
| `Story::for(Order::class)->fallback()` | every verb on that object type |
| `Story::verb('place')` | that verb on any object type |
| `Story::fallback()` | everything with no more specific entry |

This precedence applies to both headlines and intents. Use a fallback to
define a headline for order verbs without their own definition:

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

You may also define [group headlines](/deeper/aggregation#defining-group-headlines)
and [headlines for deleted models](/deeper/deleted-models).

## Listing Definitions

List the definitions loaded by your application:

```bash
php artisan storyfeed:list
```

Use `--type=order` or `--verb=place` to filter definitions, and `--json` for JSON
output. Each entry includes the headline, icon, and declaration location.
See [Commands](/reference/commands) for all options.

## Caching Definitions

Cache definitions during deployment:

```bash
php artisan storyfeed:cache
```

Storyfeed loads cached definitions without evaluating `routes/feed.php`.
The `optimize` Artisan command also caches these definitions. Rebuild the cache
after changing them. To clear it:

```bash
php artisan storyfeed:clear
```

Storyfeed serializes closure headlines into the cache. If a closure cannot be
serialized, the command fails and reports its source location. See
[Commands](/reference/commands#manifest).
