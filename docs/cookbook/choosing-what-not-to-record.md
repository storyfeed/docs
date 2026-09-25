# Choosing What Not to Record

Publish an activity only when a reader of the feed would want to see it.
Most events in an app, such as drafts, saves and background work, record
nothing.

<span id="events-to-omit"></span>

## Choosing Events to Record

| What Happened | Activity | Because |
|---|---|---|
| a model created as a draft | no | see [Choosing when to publish](/cookbook/choosing-when-to-publish) |
| a save with no status change | no | see [Choosing when to publish](/cookbook/choosing-when-to-publish) |
| the text of a note edited | no | the note is the story; its edit is not |
| a background index, a cache rebuild, a dirty flag set | no | no reader did anything |
| someone typing, or coming online | no | it stops being true within seconds |
| a field-level audit row | no | an audit log is its own surface |
| a status transition | yes | see [Choosing when to publish](/cookbook/choosing-when-to-publish) |
| a question asked about a menu item | yes | the sentence names what was asked about |
| an order placed | yes | |
| an order viewed | yes, for a while | its verb declares a [retention window](/deeper/retention) |

## Skipping Publication

```php memo="app/Events/OrderPlaced.php"
<?php

namespace App\Events;

use App\Models\Order;
use App\Models\User;
use Storyfeed\Contracts\PublishesToFeed;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\PendingActivity;

class OrderPlaced implements PublishesToFeed
{
    public function __construct(public Order $order, public User $customer) {}

    public function toFeedActivity(): ?PendingActivity
    {
        if ($this->order->status === 'draft') {
            return null;                                 // not an activity
        }

        return Storyfeed::activity()
            ->by($this->customer)
            ->action('place', $this->order)
            ->to($this->order->shop);
    }
}
```

Returning `null` publishes nothing. See
[Publishing from Events](/deeper/events).

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Storyfeed;

Storyfeed::verbs([
    'place' => ActivityType::Create,
    'ask' => ActivityType::Create,
]);
```

```php memo="routes/feed.php"
use App\Models\Order;
use Storyfeed\Facades\Story;

Story::for(Order::class)->verb('place')
    ->headline(':actor placed :object with :target');
```

## Recording Notes

```php memo="routes/feed.php"
use App\Models\Note;
use Storyfeed\Facades\Story;

Story::for(Note::class)->verb('ask')
    ->headline(':actor asked about :target');
```

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/DishQuestionController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\AskQuestionRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class DishQuestionController extends Controller
{
    public function store(
        AskQuestionRequest $request,
        MenuItem $product,
    ): RedirectResponse {
        $note = $product->notes()->create([
            'user_id' => $request->user()->id,
            'body' => $request->validated('body'),
        ]);

        Storyfeed::activity()
            ->by($request->user())
            ->action('ask', $note)
            ->on($product)
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/DishQuestionController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\AskQuestionRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;

class DishQuestionController extends Controller
{
    public function store(
        AskQuestionRequest $request,
        MenuItem $product,
    ): RedirectResponse {
        $note = $product->notes()->create([
            'user_id' => $request->user()->id,
            'body' => $request->validated('body'),
        ]);

        Storyfeed::record(
            verb: 'ask',
            object: $note,
            actor: $request->user(),
            target: $product,
        );

        return back();
    }
}
```
:::

<script setup>
import { scene } from '../.vitepress/theme/world'
const question = scene.question
</script>

<FeedExample :items="[question]">
  <template #body="{ node }"><FeedBody :node="node" /></template>
</FeedExample>

The quote comes from the note's snapshot. Give the `Note` model this contract,
and register its `note` morph alias as in
[Feedable Models](/basics/feedable-models):

::: code-group

```php [Fluent Syntax] memo="app/Models/Note.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Component;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Note extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make()
            ->label($this->body)
            ->body(Component::make()
                ->name('Note')
                // full text, not a shortened preview
                ->props(['excerpt' => $this->body]));
    }
}
```

