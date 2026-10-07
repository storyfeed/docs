# Curated Timelines

Use a small domain model for each entry in a product history, milestone feed,
or changelog. The model is the activity's object and supplies its label and body.

<script setup>
import { curatedMilestone } from '../.vitepress/theme/curated-timeline'
</script>

## Defining a Milestone

A `Milestone` model can keep a source page's share-preview title, description,
and image alongside the entry's name:

::: code-group
```php [Fluent Syntax] memo="app/Models/Milestone.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\MediaObject;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;
use Storyfeed\FeedMedia;

class Milestone extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label($this->name)
            ->data('preview_url', $this->source_image_url)
            ->body(
                MediaObject::make()
                    ->subject(FeedLink::make($this->source_title, $this->source_url))
                    ->content($this->source_description)
                    ->withPreview(),
            );
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make()->preview($context->data('preview_url'));
    }
}
```

```php [Named Arguments] memo="app/Models/Milestone.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\MediaObject;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedContext;
use Storyfeed\FeedEntity;
use Storyfeed\FeedLink;
use Storyfeed\FeedMedia;
use Storyfeed\MediaSlot;

class Milestone extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->name,
            data: ['preview_url' => $this->source_image_url],
            body: MediaObject::make(
                subject: FeedLink::make(label: $this->source_title, href: $this->source_url),
                content: $this->source_description,
                image: MediaSlot::Preview,
            ),
        );
    }

    public static function feedMedia(FeedContext $context): ?FeedMedia
    {
        return FeedMedia::make(preview: $context->data('preview_url'));
    }
}
```
:::

The `MediaObject` links to the source page; `feedMedia()` supplies its preview
image. Choose [another body type](/basics/activity-content#introduction) when the
evidence is a passage, photo, or set of values.

## Recording a Milestone

For an unveiling, the entry names the product. The person and event are
[parties](/deeper/parties#recording-a-party):

| Milestone Column | Value |
|---|---|
| `name` | `Storyfeed` |
| `source_title` | `Storyfeed Documentation` |
| `source_description` | `The activity feed pattern for Laravel.` |
| `source_url` | `https://docs.storyfeed.dev` |
| `source_image_url` | `https://docs.storyfeed.dev/og-image.jpg` |

```php memo="routes/feed.php"
use App\Models\Milestone;
use Storyfeed\Facades\Story;

Story::for(Milestone::class)->verb('unveil')
    ->headline(':actor unveiled :object at :target');
```

Publish the saved milestone from its controller:

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/PublishMilestoneController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Milestone;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class PublishMilestoneController
{
    public function __invoke(Milestone $milestone): RedirectResponse
    {
        Storyfeed::activity()
            ->by('Jasper')
            ->action('unveil', $milestone)
            ->to('GPUG')
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/PublishMilestoneController.php"
<?php

namespace App\Http\Controllers;

use App\Models\Milestone;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class PublishMilestoneController
{
    public function __invoke(Milestone $milestone): RedirectResponse
    {
        Storyfeed::record(
            verb: 'unveil',
            object: $milestone,
            actor: 'Jasper',
            target: 'GPUG',
        );

        return back();
    }
}
```
:::

<FeedExample :items="[curatedMilestone]" />

A party's [link](/deeper/parties#linking-a-party) leads to its own home;
the body card links to the source for this entry.
