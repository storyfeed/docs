# Package Integration

<script setup>
import { scene } from '../.vitepress/theme/world'
const overriddenOrder = { ...scene.order, headline_template: ':actor submitted :object to :target' }
</script>

## Introduction

Ship activity definitions from your Laravel package's service provider.
Applications can use them without creating a feed file.

## Registering Stories in a Service Provider

A service provider can register stories without a feed file:

```php memo="A package service provider"
<?php

namespace Vendor\Orders;

use Illuminate\Support\ServiceProvider;
use Storyfeed\Facades\Story;
use Storyfeed\Grouping\GroupBuilder;

class OrderFeedServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Story::for('order')
            ->verb('place')
            ->headline(':actor placed :object with :target')
            ->icon('shopping-bag')
            ->grouped(
                fn (GroupBuilder $group) => $group
                    ->repeat(':actor made :count order placements with :target'),
            );
    }
}
```

<FeedExample :items="[scene.order]" />

The string `order` is the model's morph alias. Using the alias lets a package
register its stories before the application registers its morph map.

Provider registrations remain available when the configured definitions file
is missing or `definitions` is `false`. They are included when
[caching definitions](/basics/the-feed-file#caching-definitions). The repeat headline applies to
[grouped orders](/deeper/aggregation#repeated-activities).

## Overriding a Package's Stories {#overriding-package-stories}

In this example, an installed package defines the `place` verb for `order`
activities with the headline `:actor placed :object with :target`, a shopping-bag icon, and the
repeat-group headline `:actor made :count order placements with :target`. To change
only its single-activity headline, declare an explicit override:

```php memo="routes/feed.php"
use Storyfeed\Facades\Story;

Story::for('order')
    ->verb('place')
    ->override()
    ->headline(':actor submitted :object to :target');
```

<FeedExample :items="[overriddenOrder]" />

Only the headline changes. The package's shopping-bag icon and repeat-group
headline remain. Its Story class binding also remains when the application supplies only presentation fields.

For presentation fields, `override()` applies to the same object type and
verb. It takes precedence over the original declaration regardless of
registration order. [Wildcard precedence](/basics/the-feed-file#definition-precedence) still
applies between different keys.

| Supplied Option | What Changes |
|---|---|
| Headline, anonymous headline, icon, or intent | that value |
| Group headlines | each supplied axis headline; other axes remain |
| Casts | each supplied data key; other keys remain |
| Role constraints | each supplied role; other roles remain |
| Queue options | each supplied option; other options remain |
| Middleware, missing-role policy, or keep-latest policy | the whole supplied property |

Ordinary declarations from different source locations that claim the same
headline or icon key cause an error, even if their values are identical. Explicit
overrides from different source locations that claim the same field and key
also cause an error. Caching still requires unique story names.
