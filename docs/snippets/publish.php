// where the order is placed: a controller, an action, a listener
Storyfeed::activity()
    ->by($customer)
    ->action('order.placed', $order)
    ->to($kitchen)
    ->publish();
