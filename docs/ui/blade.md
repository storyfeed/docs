# Blade

The Blade kit renders a feed page with one component.
Install `storyfeed/ui` and [scan its Tailwind utilities](/ui/installation#scanning-tailwind-utilities).

```php memo="routes/web.php"
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

Route::get('/history', fn () => view('history', [
    'page' => Storyfeed::feed()->get(),
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

All use the `storyfeed::` namespace. Raw JSON can use
`:items="$payload['items']"` and `:next-cursor="$payload['next_cursor']"`.
The `empty` slot replaces empty-page text; `footer` replaces the pager.

## Rails and Groups

```blade
<x-storyfeed::feed :page="$page" rail="actor" child-rail="activity-only" />
```

`rail` accepts `actor`, `activity`, `actor-only` and `activity-only`.
The default is `actor-only`, with `activity-only` for group children.
An explicit `child-rail` controls children independently; without an override,
children inherit the parent posture and dense rows suppress badges.

| Option | Behaviour |
|---|---|
| `:grouped="false"` | hides day headings |
| `dividers` | labels keyed by public item ID |
| `divider-style="dot|branch"` | divider joint |
| `timezone` | display zone for days and timestamps |
| `interactive`, `collapsed` | group disclosure and initial state |

Native `details` works without JavaScript. Unspecified state opens unnamed
groups, or all groups when `interactive` is false. Payload `expanded` opens a
group. Static collapsed members remain available to print.
The server renders timestamps; the host owns refreshing them.

## Registering App Components

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\Ui\Support\BodyComponents;

app(BodyComponents::class)->register('App/Message', 'feed.message');
```

A Component body named `App/Message` renders `<x-feed.message>` with its
`props`. Unregistered names draw nothing. The mapped component must exist.
Whole-feed `renderers` callbacks customize time, body, annotations, media,
file labels and object icons. These are trusted app callbacks returning HTML.
See [Host Seams](/ui/customizing#blade-host-seams).

## Publishing Views

```bash
php artisan vendor:publish --tag=storyfeed-views
```

Views land in `resources/views/vendor/storyfeed`; keep the ones you change.
Add glyph views under `icons/`, named for the payload's glyph token.
Unmapped tokens use `icons/activity`. Custom body `Acme/Attachment` uses
`components/body/acme/attachment.blade.php`, receiving `$body` and `$entity`.

Kit words such as “Older activity” use Laravel's `__()` function and can be
translated in `lang/{locale}.json`.
See the [package README](https://github.com/storyfeed/ui/blob/main/README.md)
for the full Blade component and callback contracts.
