use Storyfeed\Facades\Storyfeed;

Storyfeed::activity()
    ->by($customer)
    ->action('place', $order)
    ->to($shop)
    ->publish();
