# Package Integration

Ship activity definitions from your Laravel package's service provider.
Applications can use them without creating a feed file.

<script setup>
import { scene } from '../.vitepress/theme/world'
</script>

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
                    ->repeat(':actor placed :count orders with :target'),
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

Applications can [override supplied fields of a package story](/basics/the-feed-file#overriding-package-stories)
in their feed file.
