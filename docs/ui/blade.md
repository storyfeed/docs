# Blade

The Blade kit renders a feed page with one component.
Install `storyfeed/ui` and [scan its Tailwind utilities](/ui/installation#scanning-tailwind-utilities).

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/history', fn () => view('history', [
    'page' => Storyfeed::feed()->cursorPaginate(),
]));
```

```blade memo="resources/views/history.blade.php"
<x-storyfeed::feed :page="$page" />
```

<script setup>
import { scene, liveOf } from '../.vitepress/theme/world'
</script>

<FeedExample :items="liveOf(scene.deeper.aggregation.orders)" />

The layout must load compiled CSS, for example with `@vite('resources/css/app.css')`.
Attributes such as `class` land on the feed's root element.

## Choosing Components

| Component | Renders |
|---|---|
| `feed` | a page and a link to older activity |
| `item` | an activity or group |
| `activity`, `group` | one row; group members behind a disclosure |
| `headline` | linked headline entities |
| `glyph`, `avatar`, `rail` | row markers |
| `time`, `media`, `body` | a timestamp, picture or body |
| `pager`, `divider`, `media-strip` | navigation and group presentation |

All use the `storyfeed::` namespace. `page` takes what `get()`,
`cursorPaginate()` or `simplePaginate()` returns, or its JSON decoded as an
array. To render items you hold yourself, pass `:items="$items"` and
`:next-cursor="$cursor"`.
The `empty` slot replaces empty-page text; `footer` replaces the pager.

## Rails and Groups

```blade memo="resources/views/history.blade.php"
<x-storyfeed::feed :page="$page" rail="actor" child-rail="activity-only" />
```

`rail` accepts `actor`, `activity`, `actor-only` and `activity-only`.
The default is `actor-only`, with `activity-only` for group children.
An explicit `child-rail` controls members independently; otherwise they
inherit the group’s rail. Members omit badges. See the
[rail and group examples](/ui/vue#rails-and-groups).

| Option | Behaviour |
|---|---|
| `:grouped="false"` | hides day headings |
| `dividers` | labels keyed by public item ID |
| `divider-style="dot|branch"` | a dot on the rail or a branch off it |
| `timezone` | display zone for days and timestamps |
| `interactive`, `collapsed` | group disclosure and initial state |

Native `details` works without JavaScript. By default, groups without a
headline open; with `:interactive="false"`, every group opens. Static collapsed members remain available to print.
Timestamps are rendered once on the server; refresh them in your own
JavaScript if needed.

The disclosure says “Show less” when open and “Show all 3” for a collapsed
three-member group. If the response limits the children, it reports how many
are not shown. Expanding displays the supplied children; it does not fetch more.

## Registering App Components

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Ui\Support\BodyComponents;

app(BodyComponents::class)->register('App/Message', 'feed.message');
```

A Component body named `App/Message` renders `<x-feed.message>` with its
`props`. A name that is not registered renders nothing.

See [Host Seams](/ui/customizing#blade-host-seams).

## Publishing Views

```bash
php artisan vendor:publish --tag=storyfeed-views
```

Views land in `resources/views/vendor/storyfeed`; keep the ones you change.
Add icon views under `icons/`, named for the payload's glyph token.
Unmapped tokens use `icons/activity`. Custom body `Acme/Attachment` uses
`components/body/acme/attachment.blade.php`, receiving `$body` and `$entity`.

The kit’s own strings, such as “Older activity”, are translatable through
`lang/{locale}.json`. The [role words after the time](/ui/customizing#roles-after-the-time)
and the date-range words (“from”, “until”) are in the `storyfeed-ui::meta`
namespace; override them in `lang/vendor/storyfeed-ui/{locale}/meta.php`.
See the [package README](https://github.com/storyfeed/ui/blob/main/README.md)
for the full Blade component and callback contracts.
