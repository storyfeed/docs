# What a fresh consumer writes today

Keep your app’s verbs, grammar, and icons. Remove Filament overrides that only
repeat the defaults.

```php
use Storyfeed\Facades\Storyfeed;
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Filament\FeedRendering;

// AppServiceProvider::boot(), after configuring your Feedable models.
Storyfeed::verbs(['upload' => ActivityType::Add]);

Storyfeed::grammar([
    'document.upload' => ':actor uploaded :object to :target',
]);

Storyfeed::icons([
    'document.upload' => 'file-up',
]);

FeedRendering::icons(fn (string $token) => match ($token) {
    'file-up' => 'heroicon-o-arrow-up-tray', // use an icon set installed in your app
    default => null,
});
```

Register your app’s verbs as described in
[Verbs](/basics/verbs), and keep its [aggregate grammar](/cookbook/grouped-headlines).
The [quickstart](/guide/quickstart) covers the models, recording, and reads.

## Delete these, keep those

| existing configuration | what to write today | why |
|---|---|---|
| `FeedRendering::timestamps(...)` reproducing a standard timestamp | remove it | the default is locale-aware: relative today, yesterday with a time, then a date and time, adding the year outside the current year |
| `days` set to match the surface | omit it | `null` gives a stream day headings and a record timeline none; a short timeline needs its rows more than repeated headings |
| `collapsed` set to match the surface | omit it | `null` opens timeline groups; elsewhere interactive groups start closed and non-interactive groups open, unless the node requests expansion |
| `stamp: true` | omit it | `stamp` defaults to `true`; the server render time helps a reader judge an unattended page’s age, even when the feed is empty |
| `interactive: false` on a kiosk or print surface with no controls | keep it | the server decides the state and omits inert toggle markup |
| your grammar and icon registrations | keep them | Storyfeed cannot write your app’s sentences and the plugin ships no icon set |

Keep an override when it expresses a choice that differs from these defaults.
A custom `FeedRendering::timestamps()` callback still replaces the whole
formatting ladder; its timestamp arrives already converted to the display zone.

## A surface without controls

```blade
{{-- $items are render-ready arrays from FeedPresenter, not raw payload nodes. --}}
@include('storyfeed-filament::feed', [
    'items' => $items,
    'interactive' => false,
])
```

Keep `interactive: false` when nobody can open a group. A page with no Alpine
that leaves it `true` still renders every member, but has no usable control.
Setting it to `false` removes that inert markup; it is not required to make the
members visible.

An ambient display that only needs summaries can also set `collapsed: true`.
That closes groups without offering a control to open them; a node requesting
expansion still wins. The print stylesheet opens groups on paper.

## Display timezone

```php
use Storyfeed\Filament\FeedRendering;

// AppServiceProvider::boot(): only if feeds should differ from Filament's zone.
FeedRendering::timezone('America/Toronto'); // a region identifier or UTC
```

The config twin is `storyfeed-filament.timezone`, set from
`STORYFEED_TIMEZONE` by default. `FeedRendering::timezone()` also accepts a
closure evaluated per render, for a zone chosen from the current tenant or
location.

| priority | source |
|---|---|
| 1 | the component’s `->timezone(...)` override |
| 2 | `FeedRendering::timezone(...)` |
| 3 | `config('storyfeed-filament.timezone')` |
| 4 | `FilamentTimezone::get()`, which falls back to `config('app.timezone')` |

An unset value defers to the next source. If you already set
`FilamentTimezone::set()`, feeds inherit it without another registration.
Timezone conversion applies to displayed timestamps and the render stamp;
storage is unchanged. Use a region such as `America/Toronto` or `UTC`; fixed
offsets and abbreviations such as `EST` are rejected.
