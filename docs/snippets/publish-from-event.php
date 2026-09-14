namespace App\Events;

use Storyfeed\Contracts\PublishesToFeed; // [!code focus]
use Storyfeed\PendingActivity; // [!code focus]

class DocumentUploaded implements PublishesToFeed // [!code focus]
{
    public function __construct(public Document $document, public User $user) {}

    public function toFeedStory(): ?PendingActivity // [!code focus]
    { // [!code focus]
        return Storyfeed::activity() // [!code focus]
            ->by($this->user) // [!code focus]
            ->action('upload', $this->document) // [!code focus]
            ->to($this->document->project); // [!code focus]
    } // [!code focus]
}
