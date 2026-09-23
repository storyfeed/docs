<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use Storyfeed\Facades\Storyfeed;

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
