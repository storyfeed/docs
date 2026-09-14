<?php

namespace App\Listeners;

class RecordOrderPlaced
{
    public function handle(OrderPlaced $event): void
    {
        Storyfeed::activity()
            ->by($event->customer)
            ->action('order.placed', $event->order)
            ->to($event->order->kitchen)
            ->publish();
    }
}