```php [Named Arguments] memo="app/Models/Note.php"
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Storyfeed\Body\Component;
use Storyfeed\Concerns\InteractsWithFeed;
use Storyfeed\Contracts\Feedable;
use Storyfeed\FeedEntity;

class Note extends Model implements Feedable
{
    use InteractsWithFeed;

    public function toFeed(): FeedEntity
    {
        return FeedEntity::make(
            label: $this->body,
            body: Component::make(
                name: 'Note',
                // full text, not a shortened preview
                props: ['excerpt' => $this->body],
            ),
        );
    }
}
```

:::

The `Component` body names `Note`, a component your frontend supplies; here it
shows the `excerpt` prop in a blockquote.

### Updating the Note's Content

Saving the note refreshes its snapshot, so every row that references it shows
the edited text without a new activity. Without `InteractsWithFeed`, refresh
the snapshot yourself.

## Recording Activity Quotes

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/DishQuestionController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\AskQuestionRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedThread;

class DishQuestionController extends Controller
{
    public function store(
        AskQuestionRequest $request,
        MenuItem $product,
    ): RedirectResponse {
        $note = $product->notes()->create([
            'user_id' => $request->user()->id,
            'body' => $request->validated('body'),
        ]);

        Storyfeed::activity()
            ->by($request->user())
            ->action('ask', $note)
            ->on($product)
            ->thread(FeedThread::make(text: $note->body))
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/DishQuestionController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\AskQuestionRequest;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedThread;

class DishQuestionController extends Controller
{
    public function store(
        AskQuestionRequest $request,
        MenuItem $product,
    ): RedirectResponse {
        $note = $product->notes()->create([
            'user_id' => $request->user()->id,
            'body' => $request->validated('body'),
        ]);

        Storyfeed::record(
            verb: 'ask',
            object: $note,
            actor: $request->user(),
            target: $product,
            thread: FeedThread::make(text: $note->body),
        );

        return back();
    }
}
```
:::

Use this when the words should be stored on the activity rather than read
from the note. The renderer receives them as `node.thread.text`; drop the
`Note` component body so the text is not shown twice. See [Activity Content](/basics/activity-content) for the quote fields.

When the object is the discussion itself, each activity can carry the reply it
is about:

```php memo="app/Providers/AppServiceProvider.php" at="boot()"
use Storyfeed\ActivityStreams\ActivityType;
use Storyfeed\Facades\Storyfeed;

Storyfeed::verbs(['reply' => ActivityType::Create]);
```

```php memo="routes/feed.php"
use App\Models\Discussion;
use Storyfeed\Facades\Story;

Story::for(Discussion::class)->verb('reply')
    ->headline(':actor replied about :target');
```

::: code-group
```php [Fluent Syntax] memo="app/Http/Controllers/DiscussionReplyController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReplyRequest;
use App\Models\Discussion;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedThread;

class DiscussionReplyController extends Controller
{
    public function store(
        StoreReplyRequest $request,
        MenuItem $product,
        Discussion $discussion,
    ): RedirectResponse {
        $reply = $discussion->replies()->create([
            'user_id' => $request->user()->id,
            'body' => $request->validated('body'),
        ]);

        Storyfeed::activity()
            ->by($request->user())
            ->action('reply', $discussion)
            ->on($product)
            ->thread(FeedThread::make(text: $reply->body))
            ->publish();

        return back();
    }
}
```

```php [Named Arguments] memo="app/Http/Controllers/DiscussionReplyController.php"
<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReplyRequest;
use App\Models\Discussion;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Storyfeed\Facades\Storyfeed;
use Storyfeed\FeedThread;

class DiscussionReplyController extends Controller
{
    public function store(
        StoreReplyRequest $request,
        MenuItem $product,
        Discussion $discussion,
    ): RedirectResponse {
        $reply = $discussion->replies()->create([
            'user_id' => $request->user()->id,
            'body' => $request->validated('body'),
        ]);

        Storyfeed::record(
            verb: 'reply',
            object: $discussion,
            actor: $request->user(),
            target: $product,
            thread: FeedThread::make(text: $reply->body),
        );

        return back();
    }
}
```
:::

### Preserving Quoted Text

Editing the note or discussion does not change a stored `FeedThread`. To keep
only the latest reply, see [Repeating Activities](/cookbook/repeating-activities).

`FeedThread` is for what a person said. A quoted passage with a source is the
[`Excerpt` body type](/basics/activity-content).
