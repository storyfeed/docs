<?php

namespace App\Listeners;

class RecordOrderPlaced
{
    public function handle(OrderPlaced $event): void
    {
        Storyfeed::activity()
            ->by($event->customer)
            ->action('place', $event->order)
            ->to($event->order->kitchen)
            ->publish();
    }
}
