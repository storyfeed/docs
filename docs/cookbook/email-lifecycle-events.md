# Recording Email Lifecycle Events

Record the message as the object and the document it carries as the target.
A document's log can then show each send and its delivery outcomes.

<script setup>
import { scene } from '../.vitepress/theme/world'
const { sent, delivered, bounced, complaint, failed, timeline } = scene.cookbook.email
</script>

## Recording a Send

After the app successfully submits a message for sending, publish `send`:

::: code-group
```php [Fluent Syntax] memo="app/Actions/RecordSentEmail.php"
<?php

namespace App\Actions;

use App\Models\EmailMessage;
use App\Models\User;
use Storyfeed\Facades\Storyfeed;

class RecordSentEmail
{
    public function handle(EmailMessage $message, User $sender): void
    {
        // Called after successful submission; each attempt has its own message.
        Storyfeed::activity()
            ->by($sender)
            ->action('send', $message)
            ->to($message->document)
            ->data([
                'recipient' => $message->recipient,
                'provider' => $message->provider,
            ])
            ->publish();
    }
}
```

```php [Named Arguments] memo="app/Actions/RecordSentEmail.php"
<?php

namespace App\Actions;

use App\Models\EmailMessage;
use App\Models\User;
use Storyfeed\Facades\Storyfeed;

class RecordSentEmail
{
    public function handle(EmailMessage $message, User $sender): void
    {
        // Called after successful submission; each attempt has its own message.
        Storyfeed::record(
            verb: 'send',
            object: $message,
            actor: $sender,
            target: $message->document,
            data: [
                'recipient' => $message->recipient,
                'provider' => $message->provider,
            ],
        );
    }
}
```

:::

<FeedExample :items="[sent]" expanded />

`EmailMessage` and `Document` are [feedable models](/basics/feedable-models).
The message stores `recipient`, `provider` and a `document()` relationship.
Its feedable label identifies the send record, such as {{ sent.object.label }}.
Create a separate message record for each attempt, including an attempt that
fails before submission. Successful submission does not establish delivery.

