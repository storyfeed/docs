// where the order is placed: a controller, an action, a listener
use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($customer)
    ->action('place', $order)
    ->to($kitchen)
    ->publish();
