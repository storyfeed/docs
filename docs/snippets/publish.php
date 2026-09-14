// where the order is placed: a controller, an action, a listener
Storyfeed::activity()
    ->by($customer)
    ->action('placed', $order)
    ->to($kitchen)
    ->publish();