Keep the recipient address and provider name in activity data when they are
values describing the event. An address does not need a party record. Use a
role when the provider is a participant you need to identify or query; see
[Parties](/deeper/parties#using-parties-in-other-roles) and
[Assigning Roles](/basics/recording#assigning-roles).

## Defining Lifecycle Headlines

Declare headlines on `EmailMessage`, whose type selects the definition:

```php memo="routes/feed.php"
use App\Models\EmailMessage;
use Storyfeed\Facades\Story;

Story::for(EmailMessage::class)->verb('send')
    ->headline(':actor sent :object carrying :target')
    ->anonymousHeadline(':object carrying :target was sent');

Story::for(EmailMessage::class)->verb('deliver')
    ->headline(':actor reported delivery of :object carrying :target')
    ->anonymousHeadline(':object carrying :target was delivered');

Story::for(EmailMessage::class)->verb('bounce')
    ->headline(':actor reported a bounce for :object carrying :target')
    ->anonymousHeadline(':object carrying :target bounced');

Story::for(EmailMessage::class)->verb('complain')
    ->headline(':actor reported :object carrying :target as spam')
    ->anonymousHeadline(':object carrying :target was reported as spam');

Story::for(EmailMessage::class)->verb('fail')
    ->headline(':actor could not send :object carrying :target')
    ->anonymousHeadline(':object carrying :target could not be sent');
```

<FeedExample :items="[sent, delivered, bounced, complaint, failed]" />

| Event | Verb | Actor | Object | Target | Activity Data |
|---|---|---|---|---|---|
| Sent | `send` | sender | message | document | recipient, provider |
| Delivered | `deliver` | none | message | document | recipient, provider |
| Bounced | `bounce` | none | message | document | recipient, provider |
| Spam complaint | `complain` | none | message | document | recipient, provider |
| Failed to send | `fail` | none | message | document | recipient, provider, reason |

Delivery, bounce, complaint and failure describe the message. The document
remains its target. These outcomes are alternative paths across separate
sends; a single message need not experience every outcome. Choose verbs for
the event's meaning, as in [Choosing a Verb](/cookbook/choosing-a-verb).

## Recording Anonymous Outcomes

Call this action from a verified webhook handler, or from the send-failure
branch. The caller maps the provider's event to one of the four verbs:

::: code-group
```php [Fluent Syntax] memo="app/Actions/RecordEmailOutcome.php"
<?php

namespace App\Actions;

use App\Models\EmailMessage;
use DateTimeInterface;
use InvalidArgumentException;
use Storyfeed\Facades\Storyfeed;

class RecordEmailOutcome
{
    public function handle(
        EmailMessage $message,
        string $verb,
        DateTimeInterface $occurredAt,
        ?string $reason = null,
    ): void {
        if (! in_array($verb, ['deliver', 'bounce', 'complain', 'fail'], true)) {
            throw new InvalidArgumentException('Unknown email outcome.');
        }

        $data = [
            'recipient' => $message->recipient,
            'provider' => $message->provider,
        ];

        if ($reason !== null) {
            $data['reason'] = $reason;
        }

        Storyfeed::anonymous() // no actor, including in an authenticated request
            ->action($verb, $message)
            ->to($message->document)
            ->data($data)
            ->publishedAt($occurredAt)
            ->publish();
    }
}
```

```php [Named Arguments] memo="app/Actions/RecordEmailOutcome.php"
<?php

namespace App\Actions;

use App\Models\EmailMessage;
use DateTimeInterface;
use InvalidArgumentException;
use Storyfeed\Facades\Storyfeed;

class RecordEmailOutcome
{
    public function handle(
        EmailMessage $message,
        string $verb,
        DateTimeInterface $occurredAt,
        ?string $reason = null,
    ): void {
        if (! in_array($verb, ['deliver', 'bounce', 'complain', 'fail'], true)) {
            throw new InvalidArgumentException('Unknown email outcome.');
        }

        $data = [
            'recipient' => $message->recipient,
            'provider' => $message->provider,
        ];

        if ($reason !== null) {
            $data['reason'] = $reason;
        }

        Storyfeed::record(
            verb: $verb,
            object: $message,
            target: $message->document,
            data: $data,
            publishedAt: $occurredAt,
            anonymous: true, // actor: null alone still allows a default actor
        );
    }
}
```

:::

<FeedExample :items="[failed]" expanded />

The failure branch uses `fail` with no recorded actor, just like the webhook
outcomes. An anonymous activity uses `anonymousHeadline()` when defined.
Otherwise, Storyfeed uses the ordinary headline. A required `:actor` token
in that headline displays as “Someone” when the actor is empty. Define the
anonymous sentence for every outcome. `missingHeadline()` applies to missing
entities and is a separate mechanism; see
[Anonymous Headlines](/deeper/parties#anonymous-headlines).

## Retrieving a Document's Email Log

To display all sends and outcomes for one document, filter by its target role
and use `log()`:

```php memo="routes/web.php"
use App\Models\Document;
use App\Models\EmailMessage;
use Illuminate\Support\Facades\Route;
use Storyfeed\Facades\Storyfeed;

// Apply the app's document authorization middleware to this route.
Route::get('/documents/{document}/email-activity',
    function (Document $document) {
        return Storyfeed::feed()
            ->target($document)
            ->objectType(EmailMessage::class)
            ->only(['send', 'deliver', 'bounce', 'complain', 'fail'])
            ->log()
            ->get();
    },
);
```

<FeedExample :items="timeline" />

The document target keeps all its messages in the same log. The message
object identifies which attempt each outcome belongs to. `log()` returns
one item per activity, newest first. For a broader document feed that also
includes its other activities, use `involving($document)`; see
[Retrieving Feeds](/basics/reading#filtering-by-entity-or-role).
