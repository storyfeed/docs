# Reading feeds

```php
$page = Storyfeed::feed()
    ->context($project)
    ->limit(20)
    ->get();
```

`$page` is a `FeedPage` — the payload envelope, ready to return from a route:

```php
Route::get('/feed', fn () => Storyfeed::feed()->limit(20)->get());
```

```jsonc
{
  "payload_version": 1,
  "items": [ /* activity nodes and group nodes, newest first */ ],
  "next_cursor": "eyJ...",
  "sync_token": null
}
```

`FeedPage` is `Arrayable`, `JsonSerializable`, `Responsable`, and read-only
`ArrayAccess` — `$page['items']` works the same in PHP as client-side.

## Read modes

| call | industry name | returns |
|---|---|---|
| `->log()` | timeline | one node per activity, no groups |
| `->live()` | aggregated (active window) | groups as they form |
| `->summary()` | aggregated (collapsed) | the best-axis view — **the default** |

The app-wide default is `grouping.default` in the config; per-view calls
always override. Mode names never appear in the payload — which mode a view
uses is a server-side choice renderers know nothing about.

## Scoping

```php
Storyfeed::feed()->context($project)     // one entity's feed
Storyfeed::feed()->actor($user)          // one actor's activity
Storyfeed::feed()->verb('upload')        // one verb
Storyfeed::feed()->object($document)
Storyfeed::feed()->target($customer)
```

`->for($model)` is the target alias, matching the recording side. Scopes
combine.

## Pagination

Pass the previous page's `next_cursor` back:

```php
$page = Storyfeed::feed()->cursor($request->query('cursor'))->get();
```

Cursors are opaque — store them, never parse them. Two rules that prevent real
bugs:

::: warning EMPTY ≠ DONE
Only a null `next_cursor` ends the feed. A page can legally return zero items
with a live cursor; follow it while empty, bounded to a few hops.
:::

::: warning SYNC TOKEN
Store `sync_token` and compare on each page. When it changes, settled history
was rewritten server-side: drop all accumulated nodes and refetch from the
head. Equality compare only — `null → non-null` counts as a change.
:::

If your client accumulates pages and polls for new ones, the token is one of
three rules you need — see
[Reconciling updates](/basics/rendering#reconciling-updates).

## Conditional building

`FeedBuilder` is `Conditionable`:

```php
Storyfeed::feed()
    ->when($request->project, fn ($feed, $project) => $feed->context($project))
    ->get();
```
