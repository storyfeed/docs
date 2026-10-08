# Installing the Kits

Storyfeed UI renders a page of activities with Blade, Vue or React components.
Install the package, then choose the kit your application uses.

```bash
composer require storyfeed/ui
```

| Kit | Setup | Requires |
|---|---|---|
| [Blade](/ui/blade) | package views, registered automatically | PHP 8.4+ in the PHP 8 series; Tailwind CSS v4 |
| [Vue](/ui/vue) | `php artisan storyfeed:ui vue` | Vue 3, TypeScript; Tailwind CSS v4 |
| [React](/ui/react) | `php artisan storyfeed:ui react` | React 19, TypeScript; Tailwind CSS v4 |

The service provider registers through Laravel package discovery.
All three kits use the same [colour tokens](/ui/customizing#colour-tokens).

The docs’ rendered examples use the shared Vue kit through `@storyfeed/ui`.

## Copying Vue or React

```bash
php artisan storyfeed:ui vue
# Or: php artisan storyfeed:ui react
```

The command copies components and their framework-free `shared/` directory to
`resources/js/components/storyfeed`. Commit those files with your application.

| File State | On Re-run |
|---|---|
| missing | writes the file |
| identical | skips the file |
| differing | keeps the application's file and reports it |

| Option | Effect |
|---|---|
| `--path=resources/js/my-feed` | changes the destination |
| `--diff` | prints unified diffs for differing files |
| `--force` | replaces differing files |

```bash
php artisan storyfeed:ui vue --diff
```

The command reports written, unchanged and differing files. Diffs need no
external tool. Copied files belong to your application and may be edited.

## Scanning Tailwind Utilities

For copied Vue or React components, add the directory if your app does not
already scan it:

```css memo="resources/css/app.css"
@source "../js/components/storyfeed";
```

For Blade, scan the package's views:

```css memo="resources/css/app.css"
@source "../../vendor/storyfeed/ui/resources/views";
```

Compile with `npm run build` and load the compiled CSS in your layout.
The kits need no separate stylesheet or Typography plugin.
